immutability-helper
===

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Downloads][downloads-image]][downloads-url]

Mutate a copy of data without changing the original source

This is a drop in replacement for `react-addons-update`:

```js
// import update from 'react-addons-update';
import update from 'immutability-helper';

const state1 = ['x'];
const state2 = update(state1, {$push: ['y']}); // ['x', 'y']
```

The main difference this has with `react-addons-update` is that
you can extend this to give it more functionality:

```js
update.extend('$addtax', function(tax, original) {
  return original + (tax * original);
});
const state = { price: 123 };
const withTax = update(state, {
  price: {$addtax: 0.8},
});
assert(JSON.stringify(withTax) === JSON.stringify({ price: 221.4 });
```
If you don't want to mess around with the globally exported `update` function you can make a copy and work with that copy:

```js
import { newContext } from 'immutability-helper';
const myUpdate = newContext();
myUpdate.extend('$foo', function(value, original) {
  return 'foo!';
});
```

[npm-image]: https://img.shields.io/npm/v/immutability-helper.svg?style=flat-square
[npm-url]: https://npmjs.org/package/immutability-helper
[travis-image]: https://img.shields.io/travis/kolodny/immutability-helper.svg?style=flat-square
[travis-url]: https://travis-ci.org/kolodny/immutability-helper
[coveralls-image]: https://img.shields.io/coveralls/kolodny/immutability-helper.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/kolodny/immutability-helper
[downloads-image]: http://img.shields.io/npm/dm/immutability-helper.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/immutability-helper
