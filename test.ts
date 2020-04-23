'use strict';

import update, { Context, extend, isEquals } from '.';

describe('immutability-helper module', () => {

  it('exports a Context class', () => {
    expect(Context).not.toBeUndefined();
    expect(new Context() instanceof Context).toBe(true);
  });

  it('exports an isEquals method', () => {
    expect(typeof isEquals).toBe('function');
  });

  it('exports an extend method', () => {
    expect(typeof extend).toBe('function');
  });

  describe('default export', () => {
    it('is a function', () => {
      expect(typeof update).toBe('function');
    });

    it('has an extend method', () => {
      expect(typeof (update as any).extend).toBe('function');
    });
  });

  describe('$push', () => {
    it('pushes', () => {
      expect(update([1], {$push: [7]})).toEqual([1, 7]);
    });
    it('does not mutate the original object', () => {
      const obj = Object.freeze([1]);
      expect(() => update(obj, {$push: [7]})).not.toThrow();
    });
    it('only pushes an array', () => {
      expect(() => update([], {$push: 7} as any)).toThrow(
        'update(): expected spec of $push to be an array; got 7. Did you ' +
        'forget to wrap your parameter in an array?',
      );
    });
    it('only pushes unto an array', () => {
      expect(() => update(1, {$push: 7} as any)).toThrow(
        'update(): expected target of $push to be an array; got 1.',
      );
    });
    it('keeps reference equality when possible', () => {
      const original = ['x'];
      expect(update(original, {$push: []})).toBe(original);
    });
  });

  describe('$unshift', () => {
    it('unshifts', () => {
      expect(update([1], {$unshift: [7]})).toEqual([7, 1]);
    });
    it('does not mutate the original object', () => {
      const obj = Object.freeze([1]);
      expect(() => update(obj, {$unshift: [7]})).not.toThrow();
    });
    it('only unshifts an array', () => {
      expect(() => update([], {$unshift: 7} as any)).toThrow(
        'update(): expected spec of $unshift to be an array; got 7. Did you ' +
        'forget to wrap your parameter in an array?',
      );
    });
    it('only unshifts unto an array', () => {
      expect(() => update(1, {$unshift: 7} as any)).toThrow(
        'update(): expected target of $unshift to be an array; got 1.',
      );
    });
    it('keeps reference equality when possible', () => {
      const original = ['x'];
      expect(update(original, {$unshift: []})).toBe(original);
    });
  });

  describe('$splice', () => {
    it('splices', () => {
      expect(update([7, 8, 9], {$splice: [[2]]})).toEqual([7, 8]);
      expect(update([5, 6, 7, 8], {$splice: [[1, 2]]})).toEqual([5, 8]);
      expect(update([1, 4, 3], {$splice: [[1, 1, 2]]})).toEqual([1, 2, 3]);
      expect(update([5, 4, 9], {$splice: [[1, 1, 6, 7, 8]]})).toEqual([5, 6, 7, 8, 9]);
    });
    it('does not mutate the original object', () => {
      const obj = Object.freeze([1, 4, 3]);
      expect(() => update(obj, {$splice: [[1, 1, 2]]})).not.toThrow();
    });
    it('only splices an array of arrays', () => {
      expect(() => update([], {$splice: 1} as any)).toThrow(
        'update(): expected spec of $splice to be an array of arrays; got 1. ' +
        'Did you forget to wrap your parameters in an array?',
      );
      expect(() => update([], {$splice: [1]} as any)).toThrow(
        'update(): expected spec of $splice to be an array of arrays; got 1. ' +
        'Did you forget to wrap your parameters in an array?',
      );
    });
    it('only splices unto an array', () => {
      expect(() => update(1, {$splice: 7} as any)).toThrow(
        'Expected $splice target to be an array; got 1',
      );
    });
    it('keeps reference equality when possible', () => {
      const original = ['x'];
      expect(update(original, {$splice: [[]]} as any)).toBe(original);
    });
  });

  describe('$merge', () => {
    it('merges', () => {
      expect(update({a: 'b'}, {$merge: {c: 'd'}} as any)).toEqual({a: 'b', c: 'd'});
    });
    it('does not mutate the original object', () => {
      const obj = Object.freeze({a: 'b'});
      expect(() => update(obj, {$merge: {a: 'c'}})).not.toThrow();
    });
    it('only merges with an object', () => {
      expect(() => update({a: 'b'}, {$merge: 7} as any)).toThrow(
        'update(): $merge expects a spec of type \'object\'; got 7',
      );
    });
    it('only merges with an object', () => {
      expect(() => update(7, {$merge: {a: 'b'}} as any)).toThrow(
        'update(): $merge expects a target of type \'object\'; got 7',
      );
    });
    it('keeps reference equality when possible', () => {
      const original = {a: {b: {c: true}}};
      expect(update(original, {a: {$merge: {}}})).toBe(original);
      expect(update(original, {a: {$merge: { b: original.a.b }}})).toBe(original);

      // Merging primatives of the same value should return the original.
      expect(update(original, {a: {b: { $merge: {c: true} }}})).toBe(original);

      // Two objects are different values even though they are deeply equal.
      expect(update(original, {a: {$merge: { b: {c: true} }}})).not.toBe(original);
      expect(update(original, {
        a: {$merge: { b: original.a.b, c: false } as any},
      })).not.toBe(original);
    });
  });

  describe('$set', () => {
    it('sets', () => {
      expect(update({a: 'b'}, {$set: {c: 'd'}})).toEqual({c: 'd'});
    });
    it('does not mutate the original object', () => {
      const obj = Object.freeze({a: 'b'});
      expect(() => update(obj, {$set: {a: 'c'}})).not.toThrow();
    });
    it('keeps reference equality when possible', () => {
      const original = {a: 1};
      expect(update(original, {a: {$set: 1}})).toBe(original);
      expect(update(original, {a: {$set: 2}})).not.toBe(original);
    });
    it('setting a property to undefined should add an enumerable key to final object with value undefined', () => {
      const original = {a: 1};
      const result = update(original, {b: {$set: undefined}} as any);
      expect(result).not.toBe(original);
      expect(result).toEqual({a: 1, b: undefined});
      expect(Object.keys(result).length).toEqual(2);
    });
    it('works on Map (E2E)', () => {
      const state = new Map([['foo', 'FOO'], ['bar', 'BAR']]);
      const modified = update(state, {foo: {$set: 'OFO' }});
      expect(state).toEqual(new Map([['foo', 'FOO'], ['bar', 'BAR']]));
      expect(modified).toEqual(new Map([['foo', 'OFO'], ['bar', 'BAR']]));
      expect(state).not.toBe(modified);
    });
  });

  describe('$toggle', () => {
    it('only takes an array as spec', () => {
      expect(() => update({a: false}, {$toggle: 'a'} as any)).toThrow(
        'update(): expected spec of $toggle to be an array; got a. Did you ' +
        'forget to wrap your parameter in an array?',
      );
    });
    it('toggles false to true and true to false', () => {
      expect(update({a: false, b: true}, {$toggle: ['a', 'b']})).toEqual({a: true, b: false});
    });
    it('does not mutate the original object', () => {
      const obj = Object.freeze({a: false});
      expect(() => update(obj, {$toggle: ['a']})).not.toThrow();
    });
    it('keeps reference equality when possible', () => {
      const original = {a: false};
      expect(update(original, {$toggle: []})).toBe(original);
      expect(update(original, {$toggle: ['a']})).not.toBe(original);
    });
  });

  describe('$unset', () => {
    it('unsets', () => {
      expect(update({a: 'b'}, {$unset: ['a']}).a).toBe(undefined as any);
    });
    it('removes the key from the object', () => {
      const removed = update({a: 'b'}, {$unset: ['a']});
      expect('a' in removed).toBe(false);
    });
    it('removes multiple keys from the object', () => {
      const original = {a: 'b', c: 'd', e: 'f'};
      const removed = update(original, {$unset: ['a', 'e']});
      expect('a' in removed).toBe(false);
      expect('a' in original).toBe(true);
      expect('e' in removed).toBe(false);
      expect('e' in original).toBe(true);
    });
    it('does not remove keys from the inherited properties', () => {
      class Parent {
        constructor(public foo = 'Parent') {
        }
      }
      // tslint:disable-next-line:no-empty
      function Child() {}
      Child.prototype = new Parent();
      const child = new Child();
      expect(update(child, {$unset: ['foo']}).foo).toEqual('Parent');
    });
    it('keeps reference equality when possible', () => {
      const original = {a: 1};
      expect(update(original, {$unset: ['b']} as any)).toBe(original);
      expect(update(original, {$unset: ['a']})).not.toBe(original);
    });
  });

  describe('$add', () => {
    it('works on Map', () => {
      const state = new Map([[1, 2], [3, 4]]);
      expect(update(state, {$add: [[5, 6]]})).toMatchSnapshot();
    });
    it('preserves original object if trying to add a duplicate Map item', () => {
      const state = new Map([[1, 2]]);
      const state2 = update(state, {$add: [[1, 2]]});
      expect(state).toBe(state2);
    });
    it('works on Set', () => {
      const state = new Set([1, 2, 3, 4]);
      expect(update(state, {$add: [5, 6]})).toMatchSnapshot();
    });
    it('does not mutate the original object', () => {
      const state = Object.freeze(new Set([1, 2, 3, 4])) as Set<number>;
      expect(() => update(state, {$add: [5]})).not.toThrow();
    });
    it('throws on a non Map or Set', () => {
      expect(() => update(2, {$add: [1]} as any)).toThrow(
        'update(): $add expects a target of type Set or Map; got Number',
      );
    });
  });

  describe('$remove', () => {
    it('works on Map', () => {
      const state = new Map([[1, 2], [3, 4], [5, 6]]);
      const state2 = update(state, {$remove: [1, 5]});
      expect(state2.has(1)).toBe(false);
      expect(state2.has(3)).toBe(true);
      expect(state2.get(3)).toBe(4);
      expect(state2.has(6)).toBe(false);
    });
    it('works on Set', () => {
      const state = new Set([1, 2, 3, 4]);
      const state2 = update(state, {$remove: [2, 3]});
      expect(state2.has(1)).toBe(true);
      expect(state2.has(2)).toBe(false);
    });
    it('throws on a non Map or Set', () => {
      expect(() => update(2, {$remove: [1]} as any)).toThrow(
        'update(): $remove expects a target of type Set or Map; got Number',
      );
    });
  });

  describe('$apply', () => {
    const applier = node => ({v: node.v * 2});
    it('applies', () => {
      expect(update({v: 2}, {$apply: applier})).toEqual({v: 4});
    });
    it('does not mutate the original object', () => {
      const obj = Object.freeze({v: 2});
      expect(() => update(obj, {$apply: applier})).not.toThrow();
    });
    it('only applies a function', () => {
      expect(() => update(2, {$apply: 123} as any)).toThrow(
        'update(): expected spec of $apply to be a function; got 123.',
      );
    });
    it('keeps reference equality when possible', () => {
      const original = {a: {b: {}}};
      function identity(val) {
        return val;
      }
      expect(update(original, {a: {$apply: identity}})).toBe(original);
      expect(update(original, {a: {$apply: applier}} as any)).not.toBe(original);
    });
  });

  describe('direct apply', () => {
    const applier = node => ({v: node.v * 2});
    it('applies', () => {
      const doubler = value => value * 2;
      expect(update({v: 2}, applier)).toEqual({v: 4});
      expect(update(2, doubler)).toEqual(4);
    });
    it('does not mutate the original object', () => {
      const obj = Object.freeze({v: 2});
      expect(() => update(obj, applier)).not.toThrow();
    });
    it('keeps reference equality when possible', () => {
      const original = {a: {b: {}}};
      function identity(val) {
        return val;
      }
      expect(update(original, {a: identity})).toBe(original);
      expect(update(original, {a: applier} as any)).not.toBe(original);
    });
  });

  describe('deep update', () => {
    it('works', () => {
      expect(update({
        a: 'b',
        c: {
          d: 'e',
          f: [1],
          g: [2],
          h: [3],
          i: {j: 'k'},
          l: 4,
          m: 'n',
        },
      }, {
        c: {
          d: {$set: 'm'},
          f: {$push: [5]},
          g: {$unshift: [6]},
          h: {$splice: [[0, 1, 7]]},
          i: {$merge: {n: 'o'}},
          l: {$apply: x => x * 2},
          m: x => x + x,
        },
      } as any)).toEqual({
        a: 'b',
        c: {
          d: 'm',
          f: [1, 5],
          g: [6, 2],
          h: [7],
          i: {j: 'k', n: 'o'},
          l: 8,
          m: 'nn',
        },
      });
    });
    it('keeps reference equality when possible', () => {
      const original = {a: {b: 1}, c: {d: {e: 1}}};

      expect(update(original, {a: {b: {$set: 1}}})).toBe(original);
      expect(update(original, {a: {b: {$set: 1}}}).a).toBe(original.a);

      expect(update(original, {c: {d: {e: {$set: 1}}}})).toBe(original);
      expect(update(original, {c: {d: {e: {$set: 1}}}}).c).toBe(original.c);
      expect(update(original, {c: {d: {e: {$set: 1}}}}).c.d).toBe(original.c.d);

      expect(update(original, {
        a: {b: {$set: 1}},
        c: {d: {e: {$set: 1}}},
      })).toBe(original);
      expect(update(original, {
        a: {b: {$set: 1}},
        c: {d: {e: {$set: 1}}},
      }).a).toBe(original.a);
      expect(update(original, {
        a: {b: {$set: 1}},
        c: {d: {e: {$set: 1}}},
      }).c).toBe(original.c);
      expect(update(original, {
        a: {b: {$set: 1}},
        c: {d: {e: {$set: 1}}},
      }).c.d).toBe(original.c.d);

      expect(update(original, {a: {b: {$set: 2}}})).not.toBe(original);
      expect(update(original, {a: {b: {$set: 2}}}).a).not.toBe(original.a);
      expect(update(original, {a: {b: {$set: 2}}}).a.b).not.toBe(original.a.b);

      expect(update(original, {a: {b: {$set: 2}}}).c).toBe(original.c);
      expect(update(original, {a: {b: {$set: 2}}}).c.d).toBe(original.c.d);
    });
  });

  it('should accept array spec to modify arrays', () => {
    const original = {value: [{a: 0}]};
    const modified = update(original, {value: [{a: {$set: 1}}]} as any);
    expect(modified).toEqual({value: [{a: 1}]});
  });

  it('should accept object spec to modify arrays', () => {
    const original = {value: [{a: 0}]};
    const modified = update(original, {value: {0: {a: {$set: 1}}}});
    expect(modified).toEqual({value: [{a: 1}]});
  });

  it('should reject arrays except as values of specific commands', () => {
    const specs = [
      [],
      {a: []},
      {a: {$set: []}, b: [[]]},
    ];
    return Promise.all(specs.map(spec => {
      expect(() => update({a: 'b'}, spec as any)).toThrow(
        'update(): You provided an invalid spec to update(). The spec ' +
        'may not contain an array except as the value of $set, $push, ' +
        '$unshift, $splice or any custom command allowing an array value.',
      );
    }));
  });

  it('should reject non arrays from $unset', () => {
    expect(() => update({a: 'b'}, {$unset: 'a'} as any)).toThrow(
      'update(): expected spec of $unset to be an array; got a. ' +
      'Did you forget to wrap your parameter in an array?',
    );
  });

  it('should require a plain object spec containing command(s)', () => {
    const specs = [
      null,
      false,
      {a: 'c'},
      {a: {b: 'c'}},
    ];
    return Promise.all(specs.map(spec => {
      expect(() => update({a: 'b'}, spec as any)).toThrow(
        'update(): You provided an invalid spec to update(). The spec ' +
        'and every included key path must be plain objects containing one ' +
        'of the following commands: $push, $unshift, $splice, $set, $toggle, $unset, ' +
        '$add, $remove, $merge, $apply.',
      );
    }));
  });

  it('should perform safe hasOwnProperty check', () => {
    expect(update({}, {hasOwnProperty: {$set: 'a'}})).toEqual({
      hasOwnProperty: 'a',
    });
  });
});

