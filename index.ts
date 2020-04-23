declare let process: any;

function stringifiable(obj: any) {
  // Safely stringify Object.create(null)
  return typeof obj === 'object' && !('toString' in obj) ?
    Object.prototype.toString.call(obj).slice(8, -1) :
    obj;
}

const isProduction = typeof process === 'object' && process.env.NODE_ENV === 'production';
function invariant(condition: boolean, message: () => string) {
  if (!condition) {
    /* istanbul ignore next */
    if (isProduction) {
      throw new Error('Invariant failed');
    }
    throw new Error(message());
  }
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
const splice = Array.prototype.splice;

const toString = Object.prototype.toString;
function type<T>(obj: T) {
  return (toString.call(obj) as string).slice(8, -1);
}

const assign = Object.assign || /* istanbul ignore next */ (<T, S>(target: T, source: S) => {
  getAllKeys(source).forEach(key => {
    if (hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  });
  return target as T & S;
});

const getAllKeys = typeof Object.getOwnPropertySymbols === 'function'
  ? obj => Object.keys(obj).concat(Object.getOwnPropertySymbols(obj) as any)
  /* istanbul ignore next */
  : obj => Object.keys(obj);

function copy<T, U, K, V, X>(
  object: T extends ReadonlyArray<U>
    ? ReadonlyArray<U>
    : T extends Map<K, V>
      ? Map<K, V>
      : T extends Set<X>
        ? Set<X>
        : T extends object
          ? T
          : any,
) {
  return Array.isArray(object)
    ? assign(object.constructor(object.length), object)
    : (type(object) === 'Map')
      ? new Map(object as Map<K, V>)
      : (type(object) === 'Set')
        ? new Set(object as Set<X>)
        : (object && typeof object === 'object')
          ? assign(Object.create(Object.getPrototypeOf(object)), object) as T
          /* istanbul ignore next */
          : object as T;
}

export class Context {
  private commands = assign({}, defaultCommands);
  constructor() {
    this.update = this.update.bind(this);
    // Deprecated: update.extend, update.isEquals and update.newContext
    (this.update as any).extend = this.extend = this.extend.bind(this);
    (this.update as any).isEquals = (x, y) => x === y;
    (this.update as any).newContext = () => new Context().update;
  }
  get isEquals() {
    return (this.update as any).isEquals;
  }
  set isEquals(value: (x, y) => boolean) {
    (this.update as any).isEquals = value;
  }
  public extend<T>(directive: string, fn: (param: any, old: T) => T) {
    this.commands[directive] = fn;
  }
  public update<T, C extends CustomCommands<object> = never>(
    object: T,
    $spec: Spec<T, C>,
  ): T {
    const spec = (typeof $spec === 'function') ? { $apply: $spec } : $spec;

    if (!(Array.isArray(object) && Array.isArray(spec))) {
      invariant(
        !Array.isArray(spec),
        () => `update(): You provided an invalid spec to update(). The spec may ` +
        `not contain an array except as the value of $set, $push, $unshift, ` +
        `$splice or any custom command allowing an array value.`,
      );
    }

    invariant(
      typeof spec === 'object' && spec !== null,
      () => `update(): You provided an invalid spec to update(). The spec and ` +
      `every included key path must be plain objects containing one of the ` +
      `following commands: ${Object.keys(this.commands).join(', ')}.`,

    );

    let nextObject = object;
    getAllKeys(spec).forEach(key => {
      if (hasOwnProperty.call(this.commands, key)) {
        const objectWasNextObject = object === nextObject;
        nextObject = this.commands[key](spec[key], nextObject, spec, object);
        if (objectWasNextObject && this.isEquals(nextObject, object)) {
          nextObject = object;
        }
      } else {
        const nextValueForKey =
          type(object) === 'Map'
            ? this.update((object as any as Map<any, any>).get(key), spec[key])
            : this.update(object[key], spec[key]);
        const nextObjectValue =
          type(nextObject) === 'Map'
              ? (nextObject as any as Map<any, any>).get(key)
              : nextObject[key];
        if (!this.isEquals(nextValueForKey, nextObjectValue)
          || typeof nextValueForKey === 'undefined'
          && !hasOwnProperty.call(object, key)
        ) {
          if (nextObject === object) {
            nextObject = copy(object as any);
          }
          if (type(nextObject) === 'Map') {
            (nextObject as any as Map<any, any>).set(key, nextValueForKey);
          } else {
            nextObject[key] = nextValueForKey;
          }
        }
      }
    });
    return nextObject;
  }
}

const defaultCommands = {
  $push(value: any, nextObject: any, spec: any) {
    invariantPushAndUnshift(nextObject, spec, '$push');
    return value.length ? nextObject.concat(value) : nextObject;
  },
  $unshift(value: any, nextObject: any, spec: any) {
    invariantPushAndUnshift(nextObject, spec, '$unshift');
    return value.length ? value.concat(nextObject) : nextObject;
  },
  $splice(value: any, nextObject: any, spec: any, originalObject: any) {
    invariantSplices(nextObject, spec);
    value.forEach((args: any) => {
      invariantSplice(args);
      if (nextObject === originalObject && args.length) {
        nextObject = copy(originalObject);
      }
      splice.apply(nextObject, args);
    });
    return nextObject;
  },
  $set(value: any, _nextObject: any, spec: any) {
    invariantSet(spec);
    return value;
  },
  $toggle(targets: any, nextObject: any) {
    invariantSpecArray(targets, '$toggle');
    const nextObjectCopy = targets.length ? copy(nextObject) : nextObject;

    targets.forEach((target: any) => {
      nextObjectCopy[target] = !nextObject[target];
    });

    return nextObjectCopy;
  },
  $unset(value: any, nextObject: any, _spec: any, originalObject: any) {
    invariantSpecArray(value, '$unset');
    value.forEach((key: any) => {
      if (Object.hasOwnProperty.call(nextObject, key)) {
        if (nextObject === originalObject) {
          nextObject = copy(originalObject);
        }
        delete nextObject[key];
      }
    });
    return nextObject;
  },
  $add(values: any, nextObject: any, _spec: any, originalObject: any) {
    invariantMapOrSet(nextObject, '$add');
    invariantSpecArray(values, '$add');
    if (type(nextObject) === 'Map') {
      values.forEach(([key, value]) => {
        if (nextObject === originalObject && nextObject.get(key) !== value) {
          nextObject = copy(originalObject);
        }
        nextObject.set(key, value);
      });
    } else {
      values.forEach((value: any) => {
        if (nextObject === originalObject && !nextObject.has(value)) {
          nextObject = copy(originalObject);
        }
        nextObject.add(value);
      });
    }
    return nextObject;
  },
  $remove(value: any, nextObject: any, _spec: any, originalObject: any) {
    invariantMapOrSet(nextObject, '$remove');
    invariantSpecArray(value, '$remove');
    value.forEach((key: any) => {
      if (nextObject === originalObject && nextObject.has(key)) {
        nextObject = copy(originalObject);
      }
      nextObject.delete(key);
    });
    return nextObject;
  },
  $merge(value: any, nextObject: any, _spec: any, originalObject: any) {
    invariantMerge(nextObject, value);
    getAllKeys(value).forEach((key: any) => {
      if (value[key] !== nextObject[key]) {
        if (nextObject === originalObject) {
          nextObject = copy(originalObject);
        }
        nextObject[key] = value[key];
      }
    });
    return nextObject;
  },
  $apply(value: any, original: any) {
    invariantApply(value);
    return value(original);
  },
};

const defaultContext = new Context();
export const isEquals = (defaultContext.update as any).isEquals;
export const extend = defaultContext.extend;
export default defaultContext.update;

// @ts-ignore
exports.default.default = module.exports = assign(exports.default, exports);

// invariants

function invariantPushAndUnshift(value: any, spec: any, command: any) {
  invariant(
    Array.isArray(value),
    () => `update(): expected target of ${stringifiable(command)} to be an array; got ${stringifiable(value)}.`,
  );
  invariantSpecArray(spec[command], command);
}

function invariantSpecArray(spec: any, command: any) {
  invariant(
    Array.isArray(spec),
    () => `update(): expected spec of ${stringifiable(command)} to be an array; got ${stringifiable(spec)}. ` +
    `Did you forget to wrap your parameter in an array?`,
  );
}

function invariantSplices(value: any, spec: any) {
  invariant(
    Array.isArray(value),
    () => `Expected $splice target to be an array; got ${stringifiable(value)}`,
  );
  invariantSplice(spec.$splice);
}

function invariantSplice(value: any) {
  invariant(
    Array.isArray(value),
    () => `update(): expected spec of $splice to be an array of arrays; got ${stringifiable(value)}. ` +
    `Did you forget to wrap your parameters in an array?`,
  );
}

function invariantApply(fn: any) {
  invariant(
    typeof fn === 'function',
    () => `update(): expected spec of $apply to be a function; got ${stringifiable(fn)}.`,
  );
}

function invariantSet(spec: any) {
  invariant(
    Object.keys(spec).length === 1,
    () => `Cannot have more than one key in an object with $set`,
  );
}

function invariantMerge(target: any, specValue: any) {
  invariant(
    specValue && typeof specValue === 'object',
    () => `update(): $merge expects a spec of type 'object'; got ${stringifiable(specValue)}`,
  );
  invariant(
    target && typeof target === 'object',
    () => `update(): $merge expects a target of type 'object'; got ${stringifiable(target)}`,
  );
}

function invariantMapOrSet(target: any, command: any) {
  const typeOfTarget = type(target);
  invariant(
    typeOfTarget === 'Map' || typeOfTarget === 'Set',
    () => `update(): ${stringifiable(command)} expects a target of type Set or Map; got ${stringifiable(typeOfTarget)}`,
  );
}

// Usage with custom commands is as follows:
//
//   interface MyCommands {
//     $foo: string;
//   }
//
//    update<Foo, CustomCommands<MyCommands>>(..., { $foo: "bar" });
//
// It is suggested that if you use custom commands frequently, you wrap and re-export a
// properly-typed version of `update`:
//
//   function myUpdate<T>(object: T, spec: Spec<T, CustomCommands<MyCommands>>) {
//     return update(object, spec);
//   }
//
// See https://github.com/kolodny/immutability-helper/pull/108 for explanation of why this
// type exists.
export type CustomCommands<T> = T & { __noInferenceCustomCommandsBrand: any };

export type Spec<T, C extends CustomCommands<object> = never> =
  | (
      T extends (Array<infer U> | ReadonlyArray<infer U>) ? ArraySpec<U, C> :
      T extends (Map<infer K, infer V> | ReadonlyMap<infer K, infer V>) ? MapSpec<K, V> :
      T extends (Set<infer X> | ReadonlySet<infer X>) ? SetSpec<X> :
      T extends object ? ObjectSpec<T, C> :
      never
    )
  | { $set: T }
  | { $apply: (v: T) => T }
  | ((v: T) => T)
  | (C extends CustomCommands<infer O> ? O : never);

type ArraySpec<T, C extends CustomCommands<object>> =
  | { $push: ReadonlyArray<T> }
  | { $unshift: ReadonlyArray<T> }
  | { $splice: ReadonlyArray<[number, number?] | [number, number, ...T[]]> }
  | { [index: string]: Spec<T, C> }; // Note that this does not type check properly if index: number.

type MapSpec<K, V> =
  | { $add: ReadonlyArray<[K, V]> }
  | { $remove: ReadonlyArray<K> }
  | { [key: string]: { $set: V } };

type SetSpec<T> =
  | { $add: ReadonlyArray<T> }
  | { $remove: ReadonlyArray<T> };

type ObjectSpec<T, C extends CustomCommands<object>> =
  | { $toggle: ReadonlyArray<keyof T> }
  | { $unset: ReadonlyArray<keyof T> }
  | { $merge: Partial<T> }
  | { [K in keyof T]?: Spec<T[K], C> };
