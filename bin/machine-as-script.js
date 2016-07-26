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
var chalk = require('chalk');
var asScript = require('../');


if (_.isUndefined(yargs.argv._[0])) {
  console.error(chalk.bold('MACHINE AS SCRIPT')+' -- Run any machine as a script.');
  console.error();
  console.error();
  console.error(chalk.bold('USAGE'));
  console.error('     machine-as-script path/to/the/machine/def/you/want/to/use.js');
  console.error();
  console.error();
  console.error(chalk.bold('NOTES'));
  console.error('     You can specify the path to a "dry" node machine def (e.g. `machines/foo.js`)');
  console.error('     or to a module which exports a "wet" machine (i.e. already instantiated)');
  console.error();
  return;
}

// Resolve the path.
var absPath = path.resolve(yargs.argv._[0]);

// Load the machine.
var wetOrDryMachine;
try {
  wetOrDryMachine = require(absPath);
}
catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.error(chalk.bold(chalk.yellow('Could not locate a module at the specified path (`'+absPath+'`).')));
    console.error('Details:');
    throw e;
  }
  else {
    console.error(chalk.bold(chalk.yellow('Encountered an error when trying to load the module at the specified path (`'+absPath+'`).')));
    console.error();
    console.error('Error details:');
    throw e;
  }
}

if (_.isEqual(wetOrDryMachine, {})) {
  console.error(chalk.bold(chalk.yellow('The module at the specified path (`'+absPath+'`) does not see to export anything.')));
  console.error(chalk.bold(chalk.yellow('Specifically, requiring it yielded an empty dictionary (`{}`).')));
  console.error('--------------------------------------------------------------------------');
  console.error('TROUBLESHOOTING:');
  console.error();
  console.error('This could be for any of the following reasons:');
  console.error(' => It does not export anything.');
  console.error();
  console.error(' => It requires a cyclical dependency.');
  console.error('    (For more info on that, see: https://nodejs.org/api/modules.html#modules_cycles)');
  console.error();
  console.error(' => Or (unlikely) it _actually_ exports an empty dictionary (`{}`)');
  console.error();
  console.error('Check and make sure that the code at the specified path does either:');
  console.error('```');
  console.error('module.exports = {...<<machine def here>>...};');
  console.error('```');
  console.error();
  console.error('Or:');
  console.error('```');
  console.error('module.exports = require(\'machine\').build({...<<machine def here>>...});');
  console.error('```');
  console.error();
  console.error('--------------------------------------------------------------------------');
  return;
}


// If the module at the specified path exports a wet machine that is already wrapped
// in a call machine-as-script, then fail with an error message.  This shouldn't ever
// really happen, since scripts don't normally export anything, but it's possible, so
// we aim to handle this case in a way that helps diagnose the problem as quickly as
// possible.
if (wetOrDryMachine._telltale === 'machine-as-script') {
  console.error(chalk.bold(chalk.yellow('The script at the specified path ran.  But...')));
  console.error('It looks like the module at `'+absPath+'` is using machine-as-script internally.');
  console.error('-----------------------------------------------------------------------------------------------------------------------');
  console.error('First of all, the `machine-as-script` command-line tool is designed to be used with "dry" node machine definitions,');
  console.error('or with modules which export "wet" node machine instances.  It should not be called on scripts.');
  console.error('Secondly, it shouldn\'t even be possible for me to know this!');
  console.error('Modules which use `require(\'machine-as-script\')` should never export anything-- they\'re designed to be run in-place.');
  console.error('-----------------------------------------------------------------------------------------------------------------------');
  return;
}
// Otherwise, wrap it with machine-as-script, then exec() it.
else {
  asScript({
    machine: wetOrDryMachine
  }).exec();
}
