var invariant = require('invariant');

var hasOwnProperty = Object.prototype.hasOwnProperty;
var splice = Array.prototype.splice;

function assign(target, source) {
  for (var key in source) {
    if (hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
  return target;
}

function copy(object) {
  if (object instanceof Array) {
    return object.slice();
  } else if (object && typeof object === 'object') {
    return assign(new object.constructor(), object);
  } else {
    return object;
  }
}


function newContext() {
  var commands = assign({}, defaultCommands);
  update.extend = function(directive, fn) {
    commands[directive] = fn;
  }

  return update;

  function update(object, spec) {
    invariant(
      typeof spec === 'object',
      'update(): You provided a key path to update() that did not contain one ' +
      'of %s. Did you forget to include {%s: ...}?',
      Object.keys(commands).join(', '),
      '$set'
    );

    var newObject = copy(object);
    for (var key in spec) {
      if (hasOwnProperty.call(commands, key)) {
        return commands[key](spec[key], newObject, spec, object);
      }
    }
    for (var key in spec) {
      newObject[key] = update(object[key], spec[key]);
    }
    return newObject;
  }

}

var defaultCommands = {
  $push: function(value, original, spec, object) {
    invariantPushAndUnshift(object, spec, '$push');
    return original.concat(value);
  },
  $unshift: function(value, original, spec, object) {
    invariantPushAndUnshift(object, spec, '$unshift');
    return value.concat(original);
  },
  $splice: function(value, original, spec, object) {
    invariantSplices(object, spec);
    value.forEach(function(args) {
      invariantSplice(args);
      splice.apply(original, args);
    });
    return original;
  },
  $set: function(value, original, spec, object) {
    invariantSet(spec);
    return value
  },
  $merge: function(value, original, spec, object) {
    invariantMerge(original, value);
    Object.keys(value).forEach(function(key) {
      original[key] = value[key];
    });
    return original;
  },
  $apply: function(value, original) {
    invariantApply(value);
    return value(original);
  }
};



module.exports = newContext();
module.exports.newContext = newContext;


// invariants

function invariantPushAndUnshift(value, spec, command) {
  invariant(
    Array.isArray(value),
    'update(): expected target of %s to be an array; got %s.',
    command,
    value
  );
  var specValue = spec[command];
  invariant(
    Array.isArray(specValue),
    'update(): expected spec of %s to be an array; got %s. ' +
    'Did you forget to wrap your parameter in an array?',
    command,
    specValue
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

function invariantMerge(mergeObj, nextValue) {
  invariant(
    nextValue && typeof nextValue === 'object',
    'update(): $merge expects a spec of type \'object\'; got %s',
    nextValue
  );
  invariant(
    mergeObj && typeof mergeObj === 'object',
    'update(): $merge expects a target of type \'object\'; got %s',
    mergeObj
  );
}
