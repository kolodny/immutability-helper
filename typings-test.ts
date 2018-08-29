// tslint:disable-next-line:no-implicit-dependencies
import update, { CustomCommands } from "immutability-helper";

interface TestObject {
  object: {
    field: number;
  };
  array: string[];
  set: Set<string>;
  map: Map<string, number>;
}

const o: TestObject = null as any;

// ----------------------------------------------------------------------------
// Basic Tests
// ----------------------------------------------------------------------------

// $ExpectType TestObject
update(o, {});

// $ExpectType TestObject
update(o, {
  object: {
    $set: {
      field: 1
    }
  }
});

// $ExpectError
update(o, {
  object: {
    $set: {}
  }
});

// $ExpectType TestObject
update(o, {
  object: {
    $apply: () => ({ field: 1 })
  }
});

// $ExpectError
update(o, {
  object: {
    $apply: () => null
  }
});

// $ExpectType TestObject
update(o, {
  object: () => ({ field: 1 })
});

// $ExpectError
update(o, {
  object: () => null
});

// ----------------------------------------------------------------------------
// Object Tests
// ----------------------------------------------------------------------------

// $ExpectType TestObject
update(o, {
  object: {
    $unset: [ "field" ],
  }
});

// $ExpectError
update(o, {
  object: {
    $unset: [ "notAField" ],
  }
});

// $ExpectType TestObject
update(o, {
  object: {
    $toggle: [ "field" ],
  }
});

// $ExpectError
update(o, {
  object: {
    $toggle: [ "notAField" ],
  }
});

// $ExpectType TestObject
update(o, {
  object: {
    $merge: {
      field: 1,
    },
  }
});

// $ExpectError
update(o, {
  object: {
    $merge: {
      notAField: 1,
    },
  }
});

// ----------------------------------------------------------------------------
// Array Tests
// ----------------------------------------------------------------------------

// $ExpectType TestObject
update(o, {
  array: {
    $push: "string"
  }
});

// $ExpectError
update(o, {
  array: {
    $push: 1
  }
});

// $ExpectType TestObject
update(o, {
  array: {
    $unshift: "string"
  }
});

// $ExpectError
update(o, {
  array: {
    $unshift: 1
  }
});

// $ExpectType TestObject
update(o, {
  array: {
    $splice: [ [ 1 ] ]
  }
});

// $ExpectType TestObject
update(o, {
  array: {
    $splice: [ [ 1, 2 ] ]
  }
});

// $ExpectType TestObject
update(o, {
  array: {
    $splice: [ [ 1, 2, "string" ] ]
  }
});

// $ExpectError
update(o, {
  array: {
    $splice: "string"
  }
});

// $ExpectError
update(o, {
  array: {
    $splice: [ [ 1, 2, null ] ]
  }
});

// $ExpectType TestObject
update(o, {
  array: {
    1: {
      $set: "string"
    }
  }
});

// $ExpectError
update(o, {
  array: {
    1: {
      $set: 1
    }
  }
});

// $ExpectType TestObject
update(o, {
  array: {
    [1]: {
      $set: "string"
    }
  }
});

// $ExpectType TestObject
update(o, {
  array: {
    ['1']: {
      $set: "string"
    }
  }
});

// TODO: This test should not pass, but it's because ArraySpec has [index: string]. Changing that
// to [index: number] fails many more tests by being too permissive, so I figure this is the
// preferable error to accept. I do not know why [index: number] would cause the types to be
// permissive to the point of uselessness.
// $ExpectType TestObject
update(o, {
  array: {
    uhOh: {
      $set: "string"
    }
  }
});

// This test passes (i.e., doesn't type check), but for the wrong reasons. See the previous test
// for details.
// $ExpectError
update(o, {
  array: {
    uhOh: {
      $set: 1
    }
  }
});

// ----------------------------------------------------------------------------
// Set Tests
// ----------------------------------------------------------------------------

// $ExpectType TestObject
update(o, {
  set: {
    $add: [ "string" ]
  }
});

// $ExpectError
update(o, {
  set: {
    $add: [ 1 ]
  }
});

// $ExpectType TestObject
update(o, {
  set: {
    $remove: [ "string" ]
  }
});

// $ExpectError
update(o, {
  set: {
    $remove: [ 1 ]
  }
});

// ----------------------------------------------------------------------------
// Map Tests
// ----------------------------------------------------------------------------

// $ExpectType TestObject
update(o, {
  map: {
    $add: [ [ "string", 1 ] ]
  }
});

// $ExpectError
update(o, {
  map: {
    $add: [ [ 1, 1 ] ]
  }
});

// $ExpectType TestObject
update(o, {
  map: {
    $remove: [ "string" ]
  }
});

// $ExpectError
update(o, {
  map: {
    $remove: [ 1 ]
  }
});

// ----------------------------------------------------------------------------
// Custom Commands Tests
// ----------------------------------------------------------------------------

type TestCustomCommands = CustomCommands<{ $foo: string }>;

// $ExpectType TestObject
update<TestObject, TestCustomCommands>(o, {
  object: {
    field: {
      $foo: "string"
    }
  }
});

// $ExpectError
update<TestObject, TestCustomCommands>(o, {
  object: {
    field: {
      $foo: 1
    }
  }
});
