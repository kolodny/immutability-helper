const promisify = require('util').promisify ||
(fn => (...args) => new Promise((resolve, reject) => {
  fn(...args, (error, results) => {
    if (error) reject(error);
    else resolve(results);
  })
}));
const fs = require('fs');
const exec = promisify(require('child_process').exec);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const assert = require('assert');

const code = `
const update = require('immutability-helper');

const state1 = ['x'];
const state2 = update(state1, {$push: ['y']})
console.log(JSON.stringify(state2));
`

Promise.resolve()
  .then(() => mkdir('smoke-test'))
  .then(() => process.chdir('smoke-test'))
  .then(() => exec('npm init -y'))
  .then(() => exec('npm install ../'))
  .then(() => writeFile('foo.js', code))
  .then(() => exec('node foo'))
  .then(result => assert.strictEqual((result.stdout || result).trim(), '["x","y"]'))
  .then(() => process.exit(0))
  .catch(error => {
    console.error('uncaught error', error);
    process.exit(1);
  });
