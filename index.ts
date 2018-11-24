import invariant from 'invariant';

const hasOwnProperty = Object.prototype.hasOwnProperty;
const splice = Array.prototype.splice;

const toString = Object.prototype.toString;
const type = obj => toString.call(obj)
  .slice(8, -1);

const assign = Object.assign || /* istanbul ignore next */ function assign(target, source) {
  getAllKeys(source)
    .forEach(key => {
      if (hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    });
  return target;
};

const getAllKeys = typeof Object.getOwnPropertySymbols === 'function' ?
  obj => Object.keys(obj)
    .concat(Object.getOwnPropertySymbols(obj)) :
  /* istanbul ignore next */ obj => Object.keys(obj);

/* istanbul ignore next */
function copy(object) {
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
  update.extend = (directive, fn) => {
    commands[directive] = fn;
  };
  update.isEquals = (a, b) => a === b;

  return update;

  function update(object, spec) {
    if (typeof spec === 'function') {
      spec = { $apply: spec };
    }

    if (!(Array.isArray(object) && Array.isArray(spec))) {
      invariant(
        !Array.isArray(spec),
        'update(): You provided an invalid spec to update(). The spec may ' +
        'not contain an array except as the value of $set, $push, $unshift, ' +
        '$splice or any custom command allowing an array value.'
      );
    }

    invariant(
      typeof spec === 'object' && spec !== null,
      'update(): You provided an invalid spec to update(). The spec and ' +
      'every included key path must be plain objects containing one of the ' +
      'following commands: %s.',
      Object.keys(commands)
        .join(', ')
    );

    const nextObject = object;
    const index;
    const key;
    getAllKeys(spec)
    .forEach(key => {
      if (hasOwnProperty.call(commands, key)) {
        const objectWasNextObject = object === nextObject;
        nextObject = commands[key](spec[key], nextObject, spec, object);
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
        if (!update.isEquals(nextValueForKey, nextObjectValue) || typeof nextValueForKey === 'undefined' && !hasOwnProperty.call(object, key)) {
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
  $push: (value, nextObject, spec) => {
    invariantPushAndUnshift(nextObject, spec, '$push');
    return value.length ? nextObject.concat(value) : nextObject;
  },
  $unshift: (value, nextObject, spec) => {
    invariantPushAndUnshift(nextObject, spec, '$unshift');
    return value.length ? value.concat(nextObject) : nextObject;
  },
  $splice: (value, nextObject, spec, originalObject) => {
    invariantSplices(nextObject, spec);
    value.forEach(args => {
      invariantSplice(args);
      if (nextObject === originalObject && args.length) nextObject = copy(originalObject);
      splice.apply(nextObject, args);
    });
    return nextObject;
  },
  $set: (value, nextObject, spec) => {
    invariantSet(spec);
    return value;
  },
  $toggle: (targets, nextObject) => {
    invariantSpecArray(targets, '$toggle');
    const nextObjectCopy = targets.length ? copy(nextObject) : nextObject;

    targets.forEach(target => {
      nextObjectCopy[target] = !nextObject[target];
    });

    return nextObjectCopy;
  },
  $unset: (value, nextObject, spec, originalObject) => {
    invariantSpecArray(value, '$unset');
    value.forEach(key => {
      if (Object.hasOwnProperty.call(nextObject, key)) {
        if (nextObject === originalObject) nextObject = copy(originalObject);
        // tslint:disable-next-line:no-dynamic-delete
        delete nextObject[key];
      }
    });
    return nextObject;
  },
  $add: (value, nextObject, spec, originalObject) => {
    invariantMapOrSet(nextObject, '$add');
    invariantSpecArray(value, '$add');
    if (type(nextObject) === 'Map') {
      value.forEach(pair => {
        const key = pair[0];
        const value = pair[1];
        if (nextObject === originalObject && nextObject.get(key) !== value) nextObject = copy(originalObject);
        nextObject.set(key, value);
      });
    } else {
      value.forEach(value => {
        if (nextObject === originalObject && !nextObject.has(value)) nextObject = copy(originalObject);
        nextObject.add(value);
      });
    }
    return nextObject;
  },
  $remove: (value, nextObject, spec, originalObject) => {
    invariantMapOrSet(nextObject, '$remove');
    invariantSpecArray(value, '$remove');
    value.forEach(key => {
      if (nextObject === originalObject && nextObject.has(key)) nextObject = copy(originalObject);
      nextObject.delete(key);
    });
    return nextObject;
  },
  $merge: (value, nextObject, spec, originalObject) => {
    invariantMerge(nextObject, value);
    getAllKeys(value)
    .forEach(key => {
      if (value[key] !== nextObject[key]) {
        if (nextObject === originalObject) nextObject = copy(originalObject);
        nextObject[key] = value[key];
      }
    });
    return nextObject;
  },
  $apply: (value, original) => {
    invariantApply(value);
    return value(original);
  }
};

const contextForExport = newContext();

module.exports = contextForExport;
module.exports.default = contextForExport;
module.exports.newContext = newContext;

// invariants

function invariantPushAndUnshift(value, spec, command) {
  invariant(
    Array.isArray(value),
    'update(): expected target of %s to be an array; got %s.',
    command,
    value
  );
  invariantSpecArray(spec[command], command);
}

function invariantSpecArray(spec, command) {
  invariant(
    Array.isArray(spec),
    'update(): expected spec of %s to be an array; got %s. ' +
    'Did you forget to wrap your parameter in an array?',
    command,
    spec
  );
}

function invariantSplices(value, spec) {
  invariant(
    Array.isArray(value),
    'Expected $splice target to be an array; got %s',
    value
  );
  invariantSplice(spec['$splice']);
}

function invariantSplice(value) {
  invariant(
    Array.isArray(value),
    'update(): expected spec of $splice to be an array of arrays; got %s. ' +
    'Did you forget to wrap your parameters in an array?',
    value
  );
}

function invariantApply(fn) {
  invariant(
    typeof fn === 'function',
    'update(): expected spec of $apply to be a function; got %s.',
    fn
  );
}

function invariantSet(spec) {
  invariant(
    Object.keys(spec).length === 1,
    'Cannot have more than one key in an object with $set'
  );
}

function invariantMerge(target, specValue) {
  invariant(
    specValue && typeof specValue === 'object',
    'update(): $merge expects a spec of type \'object\'; got %s',
    specValue
  );
  invariant(
    target && typeof target === 'object',
    'update(): $merge expects a target of type \'object\'; got %s',
    target
  );
}

function invariantMapOrSet(target, command) {
  const typeOfTarget = type(target);
  invariant(
    typeOfTarget === 'Map' || typeOfTarget === 'Set',
    'update(): %s expects a target of type Set or Map; got %s',
    command,
    typeOfTarget
  );
}
