/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var program = require('commander');
var chalk = require('chalk');
var yargs = require('yargs');
var Machine = require('machine');
var rttc = require('rttc');



/**
 * asScript()
 *
 * Build a live machine instance adapted for use as a command-line script.
 *
 * (See README.md for more information.)
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param  {Dictionary|Machine} optsOrMachineDef
 *         @property {Dictionary?} machine
 *         @property {Array?} args
 *         @property {Array?} envVarNamespace
 *         @property {SailsApp?} sails
 *
 * @return {LiveMachine}
 *         A live machine instance, but warped to accept argins from
 *         serial command-line args, system environment vars, and
 *         command-line opts; and with pre-configured default exit
 *         handler callbacks that, unless overridden, writes output
 *         to stdout or stderr.
 */
module.exports = function runMachineAsScript(optsOrMachineDef){


  //   ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗     ██████╗ ██████╗ ████████╗███████╗
  //  ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝    ██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝
  //  ██║     ███████║█████╗  ██║     █████╔╝     ██║   ██║██████╔╝   ██║   ███████╗
  //  ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗     ██║   ██║██╔═══╝    ██║   ╚════██║
  //  ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗    ╚██████╔╝██║        ██║   ███████║
  //   ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝     ╚═════╝ ╚═╝        ╚═╝   ╚══════╝
  //
  //     ██╗       ███████╗███████╗████████╗    ██╗   ██╗██████╗
  //     ██║       ██╔════╝██╔════╝╚══██╔══╝    ██║   ██║██╔══██╗
  //  ████████╗    ███████╗█████╗     ██║       ██║   ██║██████╔╝
  //  ██╔═██╔═╝    ╚════██║██╔══╝     ██║       ██║   ██║██╔═══╝
  //  ██████║      ███████║███████╗   ██║       ╚██████╔╝██║
  //  ╚═════╝      ╚══════╝╚══════╝   ╚═╝        ╚═════╝ ╚═╝
  //
  //  ██████╗ ███████╗███████╗ █████╗ ██╗   ██╗██╗  ████████╗███████╗
  //  ██╔══██╗██╔════╝██╔════╝██╔══██╗██║   ██║██║  ╚══██╔══╝██╔════╝
  //  ██║  ██║█████╗  █████╗  ███████║██║   ██║██║     ██║   ███████╗
  //  ██║  ██║██╔══╝  ██╔══╝  ██╔══██║██║   ██║██║     ██║   ╚════██║
  //  ██████╔╝███████╗██║     ██║  ██║╚██████╔╝███████╗██║   ███████║
  //  ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚══════╝
  //
  optsOrMachineDef = optsOrMachineDef||{};

  // Use either `opts` or `opts.machine` as the machine definition
  // If `opts.machine` is truthy, we'll use that as the machine definition.
  // Otherwise, we'll understand the entire `opts` dictionary to be the machine
  // definition.
  var machineDef;
  var opts;
  var MISC_OPTIONS = ['args', 'envVarNamespace', 'sails'];
  if (!optsOrMachineDef.machine) {
    machineDef = optsOrMachineDef;
    opts = _.pick(optsOrMachineDef, MISC_OPTIONS);
  }
  else {
    machineDef = optsOrMachineDef.machine;
    opts = _.pick(optsOrMachineDef, MISC_OPTIONS);
  }

  if (!_.isObject(machineDef)) {
    throw new Error('Consistency violation: Machine definition must be provided as a dictionary.');
  }

  //  ╦  ╦╔═╗╦  ╦╔╦╗╔═╗╔╦╗╔═╗  ┌─┐┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
  //  ╚╗╔╝╠═╣║  ║ ║║╠═╣ ║ ║╣   │ │├─┘ │ ││ ││││└─┐
  //   ╚╝ ╩ ╩╩═╝╩═╩╝╩ ╩ ╩ ╚═╝  └─┘┴   ┴ ┴└─┘┘└┘└─┘
  // Validate optional things.
  _.each(opts, function (optVal, optKey) {
    // Ignore opts with undefined values.
    if (_.isUndefined(optVal)) { return; }

    switch (optKey) {

      case 'args': (function (){
        if (!_.isArray(opts.args)) {
          throw new Error('Invalid script: If specified, `args` should be provided as an array of strings.');
        }

        _.each(opts.args, function (targetInputCodeName){

          // Check that target input definition exists.
          var targetInputDef = _.keys(machineDef.inputs||{});
          if (!targetInputDef) {
            throw new Error('Invalid script: `args` references an unrecognized input (`'+targetInputCodeName+'`).  Each item in `args` should be the code name of a known input defined in this machine definition.');
          }

          // Check that target input definition does not explicitly expect a dictionary, array, or function.
          if (targetInputDef.example === '->' || _.isObject(targetInputDef.example)) {
            throw new Error('Invalid script: `args` references an input (`'+targetInputCodeName+'`) which, based on its `example`, is _never_ compatible with data from serial command-line arguments.');
          }
        });//</_.each() :: target input code name in the `opts.args` array>


      })(); break;


      case 'envVarNamespace': (function (){
        if (!_.isString(opts.envVarNamespace)) {
          throw new Error('Invalid script: If specified, `envVarNamespace` should be provided as a string.');
        }
      })(); break;


      case 'sails': (function (){
        if (!_.isObject(opts.sails) || opts.sails.constructor.name !== 'Sails') {
          throw new Error('Invalid script: The supposed Sails app instance provided as `sails` seems a little sketchy.  Make sure you are doing `sails: require(\'sails\')`.');
        }
        // Note that we do additional validations below.
        // (bcause at this point in the code, we can't yet guarantee the machine's `habitat` will be correct--
        //  at least not across all versions of the `machine` runner)
      })(); break;


      default:
        throw new Error('Consistency violation: Internal bug in machine-as-script.  An option (`'+optKey+'`) is unrecognized, but we should never have unrecognized opts at this point.');
    }

  });


  //  ┌─┐┌─┐┌┬┐  ╔╦╗╔═╗╔═╗╔═╗╦ ╦╦ ╔╦╗╔═╗  ┌─┐┌─┐┬─┐  ┌─┐┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
  //  └─┐├┤  │    ║║║╣ ╠╣ ╠═╣║ ║║  ║ ╚═╗  ├┤ │ │├┬┘  │ │├─┘ │ ││ ││││└─┐
  //  └─┘└─┘ ┴   ═╩╝╚═╝╚  ╩ ╩╚═╝╩═╝╩ ╚═╝  └  └─┘┴└─  └─┘┴   ┴ ┴└─┘┘└┘└─┘
  // Set up namespace for system environment variables that will be automatically parsed.
  var envVarNamespace = '___';
  if (_.isString(opts.envVarNamespace)) {
    envVarNamespace = opts.envVarNamespace;
  }


  // We'll use this local variable (`habitatVarsToSet`) build up the dictionary we'll pass in
  // to the machine below via `setEnv`.
  //
  // > Remember:
  // > The habitat vars that get passed in as `env` are _completely_ different from
  // > system "environment variables"!  This `env` is more closely related to the
  // > notion of "habitat" in the machine spec (hence the name.)
  // >
  // > See http://node-machine.org for more details.
  var habitatVarsToSet = {};




  //  ██████╗ ██╗   ██╗██╗██╗     ██████╗
  //  ██╔══██╗██║   ██║██║██║     ██╔══██╗
  //  ██████╔╝██║   ██║██║██║     ██║  ██║
  //  ██╔══██╗██║   ██║██║██║     ██║  ██║
  //  ██████╔╝╚██████╔╝██║███████╗██████╔╝
  //  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝
  //
  //  ███╗   ███╗ █████╗  ██████╗██╗  ██╗██╗███╗   ██╗███████╗
  //  ████╗ ████║██╔══██╗██╔════╝██║  ██║██║████╗  ██║██╔════╝
  //  ██╔████╔██║███████║██║     ███████║██║██╔██╗ ██║█████╗
  //  ██║╚██╔╝██║██╔══██║██║     ██╔══██║██║██║╚██╗██║██╔══╝
  //  ██║ ╚═╝ ██║██║  ██║╚██████╗██║  ██║██║██║ ╚████║███████╗
  //  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝
  //
  //  ██╗███╗   ██╗███████╗████████╗ █████╗ ███╗   ██╗ ██████╗███████╗
  //  ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗████╗  ██║██╔════╝██╔════╝
  //  ██║██╔██╗ ██║███████╗   ██║   ███████║██╔██╗ ██║██║     █████╗
  //  ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║╚██╗██║██║     ██╔══╝
  //  ██║██║ ╚████║███████║   ██║   ██║  ██║██║ ╚████║╚██████╗███████╗
  //  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝
  //
  // `Machine.build()` tolerates:
  //   • machine definitions
  //   • already-instantiated ("wet") machine instances (just passes them through)
  //   • naked functions (builds them into an anonymous machine automatically.  For convenience and quick prototyping)

  // But since we're modifying the machine definition here...
  // we need to duck-type the provided machine to determine whether or not it is an already-instantiated machine or not.
  // If it is, use as-is. Otherwise, use the definition to build a new machine.
  // (checks new `isWetMachine` property, but also the function name for backwards compatibility)
  //
  // > TODO: consider moving this check into machine runner
  var wetMachine;
  if (machineDef.isWetMachine || machineDef.name==='_callableMachineWrapper') {
    wetMachine = machineDef;
  }
  else {
    var scriptIdentity =  machineDef.identity || (machineDef.friendlyName ? _.kebabCase(machineDef.friendlyName) : 'anonymous-machine-as-script');
    wetMachine = Machine.build(_.extend({
      identity: scriptIdentity,
      inputs: {},
      exits: {
        success: {
          description: 'Done.'
        },
        error: {
          description: 'Unexpected error occurred.'
        }
      },
      fn: function (inputs, exits){
        exits.error(new Error('This script (`'+scriptIdentity+'`) is not implemented yet! (Ran stub `fn` injected by `machine-as-script`.)'));
      }
    }, machineDef));
  }//</else :: the provided machine def is not a pre-built, "wet" machine instance>


  //   ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗
  //  ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝
  //  ██║     ███████║█████╗  ██║     █████╔╝
  //  ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗
  //  ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗
  //   ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝
  //
  //  ██████╗ ██████╗  ██████╗ ██╗   ██╗██╗██████╗ ███████╗██████╗
  //  ██╔══██╗██╔══██╗██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔══██╗
  //  ██████╔╝██████╔╝██║   ██║██║   ██║██║██║  ██║█████╗  ██║  ██║
  //  ██╔═══╝ ██╔══██╗██║   ██║╚██╗ ██╔╝██║██║  ██║██╔══╝  ██║  ██║
  //  ██║     ██║  ██║╚██████╔╝ ╚████╔╝ ██║██████╔╝███████╗██████╔╝
  //  ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚═╝╚═════╝ ╚══════╝╚═════╝
  //
  //  ███████╗ █████╗ ██╗██╗     ███████╗     █████╗ ██████╗ ██████╗
  //  ██╔════╝██╔══██╗██║██║     ██╔════╝    ██╔══██╗██╔══██╗██╔══██╗
  //  ███████╗███████║██║██║     ███████╗    ███████║██████╔╝██████╔╝
  //  ╚════██║██╔══██║██║██║     ╚════██║    ██╔══██║██╔═══╝ ██╔═══╝
  //  ███████║██║  ██║██║███████╗███████║    ██║  ██║██║     ██║
  //  ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝    ╚═╝  ╚═╝╚═╝     ╚═╝
  //
  //  ██╗███╗   ██╗███████╗████████╗ █████╗ ███╗   ██╗ ██████╗███████╗
  //  ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗████╗  ██║██╔════╝██╔════╝
  //  ██║██╔██╗ ██║███████╗   ██║   ███████║██╔██╗ ██║██║     █████╗
  //  ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║╚██╗██║██║     ██╔══╝
  //  ██║██║ ╚████║███████║   ██║   ██║  ██║██║ ╚████║╚██████╗███████╗
  //  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝
  //
  // Finally, before moving on, we check the `habitat`.  Since we'll potentially
  // provide access to `env.sails`, we need to make sure a valid Sails app was
  // passed in.
  if (wetMachine.habitat === 'request') {
    throw new Error('The target machine defintion declares a dependency on the `request` habitat, which cannot be provided via the command-line interface.  This machine cannot be run using machine-as-script.');
  }
  // If the machine depends on the Sails habitat:
  else if (wetMachine.habitat === 'sails') {

    // ...then we'll want to attempt to use the provided version of `sails` (a SailsApp instance.)
    // If no `sails` was provided to machine-as-script, then we'll throw an error.
    if (!opts.sails) {
      throw new Error('The target machine defintion declares a dependency on the `sails` habitat, but no `sails` app instance was provided as a top-level option to machine-as-script.  Make sure this script module is doing: `sails: require(\'sails\')`');
    }

    // Down below, we'll attempt to load (but not lift) the Sails app in the current working directory.
    // If it works, then we'll run the script, providing it with `env.sails`.  After that, regardless of
    // how the script exits, we'll call `sails.lower()` to clean up.
    //
    // In the mean time, we'll go ahead and save a reference to this Sails app on `habitatVarsToSet`, since we'll
    // be passing it into the machine instance's `fn` as `env.sails` (via `.setEnv()`)
    habitatVarsToSet.sails = opts.sails;

  }//</if (machine depends on `sails` habitat)>



  //  ██████╗ ██╗   ██╗██╗██╗     ██████╗     ██╗   ██╗███████╗ █████╗  ██████╗ ███████╗
  //  ██╔══██╗██║   ██║██║██║     ██╔══██╗    ██║   ██║██╔════╝██╔══██╗██╔════╝ ██╔════╝
  //  ██████╔╝██║   ██║██║██║     ██║  ██║    ██║   ██║███████╗███████║██║  ███╗█████╗
  //  ██╔══██╗██║   ██║██║██║     ██║  ██║    ██║   ██║╚════██║██╔══██║██║   ██║██╔══╝
  //  ██████╔╝╚██████╔╝██║███████╗██████╔╝    ╚██████╔╝███████║██║  ██║╚██████╔╝███████╗
  //  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
  //
  //   ██╗ ██████╗ ██████╗ ███╗   ███╗███╗   ███╗ █████╗ ███╗   ██╗██████╗ ███████╗██████╗ ██╗
  //  ██╔╝██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝██╔══██╗╚██╗
  //  ██║ ██║     ██║   ██║██╔████╔██║██╔████╔██║███████║██╔██╗ ██║██║  ██║█████╗  ██████╔╝ ██║
  //  ██║ ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗ ██║
  //  ╚██╗╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║██████╔╝███████╗██║  ██║██╔╝
  //   ╚═╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝
  //
  // ======================================================================
  // Now we'll put together the configuration for our wet machine instance.
  // (using CLI opts, serial command-line args, and/or env vars)
  // ======================================================================

  // Configure CLI usage helptext and set up commander
  program.usage('[options]');

  // Keep track of shortcuts used (e.g. can't have a "-p" option mean two different things at once)
  var shortcutsSoFar = [];

  // Loop over each input and set up command line opts for usage docs generated by commander.
  _.each(wetMachine.inputs, function (inputDef, inputCodeName) {

    // Handle `--` flags
    var opt = '--'+inputCodeName;

    // Handle `-` shortcuts
    var optShortcut = (function (){
      var _shortcut = '-'+inputCodeName[0];
      // If shortcut flag already exists using the same letter, don't provide a shortcut for this option.
      if (_.contains(shortcutsSoFar, _shortcut)) return;
      // Otherwise, keep track of the shortcut so we don't inadvertently use it again.
      shortcutsSoFar.push(_shortcut);
      return _shortcut;
    })();
    var optDescription = (function determineOptDescription(){
      var _optDescription = inputDef.description || inputDef.friendlyName || '';
      return (_optDescription[0]||'').toLowerCase() + _optDescription.slice(1);
    })();

    // Call out to commander and apply usage
    var optUsage = (function (){
      if (optShortcut){
        return util.format('%s, %s', optShortcut, opt);
      }
      return util.format('%s', opt);
    })();
    if (optDescription) {
      program.option(optUsage, optDescription);
    }
    else {
      program.option(optUsage);
    }

  });
  program.parse(process.argv);


  // Notice we DON'T tolerate unknown options
  // If we wnated to, we'd have to have something like the following:
  // .unknownOption = function NOOP(){};



  //  ██████╗  █████╗ ██████╗ ███████╗███████╗     █████╗ ██████╗  ██████╗ ███╗   ███╗████████╗███████╗
  //  ██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝    ██╔══██╗██╔══██╗██╔════╝ ████╗ ████║╚══██╔══╝██╔════╝
  //  ██████╔╝███████║██████╔╝███████╗█████╗      ███████║██████╔╝██║  ███╗██╔████╔██║   ██║   ███████╗
  //  ██╔═══╝ ██╔══██║██╔══██╗╚════██║██╔══╝      ██╔══██║██╔══██╗██║   ██║██║╚██╔╝██║   ██║   ╚════██║
  //  ██║     ██║  ██║██║  ██║███████║███████╗    ██║  ██║██║  ██║╚██████╔╝██║ ╚═╝ ██║   ██║   ███████║
  //  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝   ╚═╝   ╚══════╝
  //     ██╗        ██████╗ ██████╗ ███╗   ██╗███████╗██╗ ██████╗ ██╗   ██╗██████╗ ███████╗
  //     ██║       ██╔════╝██╔═══██╗████╗  ██║██╔════╝██║██╔════╝ ██║   ██║██╔══██╗██╔════╝
  //  ████████╗    ██║     ██║   ██║██╔██╗ ██║█████╗  ██║██║  ███╗██║   ██║██████╔╝█████╗
  //  ██╔═██╔═╝    ██║     ██║   ██║██║╚██╗██║██╔══╝  ██║██║   ██║██║   ██║██╔══██╗██╔══╝
  //  ██████║      ╚██████╗╚██████╔╝██║ ╚████║██║     ██║╚██████╔╝╚██████╔╝██║  ██║███████╗
  //  ╚═════╝       ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝
  //
  //  \│/╔═╗╔═╗╦═╗╔═╗╔═╗  ┬─┐┬ ┬┌┐┌┌┬┐┬┌┬┐┌─┐  ┬  ┬┌─┐┬  ┬ ┬┌─┐┌─┐  ┌─┐┌─┐┬─┐\│/
  //  ─ ─╠═╝╠═╣╠╦╝╚═╗║╣   ├┬┘│ ││││ │ ││││├┤   └┐┌┘├─┤│  │ │├┤ └─┐  ├┤ │ │├┬┘─ ─
  //  /│\╩  ╩ ╩╩╚═╚═╝╚═╝  ┴└─└─┘┘└┘ ┴ ┴┴ ┴└─┘   └┘ ┴ ┴┴─┘└─┘└─┘└─┘  └  └─┘┴└─/│\
  //  ┌─┐┬  ┬  ┌─┐┌─┐┌┬┐┌─┐   ┬   ┌─┐┌─┐┬─┐┬┌─┐┬    ┌─┐┬─┐┌─┐┌─┐   ┬   ┌─┐┌┐┌┬  ┬  ┬  ┬┌─┐┬─┐┌─┐
  //  │  │  │  │ │├─┘ │ └─┐  ┌┼─  └─┐├┤ ├┬┘│├─┤│    ├─┤├┬┘│ ┬└─┐  ┌┼─  ├┤ │││└┐┌┘  └┐┌┘├─┤├┬┘└─┐
  //  └─┘┴─┘┴  └─┘┴   ┴ └─┘  └┘   └─┘└─┘┴└─┴┴ ┴┴─┘  ┴ ┴┴└─└─┘└─┘  └┘   └─┘┘└┘ └┘    └┘ ┴ ┴┴└─└─┘┘
  //  ┌┬┐┬ ┬┌─┐┌┐┌  ╔═╗╔═╗╔╗╔╔═╗╦╔═╗╦ ╦╦═╗╔═╗  ┌┬┐┬ ┬┌─┐  ┬ ┬┌─┐┌┬┐  ┌┬┐┌─┐┌─┐┬ ┬┬┌┐┌┌─┐
  //   │ ├─┤├┤ │││  ║  ║ ║║║║╠╣ ║║ ╦║ ║╠╦╝║╣    │ ├─┤├┤   │││├┤  │   │││├─┤│  ├─┤││││├┤
  //   ┴ ┴ ┴└─┘┘└┘  ╚═╝╚═╝╝╚╝╚  ╩╚═╝╚═╝╩╚═╚═╝   ┴ ┴ ┴└─┘  └┴┘└─┘ ┴   ┴ ┴┴ ┴└─┘┴ ┴┴┘└┘└─┘
  //  ┌┬┐┌─┐  ┌─┐┌─┐┌┬┐  ┌─┐  ╦  ╦╦  ╦╔═╗  ╔╦╗╔═╗╔═╗╦ ╦╦╔╗╔╔═╗  ┬┌┐┌┌─┐┌┬┐┌─┐┌┐┌┌─┐┌─┐
  //   │ │ │  │ ┬├┤  │   ├─┤  ║  ║╚╗╔╝║╣   ║║║╠═╣║  ╠═╣║║║║║╣   ││││└─┐ │ ├─┤││││  ├┤
  //   ┴ └─┘  └─┘└─┘ ┴   ┴ ┴  ╩═╝╩ ╚╝ ╚═╝  ╩ ╩╩ ╩╚═╝╩ ╩╩╝╚╝╚═╝  ┴┘└┘└─┘ ┴ ┴ ┴┘└┘└─┘└─┘o

  // Build runtime input values from serial command-line arguments, system environment variables, and command-line options.
  var argins = {};


  //  ┌─┐┌─┐┬─┐┌─┐┌─┐  ╔═╗╔═╗╔╦╗╔╦╗╔═╗╔╗╔╔╦╗   ╦  ╦╔╗╔╔═╗  ╔═╗╔═╗╔╦╗╔═╗
  //  ├─┘├─┤├┬┘└─┐├┤   ║  ║ ║║║║║║║╠═╣║║║ ║║───║  ║║║║║╣   ║ ║╠═╝ ║ ╚═╗
  //  ┴  ┴ ┴┴└─└─┘└─┘  ╚═╝╚═╝╩ ╩╩ ╩╩ ╩╝╚╝═╩╝   ╩═╝╩╝╚╝╚═╝  ╚═╝╩   ╩ ╚═╝
  // Supply CLI options
  // (the ones that start with `-` or `--`)
  // =======================================================================================
  _.extend(argins, yargs.argv);
  delete argins._;
  delete argins.$0;

  // Since yargs parses somethings as numbers, cast everything to strings just in case.
  // (we'll use rttc.parseHuman() to parse these strings below)
  argins = _.reduce(argins, function (memo, supposedArgin, inputCodeName) {
    if (_.isUndefined(supposedArgin)) {
      delete memo[inputCodeName];
    }
    else if (_.isNumber(supposedArgin) || _.isBoolean(supposedArgin) || _.isNull(supposedArgin)) {
      memo[inputCodeName] = supposedArgin+'';
    }
    else if (_.isString(supposedArgin)) {
      memo[inputCodeName] = supposedArgin;
    }
    else {
      throw new Error('Consistency violation: The value for `'+inputCodeName+'` that yargs parsed from command-line opts is unusable:' + util.inspect(supposedArgin, {depth: null}));
    }

    return memo;
  }, argins);

  // FUTURE:
  // Make the following usage work in the way you would expect:
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // ```
  // kit exclaim --verbose 'my sweet code comment' wat --width '37'
  // ```
  // Currently, `'my sweet code comment'` is parsed as "verbose",
  // even though "verbose" should really be a boolean, and so that
  // string should be interpreted as a serial command-line arg (not an opt).
  //
  // (see https://github.com/yargs/yargs#booleankey for more info)
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  // FUTURE:
  // Consider something like the following:
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // // Check that we didn't receive any command-line opts that don't correspond with any recognized input.
  // _.each(argins, function (supposedArgin, inputCodeName) {
  //   var inputDef = wetMachine.inputs[inputCodeName];
  //   if (!inputDef) {
  //     throw new Error('Unrecognized option (`--'+inputCodeName+'`)');
  //   }
  // });//</_.each() :: argin so far; i.e. each command-line opt>
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


  //  ┌─┐┌─┐┬─┐┌─┐┌─┐  ╔═╗╦ ╦╔═╗╔╦╗╔═╗╔╦╗  ╔═╗╔╗╔╦  ╦╦╦═╗╔═╗╔╗╔╔╦╗╔═╗╔╗╔╔╦╗  ╦  ╦╔═╗╦═╗╔═╗
  //  ├─┘├─┤├┬┘└─┐├┤   ╚═╗╚╦╝╚═╗ ║ ║╣ ║║║  ║╣ ║║║╚╗╔╝║╠╦╝║ ║║║║║║║║╣ ║║║ ║   ╚╗╔╝╠═╣╠╦╝╚═╗
  //  ┴  ┴ ┴┴└─└─┘└─┘  ╚═╝ ╩ ╚═╝ ╩ ╚═╝╩ ╩  ╚═╝╝╚╝ ╚╝ ╩╩╚═╚═╝╝╚╝╩ ╩╚═╝╝╚╝ ╩    ╚╝ ╩ ╩╩╚═╚═╝
  // Supply environment variables
  // =======================================================================================
  _.each(wetMachine.inputs, function (inputDef, inputCodeName){
    var envVarData = process.env[envVarNamespace + inputCodeName];
    if (_.isUndefined(envVarData)) {
      return;
    }
    // If system environment var exists, but it's not a string, freak out.
    // (this should never happen)
    else if (!_.isString(envVarData)) {
      throw new Error('Consistency violation: `process.env[\''+envVarNamespace + inputCodeName+'\']` was not undefined, but not a string!  This should never happen.  But it did, I guess.  Here\'s the value: `'+envVarData+'`');
    }
    // If a valid environment variable exists, we'll grab its value and
    // supply it as configuration for this input.
    else {
      argins[inputCodeName] = envVarData;
    }

  });


  //  ┌─┐┌─┐┬─┐┌─┐┌─┐  ╔═╗╔═╗╦═╗╦╔═╗╦    ╔═╗╔═╗╔╦╗╔╦╗╔═╗╔╗╔╔╦╗   ╦  ╦╔╗╔╔═╗  ╔═╗╦═╗╔═╗╔═╗
  //  ├─┘├─┤├┬┘└─┐├┤   ╚═╗║╣ ╠╦╝║╠═╣║    ║  ║ ║║║║║║║╠═╣║║║ ║║───║  ║║║║║╣   ╠═╣╠╦╝║ ╦╚═╗
  //  ┴  ┴ ┴┴└─└─┘└─┘  ╚═╝╚═╝╩╚═╩╩ ╩╩═╝  ╚═╝╚═╝╩ ╩╩ ╩╩ ╩╝╚╝═╩╝   ╩═╝╩╝╚╝╚═╝  ╩ ╩╩╚═╚═╝╚═╝
  // Supply serial command-line arguments
  // (the kind that come one after another -- i.e. they don't start with `-` or `--`)
  // =======================================================================================

  var rawSerialCommandLineArgs = _.isArray(yargs.argv._) ? yargs.argv._ : [];

  // But if `opts.args` was provided, then we ALSO iterate through the serial command-line
  // args and provide them as values for the appropriate inputs (i.e. according to the order
  // of code names in `opts.args`.)
  if (_.isArray(opts.args)) {
    _.each(opts.args, function (inputCodeName, i){

      // If serial command-line arg was not actually provided, then skip it.
      // (it's ok- an argin for this input may have been provided as a command-line opt or a system env var)
      if (_.isUndefined(rawSerialCommandLineArgs[i])) {
        return;
      }
      // But if it was provided and it's not a string, freak out.
      else if (!_.isString(rawSerialCommandLineArgs[i])) {
        throw new Error('Consistency violation: The value yargs parsed from serial command-line arg #'+i+' for input `'+inputCodeName+'` is invalid: '+rawSerialCommandLineArgs[i]);
      }
      // Otherwise, use the provided arg.
      else {
        argins[inputCodeName] = rawSerialCommandLineArgs[i];
      }
    });//</each input code name in `opts.args`>

    // If too many serial command-line arguments were provided, then throw an error.
    // (This is because opts.args was set.)
    if (rawSerialCommandLineArgs.length > opts.args.length) {
      var extraSerialCommandLineArgs = rawSerialCommandLineArgs.slice(opts.args.length);
      throw new Error(
        'Too many serial command-line arguments were provided.  '+
        'Did not recognize '+extraSerialCommandLineArgs.length+' extra argument'+(extraSerialCommandLineArgs.length === 1 ? '' : 's')+
        ': '+extraSerialCommandLineArgs
      );
    }
  }
  // > Note that we _allow_ there to be an ∞ number of serial command-line arguments if the
  // > `opts.args` directive is NOT in use. (Consider the use case where you want a dynamic
  // > number of serial command-line arguments)


  // Set ourselves up to expose `env.serialCommandLineArgs` in just a bit.
  habitatVarsToSet.serialCommandLineArgs = rawSerialCommandLineArgs;
  // (^^ Note that we always supply `env.serialCommandLineArgs`, and that they're unaffected
  //  by the `args` directive.)




  //  ┌┐┌┌─┐┬─┐┌┬┐┌─┐┬  ┬┌─┐┌─┐  ┬┌┐┌┌─┐┌─┐┌┬┐┬┌┐┌┌─┐  ┌┬┐┌─┐┌┬┐┌─┐
  //  ││││ │├┬┘│││├─┤│  │┌─┘├┤   │││││  │ │││││││││ ┬   ││├─┤ │ ├─┤
  //  ┘└┘└─┘┴└─┴ ┴┴ ┴┴─┘┴└─┘└─┘  ┴┘└┘└─┘└─┘┴ ┴┴┘└┘└─┘  ─┴┘┴ ┴ ┴ ┴ ┴
  //  ┬ ┬┌─┐┬┌┐┌┌─┐  ╦═╗╔╦╗╔╦╗╔═╗ ╔═╗╔═╗╦═╗╔═╗╔═╗╦ ╦╦ ╦╔╦╗╔═╗╔╗╔
  //  │ │└─┐│││││ ┬  ╠╦╝ ║  ║ ║   ╠═╝╠═╣╠╦╝╚═╗║╣ ╠═╣║ ║║║║╠═╣║║║
  //  └─┘└─┘┴┘└┘└─┘  ╩╚═ ╩  ╩ ╚═╝o╩  ╩ ╩╩╚═╚═╝╚═╝╩ ╩╚═╝╩ ╩╩ ╩╝╚╝
  // Finally, loop through each of the input configurations and run `rttc.parseHuman()`.
  argins = _.reduce(argins, function (memo, val, inputCodeName){

    // Skip special `args` input (unless there's actually an input named `args`.)
    var inputDef = wetMachine.inputs[inputCodeName];
    if (!inputDef) {
      throw new Error('Consistency violation: Received argin for unrecognized input ('+inputCodeName+').  But that should never happen!');
    }

    // Now use `rttc.parseHuman()` to interpret the incoming data.
    try {
      memo[inputCodeName] = rttc.parseHuman(val, rttc.infer(inputDef.example));
    } catch (e) {
      if (e.code === 'E_INVALID') {
        // If parsing fails because the human string can't be lightly coerced to match the type schema,
        // then just set the raw human string as the argin and let the machine runner's validation take
        // care of it.
        memo[inputCodeName] = val;
      }
      else {
        throw new Error('Consistency violation: Could not parse the value specified for `'+inputCodeName+'`.  Details: '+e.stack);
      }
    }

    return memo;
  }, {});


  //  ┌─┐┬─┐┌─┐┬  ┬┬┌┬┐┌─┐  ┌─┐┬─┐┌─┐┬┌┐┌┌─┐  ┌┬┐┌─┐  ┌┬┐┌─┐┌─┐┬ ┬┬┌┐┌┌─┐  ┬┌┐┌┌─┐┌┬┐┌─┐┌┐┌┌─┐┌─┐
  //  ├─┘├┬┘│ │└┐┌┘│ ││├┤   ├─┤├┬┘│ ┬││││└─┐   │ │ │  │││├─┤│  ├─┤││││├┤   ││││└─┐ │ ├─┤││││  ├┤
  //  ┴  ┴└─└─┘ └┘ ┴─┴┘└─┘  ┴ ┴┴└─└─┘┴┘└┘└─┘   ┴ └─┘  ┴ ┴┴ ┴└─┘┴ ┴┴┘└┘└─┘  ┴┘└┘└─┘ ┴ ┴ ┴┘└┘└─┘└─┘
  // Set input values from serial command-line args / system environment variables / command-line opts
  var liveMachine = wetMachine(argins);


  // console.log('----------------------------------------------------------------------');
  // console.log('serial command-line args: ',habitatVarsToSet.serialCommandLineArgs);
  // console.log('input configuration that was parsed: ',argins);
  // console.log('----------------------------------------------------------------------');


  //  ██████╗ ██╗   ██╗██╗██╗     ██████╗
  //  ██╔══██╗██║   ██║██║██║     ██╔══██╗
  //  ██████╔╝██║   ██║██║██║     ██║  ██║
  //  ██╔══██╗██║   ██║██║██║     ██║  ██║
  //  ██████╔╝╚██████╔╝██║███████╗██████╔╝
  //  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝
  //
  //   ██████╗ █████╗ ██╗     ██╗     ██████╗  █████╗  ██████╗██╗  ██╗███████╗
  //  ██╔════╝██╔══██╗██║     ██║     ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝
  //  ██║     ███████║██║     ██║     ██████╔╝███████║██║     █████╔╝ ███████╗
  //  ██║     ██╔══██║██║     ██║     ██╔══██╗██╔══██║██║     ██╔═██╗ ╚════██║
  //  ╚██████╗██║  ██║███████╗███████╗██████╔╝██║  ██║╚██████╗██║  ██╗███████║
  //   ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝
  //
  // Now build up a default handler callback for each exit.
  // (Note that these can be overridden though!)
  var callbacks = {};

  // We use a local variable (`exitAttempts`) as a spinlock.
  // (it tracks the code names of _which_ exit(s) were already triggered)
  var exitAttempts = [];

  _.each(_.keys(wetMachine.exits), function builtExitCallback(exitCodeName){

    // Build a callback for this exit that appropriately terminates the process for this script.
    callbacks[exitCodeName] = function terminateApropos(output){

      //  ┌┬┐┌─┐┌─┐┌─┐┬ ┬┬ ┌┬┐  ╔═╗╦═╗╦═╗╔═╗╦═╗  ┬ ┬┌─┐┌┐┌┌┬┐┬  ┌─┐┬─┐
      //   ││├┤ ├┤ ├─┤│ ││  │   ║╣ ╠╦╝╠╦╝║ ║╠╦╝  ├─┤├─┤│││ │││  ├┤ ├┬┘
      //  ─┴┘└─┘└  ┴ ┴└─┘┴─┘┴   ╚═╝╩╚═╩╚═╚═╝╩╚═  ┴ ┴┴ ┴┘└┘─┴┘┴─┘└─┘┴└─
      // Default catchall `error` behavior
      // (machine either called `exits.error()` on purpose, or it ran into an unhandled internal error,
      //  or the argins failed to validate, or it timed out, etc.)
      if (exitCodeName === 'error') {

        // Since this is the error exit, we know that the output ALWAYS exists, and is ALWAYS an Error instance.
        var err = output;

        // Build base failure msg (used below)
        var baseFailureMsg = 'Could not ';
        if (machineDef.description) {
          baseFailureMsg += machineDef.description[0].toLowerCase() + machineDef.description.slice(1);
        }
        else {
          baseFailureMsg += 'run script.';
        }


        // Check what kind of catchall `error` this is.
        var isValidationError = err.code === 'E_MACHINE_RUNTIME_VALIDATION' && err.machineInstance === liveMachine;
        var isTimeoutError = err.code === 'E_MACHINE_TIMEOUT';// TODO: add check like `&& err.machineInstance === liveMachine;`

        // If it's clear from the output that this is a runtime validation error _from
        // this specific machine_ (and not from any machines it might call internally
        // in its `fn`), show specialized output.
        if (isValidationError) {
          // Sanity check:
          if (!_.isArray(output.errors)) { throw new Error('Consistency violation: E_MACHINE_RUNTIME_VALIDATION errors should _always_ have an `errors` array.'); }

          // console.error();
          // console.error(chalk.bold.dim('• • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • '));
          // console.error(chalk.bold.bgRed(baseFailureMsg));
          // console.error(chalk.bold.red(baseFailureMsg));
          // console.error(chalk.bold(baseFailureMsg));
          console.error(baseFailureMsg);
          // console.error();
          console.error(output.errors.length+' arg'+(output.errors.length>1?'s':'')+'/opt'+(output.errors.length>1?'s':'')+' '+(output.errors.length>1?'are':'is')+' missing or invalid:');
          var prettyPrintedValidationErrorsStr = _.map(output.errors, function (rttcValidationErr){ return '  • '+rttcValidationErr.message; }).join('\n');
          console.error(prettyPrintedValidationErrorsStr);
          // console.error(chalk.bold.dim('• • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • '));
          console.error();

          return process.exit(1);
        }
        // Check to see if this is a timeout error.  If so, show more specialized output.
        // (note that this might have originated from other machines this script calls internally
        //  in its `fn` -- that's ok, the error is still meaningful.)
        //
        else if (isTimeoutError) {
          // TODO: do a machine
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // > Note: Since this calls `process.exit(1)`, it means that `machine-as-script` effectively
          // > honors the `timeout` property that can be specified at the top-level of a compact node
          // > machine definition.
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // console.error(chalk.red.bold(baseFailureMsg));
          console.error(baseFailureMsg);
          console.error(chalk.reset('This is taking too long.'));
          console.error(chalk.gray('Should have finished in '+chalk.bold(machineDef.timeout+'ms')+' or less.'));
          console.error();
          return process.exit(1);
        }
        // Otherwise, this is some kind of unexpected error:
        else {
          var stackLines = err.stack.split('\n');
          // console.error(chalk.reset('Script encountered an unexpected error:'));
          // console.error(chalk.bgRed.bold('Script encountered an unexpected error.'));
          // console.error(chalk.red.bold('Script failed.'));
          // console.error();
          // console.error(chalk.reset('Script failed.'));
          console.error(baseFailureMsg);
          // console.error(chalk.reset('----------------------------------------------------------------------'));
          // console.error(chalk.reset('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - '));
          console.error(chalk.reset(stackLines[0]));
          console.error(chalk.dim(stackLines.slice(1).join('\n')));
          // console.error(chalk.reset('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - '));
          // console.error(chalk.reset('----------------------------------------------------------------------'));
          console.error();
          return process.exit(1);
        }
      }//</if :: the machine called `exits.error()` for whatever reason>
      // ‡
      //  ┌┬┐┌─┐┌─┐┌─┐┬ ┬┬ ┌┬┐  ╔═╗╦ ╦╔═╗╔═╗╔═╗╔═╗╔═╗  ┬ ┬┌─┐┌┐┌┌┬┐┬  ┌─┐┬─┐
      //   ││├┤ ├┤ ├─┤│ ││  │   ╚═╗║ ║║  ║  ║╣ ╚═╗╚═╗  ├─┤├─┤│││ │││  ├┤ ├┬┘
      //  ─┴┘└─┘└  ┴ ┴└─┘┴─┘┴   ╚═╝╚═╝╚═╝╚═╝╚═╝╚═╝╚═╝  ┴ ┴┴ ┴┘└┘─┴┘┴─┘└─┘┴└─
      // Default `success` behavior
      else if (exitCodeName === 'success') {

        // If no output was received, then simply call it a day.
        if (_.isUndefined(output)) {
          //--•
          // We SHOULD just be able to let the process exit naturally.
          // But just in case there are any lingering event listeners,
          // etc, we'll manually exit with a status code of 0.
          return process.exit(0);
        }
        // Otherwise, output was received.
        else {

          // Figure out if our exit was expecting any output.
          var wasOutputExpected =
            !_.isUndefined(liveMachine.exits.success.outputExample) ||
            !_.isUndefined(liveMachine.exits.success.example) ||
            _.isFunction(liveMachine.exits.success.getExample) ||
            !_.isUndefined(liveMachine.exits.success.like) ||
            !_.isUndefined(liveMachine.exits.success.itemOf);

          // If so, then log the output.
          if (wasOutputExpected) {
            try {
              // TODO: support json-encoded output vs colors
              console.log(util.inspect(output, {depth: null, colors: true}));
            } catch (e) {
              throw new Error('Consistency violation: Could not log provided output.  Details: '+util.inspect(e, {depth: null}));
            }
          }
          // Otherwise, output was not expected.
          // (So don't log anything.)
          else { }

          // If the process has not already been explicitly terminated
          // by throwing an uncaught fatal error above, then we SHOULD
          // just be able to let it exit naturally.  But just in case
          // there are any lingering event listeners, etc, we'll manually
          // exit with a status code of 0.
          return process.exit(0);

        }//</else :: output was received>

      }//</if :: the machine called `exits.success()`>
      // ‡
      //  ┌┬┐┌─┐┌─┐┌─┐┬ ┬┬ ┌┬┐  ╔╦╗╦╔═╗╔═╗╔═╗╦  ╦  ╔═╗╔╗╔╔═╗╔═╗╦ ╦╔═╗  ┌─┐─┐ ┬┬┌┬┐  ┬ ┬┌─┐┌┐┌┌┬┐┬  ┌─┐┬─┐
      //   ││├┤ ├┤ ├─┤│ ││  │   ║║║║╚═╗║  ║╣ ║  ║  ╠═╣║║║║╣ ║ ║║ ║╚═╗  ├┤ ┌┴┬┘│ │   ├─┤├─┤│││ │││  ├┤ ├┬┘
      //  ─┴┘└─┘└  ┴ ┴└─┘┴─┘┴   ╩ ╩╩╚═╝╚═╝╚═╝╩═╝╩═╝╩ ╩╝╚╝╚═╝╚═╝╚═╝╚═╝  └─┘┴ └─┴ ┴   ┴ ┴┴ ┴┘└┘─┴┘┴─┘└─┘┴└─
      // Default behavior for miscellaneous exits
      else {
        console.log(chalk.cyan('Something went wrong:'));
        console.error(output.stack ? chalk.gray(output.stack) : output);

        //--•
        // We SHOULD just be able to let the process exit naturally.
        // But just in case there are any lingering event listeners,
        // etc, we'll manually exit with a status code of 0.
        return process.exit(0);

      }//</else :: the machine called some other miscellaneous exit>

    };//</defined default callback for this exit>

  });//</each exit>




  //  ███╗   ███╗ ██████╗ ███╗   ██╗██╗  ██╗███████╗██╗   ██╗     ██████╗  █████╗ ████████╗ ██████╗██╗  ██╗
  //  ████╗ ████║██╔═══██╗████╗  ██║██║ ██╔╝██╔════╝╚██╗ ██╔╝     ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██║  ██║
  //  ██╔████╔██║██║   ██║██╔██╗ ██║█████╔╝ █████╗   ╚████╔╝█████╗██████╔╝███████║   ██║   ██║     ███████║
  //  ██║╚██╔╝██║██║   ██║██║╚██╗██║██╔═██╗ ██╔══╝    ╚██╔╝ ╚════╝██╔═══╝ ██╔══██║   ██║   ██║     ██╔══██║
  //  ██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██║  ██╗███████╗   ██║        ██║     ██║  ██║   ██║   ╚██████╗██║  ██║
  //  ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝   ╚═╝        ╚═╝     ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝
  //
  //   ██╗███████╗ ██████╗ ██████╗     ███████╗ █████╗ ██╗██╗     ███████╗
  //  ██╔╝██╔════╝██╔═══██╗██╔══██╗    ██╔════╝██╔══██╗██║██║     ██╔════╝
  //  ██║ █████╗  ██║   ██║██████╔╝    ███████╗███████║██║██║     ███████╗
  //  ██║ ██╔══╝  ██║   ██║██╔══██╗    ╚════██║██╔══██║██║██║     ╚════██║
  //  ╚██╗██║     ╚██████╔╝██║  ██║    ███████║██║  ██║██║███████╗███████║
  //   ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝
  //
  //      ██╗     ██╗███████╗███████╗ ██████╗██╗   ██╗ ██████╗██╗     ███████╗██╗
  //      ██║     ██║██╔════╝██╔════╝██╔════╝╚██╗ ██╔╝██╔════╝██║     ██╔════╝╚██╗
  //      ██║     ██║█████╗  █████╗  ██║      ╚████╔╝ ██║     ██║     █████╗   ██║
  //      ██║     ██║██╔══╝  ██╔══╝  ██║       ╚██╔╝  ██║     ██║     ██╔══╝   ██║
  //      ███████╗██║██║     ███████╗╚██████╗   ██║   ╚██████╗███████╗███████╗██╔╝
  //      ╚══════╝╚═╝╚═╝     ╚══════╝ ╚═════╝   ╚═╝    ╚═════╝╚══════╝╚══════╝╚═╝
  //
  //
  //  ╔═╗╦  ╦╔═╗╦═╗╦═╗╦╔╦╗╔═╗   ╔═╗═╗ ╦╔═╗╔═╗
  //  ║ ║╚╗╔╝║╣ ╠╦╝╠╦╝║ ║║║╣    ║╣ ╔╩╦╝║╣ ║
  //  ╚═╝ ╚╝ ╚═╝╩╚═╩╚═╩═╩╝╚═╝  o╚═╝╩ ╚═╚═╝╚═╝
  //  ┌─    ┌─┐┬─┐┌─┐┌┬┐  ┌┬┐┬ ┬┌─┐  ┌┬┐┌─┐┌─┐┬ ┬┬┌┐┌┌─┐  ┬─┐┬ ┬┌┐┌┌┐┌┌─┐┬─┐    ─┐
  //  │───  ├┤ ├┬┘│ ││││   │ ├─┤├┤   │││├─┤│  ├─┤││││├┤   ├┬┘│ │││││││├┤ ├┬┘  ───│
  //  └─    └  ┴└─└─┘┴ ┴   ┴ ┴ ┴└─┘  ┴ ┴┴ ┴└─┘┴ ┴┴┘└┘└─┘  ┴└─└─┘┘└┘┘└┘└─┘┴└─    ─┘
  //
  // Now intercept `.exec()` to take care of sails.lower(), if relevant.
  // (we have to do this because any of the callbacks above _could_ be overridden!)
  var _originalExecBeforeItWasChangedForUseByMachineAsScript = liveMachine.exec;
  liveMachine.exec = function (argumentPassedToExec) {

    // Do some setup (maybe)
    (function _doSetupMaybe (done){

      // If we're not managing a Sails app instance for this script, then just proceed.
      if (_.isUndefined(habitatVarsToSet.sails)) {
        return done();
      }

      // --•
      // Otherwise, we need to load Sails first.
      //  ┬  ┌─┐┌─┐┌┬┐  ┌─┐┌─┐┬┬  ┌─┐
      //  │  │ │├─┤ ││  └─┐├─┤││  └─┐
      //  ┴─┘└─┘┴ ┴─┴┘  └─┘┴ ┴┴┴─┘└─┘
      // Load the Sails app.
      habitatVarsToSet.sails.load(function (err){
        if (err) {
          return done(new Error('This script relies on access to Sails, but when attempting to load this Sails app automatically, an error occurred.  Details: '+err.stack));
        }

        // --•
        return done();
      });//</after sails.load()>
    })(function afterMaybeDoingSetup(setupErr) {
      // If a setup error occurred, crash the process!
      // (better to terminate the process than run the script with faulty expectations)
      if (setupErr) {
        throw setupErr;
      }

      //  ┬─┐┬ ┬┌┐┌  ┬ ┬┌┐┌┌┬┐┌─┐┬─┐┬ ┬ ┬┬┌┐┌┌─┐   ╔═╗═╗ ╦╔═╗╔═╗
      //  ├┬┘│ ││││  │ ││││ ││├┤ ├┬┘│ └┬┘│││││ ┬   ║╣ ╔╩╦╝║╣ ║
      //  ┴└─└─┘┘└┘  └─┘┘└┘─┴┘└─┘┴└─┴─┘┴ ┴┘└┘└─┘  o╚═╝╩ ╚═╚═╝╚═╝
      // Run underlying .exec(), but intercept it.
      _originalExecBeforeItWasChangedForUseByMachineAsScript.apply(liveMachine, [function (sbErr, successResult){

        // Now we'll do teardown (maybe)
        (function _doTeardownMaybe (done){

          // If we're not managing a Sails app instance for this script, then just proceed.
          if (_.isUndefined(habitatVarsToSet.sails)) {
            return done();
          }

          // --•
          // Otherwise, we need to try to lower Sails now.
          //
          //  ┬  ┌─┐┬ ┬┌─┐┬─┐  ┌─┐┌─┐┬┬  ┌─┐
          //  │  │ ││││├┤ ├┬┘  └─┐├─┤││  └─┐
          //  ┴─┘└─┘└┴┘└─┘┴└─  └─┘┴ ┴┴┴─┘└─┘
          habitatVarsToSet.sails.lower(function (sailsLowerErr) {
            if (sailsLowerErr) {
              console.warn('This script relies on access to Sails, but when attempting to lower this Sails app automatically after running the script, an error occurred.  Details:',sailsLowerErr.stack);
              console.warn('Continuing to run the appropriate exit callback anyway...');
            }

            return done();
          });//</after sails.lower()>
        })(function afterMaybeDoingTeardown(unused) {
          if (unused) { throw new Error('Consistency violation: There should never be a teardown error!  But got:'+unused.stack); }

          // If the success exit was triggered, then...
          if (!sbErr) {

            // Determine the appropriate callback to call, and then call it.
            if (_.isFunction(argumentPassedToExec)) {
              argumentPassedToExec(undefined, successResult);
            }
            else if (_.isObject(argumentPassedToExec)) {
              if (argumentPassedToExec.success) { argumentPassedToExec.success(successResult); }
              else { callbacks.success(successResult); }
            }
            else { callbacks.success(successResult); }

          }
          // Otherwise, some other exit (e.g. `foo` or `error`) was triggered, so...
          else {

            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // If the catchall `error` exit was triggered, then we want the process to exit with an
            // exit code of 1.  But unfortunately, in some versions of Node (definitely in v4.3.0 anyway)
            // it seems that setting `process.exitCode = 1` doesn't actually work.  Now, IF IT DID work,
            // it would allow us to set the exit code here, but not actually have it take effect until the
            // process actually exits-- kind of like `res.status()` in Sails/Express.  The nice thing about
            // that would be that we could set it here, but still allow userland to override this behavior
            // by providing an `error` callback when calling `.exec()` (i.e. having it set `process.exitCode = 0`
            // or  call `process.exit(0)`).
            //
            // But obviously we can't do that.  So instead, we get as close as we can:
            //
            // Unless userland passes in an `error` callback to `.exec()` (or just passes in a conventional
            // Node callback function), then nothing special will happen as far as exit code.
            //
            // On the other hand, _if there is no custom catchall `error` handling logic provided_, then the
            // default error callback within `machine-as-script` will call `process.exit(1)`.
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

            // `outputToUse` will be passed to the callback if a non-catchall callback is in use.
            var outputToUse = _.isUndefined(sbErr.output) ? sbErr : sbErr.output;

            // Determine the appropriate callback to call, and then call it.
            if (_.isFunction(argumentPassedToExec)) {
              argumentPassedToExec(sbErr);
            }
            else if (_.isObject(argumentPassedToExec) && _.contains(_.keys(argumentPassedToExec), sbErr.exit)) {
              argumentPassedToExec[sbErr.exit](outputToUse);
            }
            else if (_.contains(_.keys(callbacks), sbErr.exit)) {
              callbacks[sbErr.exit](outputToUse);
            }
            else if (_.isObject(argumentPassedToExec) && _.contains(_.keys(argumentPassedToExec), 'error')) {
              argumentPassedToExec.error(sbErr);
            }
            else { callbacks.error(sbErr); }

          }//</else :: an exit other than `success` was triggered>

          // >-
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // At this point, the exit callback has run.
          // It probably won't have asynchronous stuff in it, so it may be
          // completely done.  Or it might have other stuff to do still.
          //
          // But the important thing is that, when it is finished, the process will
          // exit naturally (unless there are any unintentional hanging callbacks in
          // the machine-- or e.g. if the machine started a TCP server).
          //
          // For more background, see:
          // https://nodejs.org/api/process.html#process_process_exit_code
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


          // The following spinlock protects against the machine calling more than one
          // exit, or the same exit twice.
          var exitCodeNameToTrack = (function _getExitCodeNameToTrack (){
            if (!sbErr) { return 'success'; }
            else if (sbErr.exit) { return sbErr.exit; }
            else { return 'error'; }
          })();//</self-calling function :: _getExitCodeNameToTrack()>

          if (exitAttempts.length > 0) {
            console.warn('Consistency violation: When running this script, the underlying implementation called its exits '+
            'more than once!  A script should _always_ call exactly one exit.  This particular unexpected extra termination '+
            'of the script process was attempted via the `'+exitCodeNameToTrack+'` exit.  It was ignored.  For debugging purposes, '+
            'here is a list of all exit attempts made by this script:',exitAttempts);
            return;
          }

          exitAttempts.push(exitCodeNameToTrack);


        });//</running self-calling function :: _doTeardownMaybe()>
      }]);//</calling underlying .exec() -- i.e. running the machine `fn`>
    });//</running self-calling function :: _doSetupMaybe()>
  };//</definition of our .exec() override>



  //     ███████╗███████╗████████╗███████╗███╗   ██╗██╗   ██╗     ██╗██╗
  //     ██╔════╝██╔════╝╚══██╔══╝██╔════╝████╗  ██║██║   ██║    ██╔╝╚██╗
  //     ███████╗█████╗     ██║   █████╗  ██╔██╗ ██║██║   ██║    ██║  ██║
  //     ╚════██║██╔══╝     ██║   ██╔══╝  ██║╚██╗██║╚██╗ ██╔╝    ██║  ██║
  //  ██╗███████║███████╗   ██║   ███████╗██║ ╚████║ ╚████╔╝     ╚██╗██╔╝
  //  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝  ╚═══╝       ╚═╝╚═╝
  //
  //  ┌─┐┬─┐┌─┐┬  ┬┬┌┬┐┌─┐  ╔═╗╔╗╔╦  ╦  ┌┬┐┌─┐  ┌┬┐┌─┐┌─┐┬ ┬┬┌┐┌┌─┐  ┌─┐┌┐┌
  //  ├─┘├┬┘│ │└┐┌┘│ ││├┤   ║╣ ║║║╚╗╔╝   │ │ │  │││├─┤│  ├─┤││││├┤   ├┤ │││
  //  ┴  ┴└─└─┘ └┘ ┴─┴┘└─┘  ╚═╝╝╚╝ ╚╝    ┴ └─┘  ┴ ┴┴ ┴└─┘┴ ┴┴┘└┘└─┘  └  ┘└┘
  //
  // Now provide `env`.
  //
  // This allows us to provide access to special "habitat variables" for
  // this particular machine runtime (i.e. `machine-as-script`), as well
  // as any other scope specific to the machine's habitat.
  //
  // For example, if this machine declares the "sails" habitat, then we
  // must be managing a Sails app instance for this script.  So we pass
  // through that Sails app instance as `env.sails`.
  //
  // Similarly, since `machine-as-script` parses serial command-line
  // arguments, it _always_ provides ``env.serialCommandLineArgs`.
  // > Note: If there are no serial command-line arguments, then
  // > `env.serialCommandLineArgs` is an empty array).
  //
  // Finally, also note that we set `stack` to `false`.
  // > This communicates to the machine runner that it should not auto-generate
  // > a stack trace for when `.exec()` is called on this machine.
  habitatVarsToSet.stack = false;
  liveMachine.setEnv(habitatVarsToSet);





  //  ██████╗ ███████╗████████╗██╗   ██╗██████╗ ███╗   ██╗
  //  ██╔══██╗██╔════╝╚══██╔══╝██║   ██║██╔══██╗████╗  ██║
  //  ██████╔╝█████╗     ██║   ██║   ██║██████╔╝██╔██╗ ██║
  //  ██╔══██╗██╔══╝     ██║   ██║   ██║██╔══██╗██║╚██╗██║
  //  ██║  ██║███████╗   ██║   ╚██████╔╝██║  ██║██║ ╚████║
  //  ╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝
  //
  //  ┬  ┬┬  ┬┌─┐  ╔╦╗╔═╗╔═╗╦ ╦╦╔╗╔╔═╗  ╦╔╗╔╔═╗╔╦╗╔═╗╔╗╔╔═╗╔═╗
  //  │  │└┐┌┘├┤   ║║║╠═╣║  ╠═╣║║║║║╣   ║║║║╚═╗ ║ ╠═╣║║║║  ║╣
  //  ┴─┘┴ └┘ └─┘  ╩ ╩╩ ╩╚═╝╩ ╩╩╝╚╝╚═╝  ╩╝╚╝╚═╝ ╩ ╩ ╩╝╚╝╚═╝╚═╝
  //  ┌─    ┬ ┬┬┌┬┐┬ ┬  ┌─┐┌─┐┌─┐┌─┐┬┌─┐┬       ╔╦╗╔═╗╦  ╦ ╔╦╗╔═╗╦  ╔═╗  ┌─┐┬─┐┌─┐┌─┐    ─┐
  //  │───  ││││ │ ├─┤  └─┐├─┘├┤ │  │├─┤│        ║ ║╣ ║  ║  ║ ╠═╣║  ║╣   ├─┘├┬┘│ │├─┘  ───│
  //  └─    └┴┘┴ ┴ ┴ ┴  └─┘┴  └─┘└─┘┴┴ ┴┴─┘  ────╩ ╚═╝╩═╝╩═╝╩ ╩ ╩╩═╝╚═╝  ┴  ┴└─└─┘┴      ─┘


  // Set a telltale property to allow `bin/machine-as-script` to be more
  // intelligent about catching wet machine instances which are already wrapped
  // in a call to machine-as-script.  Realistically, this rarely matters since
  // script modules don't normally export anything, but it's here just in case.
  liveMachine._telltale = 'machine-as-script';

  // Return the ready-to-exec machine.
  return liveMachine;

};
