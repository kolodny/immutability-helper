import * as invariant from 'invariant';

const hasOwnProperty = Object.prototype.hasOwnProperty;
const splice = Array.prototype.splice;

const toString = Object.prototype.toString;
const type = (obj: any) =>
  toString.call(obj).slice(8, -1);

const assign = Object.assign || /* istanbul ignore next */ ((target: any, source: any) => {
  getAllKeys(source).forEach((key: any) => {
    if (hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  });
  return target;
});

const getAllKeys = typeof Object.getOwnPropertySymbols === 'function' ?
  (obj: any) => Object.keys(obj).concat(Object.getOwnPropertySymbols(obj) as any) :
  /* istanbul ignore next */ (obj: any) => Object.keys(obj);

/* istanbul ignore next */
function copy(object: any) {
  if (Array.isArray(object)) {
    return assign(object.constructor(object.length), object);
  } else if (type(object) === 'Map') {
    return new Map(object);
  } else if (type(object) === 'Set') {
    return new Set(object);
  } else if (object && typeof object === 'object') {
    const prototype = Object.getPrototypeOf(object);
    return assign(Object.create(prototype), object);
  } else {
    return object;
  }
}

function newContext() {
  const commands = assign({}, defaultCommands);
  update.extend = (directive: any, fn: any) => {
    (commands as any)[directive] = fn;
  };
  update.isEquals = (a: any, b: any) => a === b;

  return update;

  function update<T extends any, C extends CustomCommands<object> = never>(
    object: T,
    $spec: Spec<T, C>,
  ): T {
    const spec: Spec<any, any> = (typeof $spec === 'function') ? { $apply: $spec } : $spec;

    if (!(Array.isArray(object) && Array.isArray(spec))) {
      invariant(
        !Array.isArray(spec),
        'update(): You provided an invalid spec to update(). The spec may ' +
        'not contain an array except as the value of $set, $push, $unshift, ' +
        '$splice or any custom command allowing an array value.',
      );
    }

    invariant(
      typeof spec === 'object' && spec !== null,
      'update(): You provided an invalid spec to update(). The spec and ' +
      'every included key path must be plain objects containing one of the ' +
      'following commands: %s.',
      Object.keys(commands).join(', '),
    );

    let nextObject = object;
    getAllKeys(spec).forEach((key) => {
      if (hasOwnProperty.call(commands, key)) {
        const objectWasNextObject = object === nextObject;
        nextObject = (commands as any)[key](spec[key], nextObject, spec, object);
        if (objectWasNextObject && update.isEquals(nextObject, object)) {
          nextObject = object;
        }
      } else {
        const nextValueForKey =
          type(object) === 'Map'
            ? update(object.get(key), spec[key])
            : update(object[key], spec[key]);
        const nextObjectValue =
          type(nextObject) === 'Map'
              ? nextObject.get(key)
              : nextObject[key];
        if (!update.isEquals(nextValueForKey, nextObjectValue)
          || typeof nextValueForKey === 'undefined'
          && !hasOwnProperty.call(object, key)
        ) {
          if (nextObject === object) {
            nextObject = copy(object);
          }
          if (type(nextObject) === 'Map') {
            nextObject.set(key, nextValueForKey);
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
      values.forEach((pair: any) => {
        const key = pair[0];
        const value = pair[1];
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

const contextForExport = newContext();
(contextForExport as any).default = contextForExport;
(contextForExport as any).newContext = newContext;

export default contextForExport;

// @ts-ignore
exports.default.default = module.exports = Object.assign(exports.default, exports);

// invariants

function invariantPushAndUnshift(value: any, spec: any, command: any) {
  invariant(
    Array.isArray(value),
    'update(): expected target of %s to be an array; got %s.',
    command,
    value,
  );
  invariantSpecArray(spec[command], command);
}

function invariantSpecArray(spec: any, command: any) {
  invariant(
    Array.isArray(spec),
    'update(): expected spec of %s to be an array; got %s. ' +
    'Did you forget to wrap your parameter in an array?',
    command,
    spec,
  );
}

function invariantSplices(value: any, spec: any) {
  invariant(
    Array.isArray(value),
    'Expected $splice target to be an array; got %s',
    value,
  );
  invariantSplice(spec.$splice);
}

function invariantSplice(value: any) {
  invariant(
    Array.isArray(value),
    'update(): expected spec of $splice to be an array of arrays; got %s. ' +
    'Did you forget to wrap your parameters in an array?',
    value,
  );
}

function invariantApply(fn: any) {
  invariant(
    typeof fn === 'function',
    'update(): expected spec of $apply to be a function; got %s.',
    fn,
  );
}

function invariantSet(spec: any) {
  invariant(
    Object.keys(spec).length === 1,
    'Cannot have more than one key in an object with $set',
  );
}

function invariantMerge(target: any, specValue: any) {
  invariant(
    specValue && typeof specValue === 'object',
    'update(): $merge expects a spec of type \'object\'; got %s',
    specValue,
  );
  invariant(
    target && typeof target === 'object',
    'update(): $merge expects a target of type \'object\'; got %s',
    target,
  );
}

function invariantMapOrSet(target: any, command: any) {
  const typeOfTarget = type(target);
  invariant(
    typeOfTarget === 'Map' || typeOfTarget === 'Set',
    'update(): %s expects a target of type Set or Map; got %s',
    command,
    typeOfTarget,
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
  | { $push: T[] }
  | { $unshift: T[] }
  | { $splice: Array<[number] | [number, number] | [number, number, T]> }
  | { [index: string]: Spec<T, C> }; // Note that this does not type check properly if index: number.

type MapSpec<K, V> =
  | { $add: Array<[K, V]> }
  | { $remove: K[] };

type SetSpec<T> =
  | { $add: T[] }
  | { $remove: T[] };

type ObjectSpec<T, C extends CustomCommands<object>> =
  | { $toggle: Array<keyof T> }
  | { $unset: Array<keyof T> }
  | { $merge: Partial<T> }
  | { [K in keyof T]?: Spec<T[K], C> };
