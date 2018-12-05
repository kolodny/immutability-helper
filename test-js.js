const promisify = require('util').promisify;
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
  .then(() => mkdir('test-js-dir'))
  .then(() => process.chdir('test-js-dir'))
  .then(() => exec('npm init -y'))
  .then(() => exec('npm install ../'))
  .then(() => writeFile('foo.js', code))
  .then(() => exec('node foo'))
  .then(result => assert.strictEqual(result.stdout.trim(), '["x","y"]'))
  .then(() => process.exit(0))
  .catch(error => {
    console.error('uncaught error', error);
    process.exit(1);
  });
