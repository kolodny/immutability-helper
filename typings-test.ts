// tslint:disable-next-line:no-implicit-dependencies
import update, { CustomCommands } from "immutability-helper";

interface Nested {
  outer: {
    inner: number;
  };
}

const nested: Nested = {
  outer: {
    inner: 1
  }
};

// $ExpectType Nested
update(nested, {});

// $ExpectType Nested
update<Nested, CustomCommands<{ $foo: string }>>(nested, {
  outer: {
    inner: {
      $foo: "type-checked custom commands"
    }
  }
});

// $ExpectError
update<Nested, CustomCommands<{ $foo: number }>>(nested, {
  outer: {
    inner: {
      $foo: "type-checked custom commands"
    }
  }
});