describe('new Context()', () => {
  let myContext: Context;
  beforeEach(() => {
    myContext = new Context();
  });

  it('has an update method', () => {
    expect(typeof myContext.update).toBe('function');
  });

  it('has an extend method that matches a (deprecated) update.extend', () => {
    expect(myContext.extend).toBe((myContext.update as any).extend);
  });

  it('has an isEquals method that calls a (deprecated) update.isEquals', () => {
    const spy = jest.spyOn(myContext.update as any, 'isEquals');
    myContext.isEquals('foo', 'foo');
    expect(spy).toHaveBeenCalled();
  });

  describe('can extend functionality', () => {

    it('allows adding new directives', () => {
      myContext.extend<number>('$addtax', (tax, original) => {
        return original + (tax * original);
      });
      expect(myContext.update(5, {$addtax: 0.10} as any)).toEqual(5.5);
    });

    it('gets the original object (so be careful about mutations)', () => {
      const obj = {};
      let passedOriginal: any;
      myContext.extend<any>('$foobar', (_prop, original) => {
        passedOriginal = original;
      });
      myContext.update(obj, {$foobar: null});
      expect(obj).toBe(passedOriginal);
    });

    it('doesn\'t touch the original update', () => {
      myContext.extend<number>('$addtax', (tax, original) => {
        return original + (tax * original);
      });
      expect(() => update({$addtax: 0.10}, {$addtax: 0.10} as any)).toThrow();
      expect(() => myContext.update({$addtax: 0.10}, {$addtax: 0.10} as any)).not.toThrow();
    });
  });

  it('can handle nibling directives', () => {
    const obj = {a: [1, 2, 3], b: 'me'};
    const spec = {
      a: {$splice: [[0, 2]]},
      // tslint:disable-next-line:object-literal-sort-keys
      $merge: {b: 'you'},
    };
    expect(update(obj, spec)).toEqual({a: [3], b: 'you'});
  });

  if (typeof Symbol === 'function' && Symbol('TEST').toString() === 'Symbol(TEST)') {
    describe('works with symbols', () => {
      it('in the source object', () => {
        const obj = {a: 1};
        obj[Symbol.for('b')] = 2;
        expect(update(obj, {c: {$set: 3}} as any)[Symbol.for('b')]).toEqual(2);
      });
      it('in the spec object', () => {
        const obj = {a: 1};
        obj[Symbol.for('b')] = 2;
        const spec = {
          [Symbol.for('b')]: {$set: 2},
        };
        expect(update(obj, spec)[Symbol.for('b')]).toEqual(2);
      });
      it('in the $merge command', () => {
        const obj = {
          a: 1,
          [Symbol.for('b')]: {c: 3},
          [Symbol.for('d')]: 4,
        };
        const spec = {
          [Symbol.for('b')]: { $merge: {} },
        };
        spec[Symbol.for('b') as any].$merge[Symbol.for('e')] = 5;
        const updated = update(obj, spec);
        expect(updated[Symbol.for('b') as any][Symbol.for('e')]).toEqual(5);
        expect(updated[Symbol.for('d') as any]).toEqual(4);
      });
    });
  }

  it('supports objects without prototypes', () => {
    const obj = Object.create(null);
    expect(() => update(obj, {$merge: {a: 'b'}})).not.toThrow();
  });

  it('supports objects with prototypes', () => {
    const proto = { a: 'Proto' };
    const obj = Object.create(proto);
    expect(update(obj, { $merge: { b: 'Obj' } }).a).toEqual('Proto');
  });

  it('supports an escape hatch for isEquals', () => {
    myContext.isEquals = (x, y) => {
      return JSON.stringify(x) === JSON.stringify(y);
    };
    expect(myContext.isEquals).toBe((myContext.update as any).isEquals);
    const a = {b: {c: {d: [4, 5]}}};
    const b = myContext.update(a, {b: {c: {d: {$set: [4, 5]}}}});
    const c = myContext.update(a, {b: {$set: {c: {d: [4, 5]}}}});
    const d = myContext.update(a, {$set: {b: {c: {d: [4, 5]}}}});
    expect(a).toBe(b);
    expect(a).toBe(c);
    expect(a).toBe(d);
  });

  it('supports an escape hatch for isEqual for shallow direct apply', () => {
    myContext.isEquals = (x, y) => {
      return JSON.stringify(x) === JSON.stringify(y);
    };
    expect(myContext.isEquals).toBe((myContext.update as any).isEquals);
    const a = { b: 1 };
    const b = myContext.update(a, () => ({ b: 1 }));
    expect(a).toBe(b);
  });

  it('does not lose non integer keys of an array', () => {
    interface IHasTop {
      top: number;
    }
    const state = { items: [
      { name: 'Superman', strength: 1000 },
      { name: 'Jim', strength: 2 },
    ] };
    (state.items as any as IHasTop).top = 0;
    const state2 = update(state, { items: { 1: { strength: { $set: 3 } } } });
    expect((state2.items as any as IHasTop).top).toBe(0);
  });

  it('supports Maps', () => {
    const state = new Map([
      ['mapKey', 'mapValue'],
    ]);

    const updatedState = update(state, {
      ['mapKey']: {$set: 'updatedMapValue' },
    } as any);

    expect(updatedState).toEqual(
      new Map([
        ['mapKey', 'updatedMapValue'],
      ]),
    );
  });

  it('supports nested objects inside Maps', () => {
    const state = new Map([
      ['mapKey', { banana: 'yellow', apple: ['red'], blueberry: 'purple' }],
    ]);

    const updatedState = update(state, {
      ['mapKey']: { apple: { $set: ['green', 'red'] } },
    } as any);

    expect(updatedState).toEqual(
      new Map([
        [
          'mapKey',
          { banana: 'yellow', apple: ['green', 'red'], blueberry: 'purple' },
        ],
      ]),
    );
  });

  it('supports Maps and keeps reference equality when possible', () => {
    const original = new Map([['a', { b: 1 }]]);
    expect(update(original, { a: { $merge: {} } } as any)).toBe(original);
    expect(update(original, { a: { $merge: { c: 2 } } } as any)).not.toBe(original);
  });
});

describe('update', () => {
  it('has a (deprecated) newContext method', () => {
    expect(typeof (update as any).newContext()).toBe('function');
  });
});

describe('works with readonly arrays', () => {
  interface Thing {
    bar: {
      foo: ReadonlyArray<{ baz: number }>;
    };
  }

  const a: Thing = {
    bar: { foo: [ {baz: 1} ] }
  };
  const b: Thing = {
    bar: { foo: [ {baz: 2} ] }
  };
  expect(update(a, {
    bar: {
      foo: { $push: b.bar.foo }
    }
  })).toEqual({
    bar: { foo: [{ baz: 1 }, { baz: 2 }]}
  });
});
