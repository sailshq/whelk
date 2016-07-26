#!/usr/bin/env node

// Usage:
//
// ```
// $ machine-as-script node_modules/machinepack-assets/machines/productionify.js
// ```


/**
 * Module dependencies
 */

var path = require('path');
var yargs = require('yargs');
var _ = require('lodash');
var asScript = require('../');


if (_.isUndefined(yargs.argv._[0])) {
  console.error('Usage:');
  console.error('machine-as-script path/to/the/machine/def/you/want/to/use.js');
  return;
}

var pathToMachineDef = path.resolve(yargs.argv._[0]);
var wetOrDryMachine = require(pathToMachineDef);

// If the module at the specified path exports a wet machine that is already wrapped
// in a call machine-as-script, then just call `.exec()` on it.
if (wetOrDryMachine._telltale === 'machine-as-script') {
  wetOrDryMachine.exec();
}
// Otherwise, wrap it with machine-as-script, then exec() it.
else {
  asScript({
    machine: wetOrDryMachine
  }).exec();
}
