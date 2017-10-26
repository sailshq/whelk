/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var chalk = require('chalk');
var program = require('commander');
var flaverr = require('flaverr');
var Machine = require('machine');
var rttc = require('rttc');
var yargs = require('yargs');



/**
 * whelk()
 *
 * Run a JavaScript function as a shell script.
 *
 * (See README.md for more information.)
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param  {Dictionary|Machine} optsOrMachineDef
 *         @property {Dictionary?} machine
 *         @property {Array?} args
 *         @property {Array?} envVarNamespace
 *         @property {SailsApp?} sails
 *
 * @return {Deferred}
 *         A parley Deferred, ready to execute.  Accepts argins from
 *         serial command-line args, system environment vars, and
 *         command-line opts; and with pre-configured default exit
 *         handler callbacks that, unless overridden, write output
 *         to stdout or stderr.
 */
module.exports = function whelk(optsOrMachineDef){


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
    throw flaverr({
      name: 'ImplementationError',
      message: 'Invalid script: Definition must be provided as a dictionary (i.e. plain JavaScript object, like `{}`).'
    });
  }//•

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
          throw flaverr({
            name: 'ImplementationError',
            message: 'Invalid script: If specified, `args` should be provided as an array of strings.'
          });
        }//•

        _.each(opts.args, function (targetInputCodeName){

          // Check that target input definition exists.
          var targetInputDef = _.keys(machineDef.inputs||{});
          if (!targetInputDef) {
            throw flaverr({
              name: 'ImplementationError',
              message: 'Invalid script: `args` references an unrecognized input (`'+targetInputCodeName+'`).  Each item in `args` should be the code name of a declared key in `inputs`.'
            });
          }

          // (TODO: make this tolerant of `type`)
          // Check that target input definition does not explicitly expect a dictionary, array, or function.
          if (targetInputDef.example === '->' || _.isObject(targetInputDef.example)) {
            throw flaverr({
              name: 'ImplementationError',
              message: 'Invalid script: `args` references an input (`'+targetInputCodeName+'`) which is _never_ compatible with data from serial command-line arguments.'
            });
          }
        });//</_.each() :: target input code name in the `opts.args` array>


      })(); break;


      case 'envVarNamespace': (function (){
        if (!_.isString(opts.envVarNamespace)) {
          throw flaverr({
            name: 'ImplementationError',
            message: 'Invalid script: If specified, `envVarNamespace` should be provided as a string.'
          });
        }
      })(); break;


      case 'sails': (function (){
        if (!_.isObject(opts.sails) || opts.sails.constructor.name !== 'Sails') {
          throw flaverr({
            name: 'ImplementationError',
            message: 'Invalid script: The supposed Sails app instance provided as `sails` seems a little sketchy.  Make sure you are doing `sails: require(\'sails\')`.'
          });
        }
        // Note that we do additional validations below.
        // (bcause at this point in the code, we can't yet guarantee the machine's `habitat` will be correct--
        //  at least not across all versions of the `machine` runner)
      })(); break;


      default:
        throw new Error('Consistency violation: Internal bug in whelk.  An option (`'+optKey+'`) is unrecognized, but we should never have unrecognized opts at this point.');
    }

  });


  //  ┌─┐┌─┐┌┬┐  ╔╦╗╔═╗╔═╗╔═╗╦ ╦╦ ╔╦╗╔═╗  ┌─┐┌─┐┬─┐  ┌─┐┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
  //  └─┐├┤  │    ║║║╣ ╠╣ ╠═╣║ ║║  ║ ╚═╗  ├┤ │ │├┬┘  │ │├─┘ │ ││ ││││└─┐
  //  └─┘└─┘ ┴   ═╩╝╚═╝╚  ╩ ╩╚═╝╩═╝╩ ╚═╝  └  └─┘┴└─  └─┘┴   ┴ ┴└─┘┘└┘└─┘
  // Set up namespace for system environment variables that will be automatically parsed as argins.
  var envVarNamespace = '___';
  if (_.isString(opts.envVarNamespace)) {
    envVarNamespace = opts.envVarNamespace;
  }



  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // TODO: wait 1 tick to allow stuff like `.intercept()` and `.tolerate()` to be chained on,
  // then auto-execute the machine.
  //
  // Note that `await`, `.exec()`, `.then()`, `.log()`, etc should NOT be used!
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


  // We'll use this local variable (`habitatVarsToSet`) build up the metadata dictionary
  // we'll pass in to the machine runner below via `.meta()`.
  //
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
  // > FUTURE: consider moving this check into machine runner
  var wetMachine;
  if (machineDef.isWetMachine || machineDef.name==='_callableMachineWrapper') {
    wetMachine = machineDef;
  }
  else {
    var scriptIdentity =  machineDef.identity || (machineDef.friendlyName ? _.kebabCase(machineDef.friendlyName) : 'script');
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
        exits.error(new Error('This script (`'+scriptIdentity+'`) is not implemented yet! (Ran stub `fn` injected by `whelk`.)'));
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
  // provide access to `this.sails`, we need to make sure a valid Sails app was
  // passed in.
  if (wetMachine.getDef().habitat === 'request') {
    throw new Error('The target machine defintion declares a dependency on the `request` habitat, which cannot be provided via the command-line interface.  This machine cannot be run using whelk.');
  }
  // If the machine depends on the Sails habitat:
  else if (wetMachine.getDef().habitat === 'sails') {

    // ...then we'll want to attempt to use the provided version of `sails` (a SailsApp instance.)
    // If no `sails` was provided to whelk, then we'll throw an error.
    if (!opts.sails) {
      throw new Error('The target machine defintion declares a dependency on the `sails` habitat, but no `sails` app instance was provided as a top-level option to whelk.  Make sure this script module is doing: `sails: require(\'sails\')`');
    }

    // Down below, we'll attempt to load (but not lift) the Sails app in the current working directory.
    // If it works, then we'll run the script, providing it with `this.sails`.  After that, regardless of
    // how the script exits, we'll call `sails.lower()` to clean up.
    //
    // In the mean time, we'll go ahead and save a reference to this Sails app on `habitatVarsToSet`, since we'll
    // be passing it into the machine instance's `fn` as `this.sails` (via `.setEnv()`)
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
  _.each(wetMachine.getDef().inputs, function (inputDef, inputCodeName) {

    // Handle `--` flags
    var opt = '--'+inputCodeName;

    // Handle `-` shortcuts
    var optShortcut = (function (){
      var _shortcut = '-'+inputCodeName[0];
      // If shortcut flag already exists using the same letter, don't provide a shortcut for this option.
      if (_.contains(shortcutsSoFar, _shortcut)) { return; }
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
  // If we wanted to, we'd have to have something like the following:
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
  //  ┌┬┐┌─┐  ┌─┐┌─┐┌┬┐  ┌─┐  ╔╦╗╔═╗╔═╗╔═╗╦═╗╦═╗╔═╗╔╦╗
  //   │ │ │  │ ┬├┤  │   ├─┤   ║║║╣ ╠╣ ║╣ ╠╦╝╠╦╝║╣  ║║
  //   ┴ └─┘  └─┘└─┘ ┴   ┴ ┴  ═╩╝╚═╝╚  ╚═╝╩╚═╩╚═╚═╝═╩╝o

  // Build runtime input values from serial command-line arguments, system environment variables,
  // and command-line options.
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
      throw new Error('Consistency violation: Somehow, the value for `'+inputCodeName+'` that yargs parsed from command-line opts is unusable: ' + util.inspect(supposedArgin, {depth: null}));
    }

    return memo;
  }, argins);

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: Make the following usage work in the way you would expect:
  // ```
  // kit exclaim --verbose 'my sweet code comment' wat --width '37'
  // ```
  // Currently, `'my sweet code comment'` is parsed as "verbose",
  // even though "verbose" should really be a boolean, and so that
  // string should be interpreted as a serial command-line arg (not an opt).
  //
  // (see https://github.com/yargs/yargs#booleankey for more info)
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE:
  // Consider something like the following:
  // ```
  // // Check that we didn't receive any command-line opts that don't correspond with any recognized input.
  // _.each(argins, function (supposedArgin, inputCodeName) {
  //   var inputDef = wetMachine.getDef().inputs[inputCodeName];
  //   if (!inputDef) {
  //     throw new Error('Unrecognized option (`--'+inputCodeName+'`)');
  //   }
  // });//</_.each() :: argin so far; i.e. each command-line opt>
  // ```
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


  //  ┌─┐┌─┐┬─┐┌─┐┌─┐  ╔═╗╦ ╦╔═╗╔╦╗╔═╗╔╦╗  ╔═╗╔╗╔╦  ╦╦╦═╗╔═╗╔╗╔╔╦╗╔═╗╔╗╔╔╦╗  ╦  ╦╔═╗╦═╗╔═╗
  //  ├─┘├─┤├┬┘└─┐├┤   ╚═╗╚╦╝╚═╗ ║ ║╣ ║║║  ║╣ ║║║╚╗╔╝║╠╦╝║ ║║║║║║║║╣ ║║║ ║   ╚╗╔╝╠═╣╠╦╝╚═╗
  //  ┴  ┴ ┴┴└─└─┘└─┘  ╚═╝ ╩ ╚═╝ ╩ ╚═╝╩ ╩  ╚═╝╝╚╝ ╚╝ ╩╩╚═╚═╝╝╚╝╩ ╩╚═╝╝╚╝ ╩    ╚╝ ╩ ╩╩╚═╚═╝
  // Supply environment variables
  // =======================================================================================
  _.each(wetMachine.getDef().inputs, function (inputDef, inputCodeName){
    var envVarData = process.env[envVarNamespace + inputCodeName];
    if (_.isUndefined(envVarData)) {
      return;
    }
    // If system environment var exists, but it's not a string, freak out.
    // (this should never happen)
    else if (!_.isString(envVarData)) {
      throw new Error('Consistency violation: `process.env[\''+envVarNamespace + inputCodeName+'\']` was not undefined, but also not a string!  This should never happen.  But it did, I guess.  Has `process.env` been tinkered with in some way?  Here\'s the value, for reference: `'+util.inspect(envVarData,{depth:5})+'`');
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


  // Set ourselves up to expose `this.serialCommandLineArgs` in just a bit.
  habitatVarsToSet.serialCommandLineArgs = rawSerialCommandLineArgs;
  // (^^ Note that we always supply `this.serialCommandLineArgs`, and that they're unaffected
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
    var inputDef = wetMachine.getDef().inputs[inputCodeName];
    if (!inputDef) {
      throw new Error('Consistency violation: Received argin for unrecognized input ('+inputCodeName+').  But that should never happen!');
    }

    // Now use `rttc.parseHuman()` to interpret the incoming data.
    //
    // (Note that, if the expected type is "json" or "ref", we check for JSON-parse-ability
    // ahead of time to help make for a better error message.  We _must_ still actually
    // parse the value as JSON, because otherwise there'd be no way to differentiate between
    // strings like `"foo"` vs. `foo`.)
    if (inputDef.type === 'ref' || inputDef.type === 'json') {
      try { JSON.parse(val); }
      catch (err) {
        throw new Error(
          'Expected `'+inputCodeName+'` to be JSON-encoded, but the provided '+
          'value could not be parsed as JSON.\n'+
          'Tip: If you need to specify a string, wrap it in an extra pair of double-quotes.\n'+
          'For example: --foo=\'"bar"\'\n'+
          '(Or otherwise, if it makes more sense, define this input with `type: \'string\'` instead.)\n'+
          ' [?] Visit https://sailsjs.com/support for further assistance.'
        );
      }
    }

    try {
      memo[inputCodeName] = rttc.parseHuman(val, inputDef.type);
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
  var deferred = wetMachine(argins);


  // console.log('----------------------------------------------------------------------');
  // console.log('serial command-line args: ',habitatVarsToSet.serialCommandLineArgs);
  // console.log('input configuration that was parsed: ',argins);
  // console.log('----------------------------------------------------------------------');



  if (deferred.meta){
    deferred = deferred.meta(habitatVarsToSet);
  }
  else {
    throw new Error(
      'The provided pre-built ("wet") machine does not support `.meta()`,\n'+
      'presumably because it was built with an older version of the machine runner.\n'+
      'Please try "dehydrating" the machine by entering its `inputs`, `exits`, `fn`,\n'+
      'etc. manually.\n'+
      '\n'+
      '(If you happen to be the author of the source package, then please upgrade\n'+
      'your pack to the latest version of the machine runner.)\n'+
      ' [?] For assistance, visit https://sailsjs.com/support.'
    );
  }//>-•




  // Do some setup (maybe)
  (function (proceed){

    // If we're not managing a Sails app instance for this script, then just proceed.
    if (undefined === habitatVarsToSet.sails) {
      return proceed();
    }

    // --•
    // Otherwise, we need to load Sails first.
    //  ┬  ┌─┐┌─┐┌┬┐  ┌─┐┌─┐┬┬  ┌─┐
    //  │  │ │├─┤ ││  └─┐├─┤││  └─┐
    //  ┴─┘└─┘┴ ┴─┴┘  └─┘┴ ┴┴┴─┘└─┘
    // Load the Sails app.
    //
    // > Note that we mix in env vars, CLI opts, and the .sailsrc file using
    // > the `.getRc()` method, if possible.
    var configOverrides = {};
    if (undefined !== habitatVarsToSet.sails.getRc) {
      try {
        configOverrides = habitatVarsToSet.sails.getRc();
      } catch (err) { return proceed(err); }
    }//>-

    habitatVarsToSet.sails.load(configOverrides, function (err){
      if (err) {
        return proceed(err);
      }

      return proceed();
    });//</after sails.load()>
  })(function (err) {
    // If a setup error occurred, crash the process!
    // (better to terminate the process than run the script with faulty expectations)
    if (err) {
      throw flaverr.wrap({
        message: 'Something went wrong when trying to load this Sails app. '+err.message
      }, err);
    }//•

    //  ┬─┐┬ ┬┌┐┌  ┬ ┬┌┐┌┌┬┐┌─┐┬─┐┬ ┬ ┬┬┌┐┌┌─┐   ╔═╗═╗ ╦╔═╗╔═╗
    //  ├┬┘│ ││││  │ ││││ ││├┤ ├┬┘│ └┬┘│││││ ┬   ║╣ ╔╩╦╝║╣ ║
    //  ┴└─└─┘┘└┘  └─┘┘└┘─┴┘└─┘┴└─┴─┘┴ ┴┘└┘└─┘  o╚═╝╩ ╚═╚═╝╚═╝
    // Run underlying .exec().
    deferred.exec(function(err, result){

      // (We handle this error below.)

      // But first, we'll do teardown (maybe)
      (function _doTeardownMaybe (proceed){

        // If we're not managing a Sails app instance for this script, then just proceed.
        if (_.isUndefined(habitatVarsToSet.sails)) {
          return proceed();
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
          }//ﬁ

          return proceed();
        });//_∏_
      })(function afterMaybeDoingTeardown() {
        // Error is not possible here^^^^^
        // (notice that we used a warning instead, above)


        // Finally, now that everything's all cleaned up,
        // we can handle the outcome from executing the underlying
        // machine itself.
        if (err) {
          process.stderr.write(err);
          // TODO: Prettify
          return process.exit(1);
        }//•

        if (result !== undefined) {
          // TODO: Prettify
          process.stdout.write(result);
        }//ﬁ

        // If the process has not already been explicitly terminated
        // by throwing an uncaught fatal error above, then we SHOULD
        // just be able to let it exit naturally.  But just in case
        // there are any lingering event listeners, etc, we'll manually
        // exit with a status code of 0.
        return process.exit(0);

      });//_∏_  </ † >

    });//_∏_  </ .exec() >

  });//_∏_  </ † >

  // //  ██████╗ ██╗   ██╗██╗██╗     ██████╗
  // //  ██╔══██╗██║   ██║██║██║     ██╔══██╗
  // //  ██████╔╝██║   ██║██║██║     ██║  ██║
  // //  ██╔══██╗██║   ██║██║██║     ██║  ██║
  // //  ██████╔╝╚██████╔╝██║███████╗██████╔╝
  // //  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝
  // //
  // //   ██████╗ █████╗ ██╗     ██╗     ██████╗  █████╗  ██████╗██╗  ██╗███████╗
  // //  ██╔════╝██╔══██╗██║     ██║     ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝
  // //  ██║     ███████║██║     ██║     ██████╔╝███████║██║     █████╔╝ ███████╗
  // //  ██║     ██╔══██║██║     ██║     ██╔══██╗██╔══██║██║     ██╔═██╗ ╚════██║
  // //  ╚██████╗██║  ██║███████╗███████╗██████╔╝██║  ██║╚██████╗██║  ██╗███████║
  // //   ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝
  // //
  // // Now build up a default handler callback for each exit.
  // var callbacks = {};

  // // We use a local variable (`exitAttempts`) as a spinlock.
  // // (it tracks the code names of _which_ exit(s) were already triggered)
  // var exitAttempts = [];

  // _.each(_.keys(wetMachine.exits), function builtExitCallback(exitCodeName){

  //   // Build a callback for this exit that appropriately terminates the process for this script.
  //   callbacks[exitCodeName] = function terminateApropos(output){

  //     //  ┌┬┐┌─┐┌─┐┌─┐┬ ┬┬ ┌┬┐  ╔═╗╦═╗╦═╗╔═╗╦═╗  ┬ ┬┌─┐┌┐┌┌┬┐┬  ┌─┐┬─┐
  //     //   ││├┤ ├┤ ├─┤│ ││  │   ║╣ ╠╦╝╠╦╝║ ║╠╦╝  ├─┤├─┤│││ │││  ├┤ ├┬┘
  //     //  ─┴┘└─┘└  ┴ ┴└─┘┴─┘┴   ╚═╝╩╚═╩╚═╚═╝╩╚═  ┴ ┴┴ ┴┘└┘─┴┘┴─┘└─┘┴└─
  //     // Default catchall `error` behavior
  //     // (machine either called `exits.error()` on purpose, or it ran into an unhandled internal error,
  //     //  or the argins failed to validate, or it timed out, etc.)
  //     if (exitCodeName === 'error') {

  //       // Since this is the error exit, we know that the output ALWAYS exists, and is ALWAYS an Error instance.
  //       var err = output;

  //       // Build base failure msg (used below)
  //       var baseFailureMsg = 'Could not ';
  //       if (machineDef.description) {
  //         baseFailureMsg += machineDef.description[0].toLowerCase() + machineDef.description.slice(1);
  //       }
  //       else {
  //         baseFailureMsg += 'run script.';
  //       }


  //       // Check what kind of catchall `error` this is.
  //       var isValidationError = err.code === 'E_MACHINE_RUNTIME_VALIDATION' && err.traceRef === wetMachine;
  //       var isTimeoutError = err.name === 'TimeoutError';// TODO: add check like `&& err.traceRef === wetMachine;`

  //       // If it's clear from the output that this is a runtime validation error _from
  //       // this specific machine_ (and not from any machines it might call internally
  //       // in its `fn`), show specialized output.
  //       if (isValidationError) {
  //         // Sanity check:
  //         if (!_.isArray(output.errors)) { throw new Error('Consistency violation: E_MACHINE_RUNTIME_VALIDATION errors should _always_ have an `errors` array.'); }

  //         // console.error();
  //         // console.error(chalk.bold.dim('• • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • '));
  //         // console.error(chalk.bold.bgRed(baseFailureMsg));
  //         // console.error(chalk.bold.red(baseFailureMsg));
  //         // console.error(chalk.bold(baseFailureMsg));
  //         console.error(baseFailureMsg);
  //         // console.error();
  //         console.error(output.errors.length+' arg'+(output.errors.length>1?'s':'')+'/opt'+(output.errors.length>1?'s':'')+' '+(output.errors.length>1?'are':'is')+' missing or invalid:');
  //         var prettyPrintedValidationErrorsStr = _.map(output.errors, function (rttcValidationErr){ return '  • '+rttcValidationErr.message; }).join('\n');
  //         console.error(prettyPrintedValidationErrorsStr);
  //         // console.error(chalk.bold.dim('• • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • '));
  //         console.error();

  //         return process.exit(1);
  //       }
  //       // Check to see if this is a timeout error.  If so, show more specialized output.
  //       // (note that this might have originated from other machines this script calls internally
  //       //  in its `fn` -- that's ok, the error is still meaningful.)
  //       //
  //       else if (isTimeoutError) {
  //         // TODO: do a machine
  //         // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  //         // > Note: Since this calls `process.exit(1)`, it means that `whelk` effectively
  //         // > honors the `timeout` property that can be specified at the top-level of a compact node
  //         // > machine definition.
  //         // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  //         // console.error(chalk.red.bold(baseFailureMsg));
  //         console.error(baseFailureMsg);
  //         console.error(chalk.reset('This is taking too long.'));
  //         console.error(chalk.gray('Should have finished in '+chalk.bold(machineDef.timeout+'ms')+' or less.'));
  //         console.error();
  //         return process.exit(1);
  //       }
  //       // Otherwise, this is some kind of unexpected error:
  //       else {
  //         var stackLines = err.stack.split('\n');
  //         // console.error(chalk.reset('Script encountered an unexpected error:'));
  //         // console.error(chalk.bgRed.bold('Script encountered an unexpected error.'));
  //         // console.error(chalk.red.bold('Script failed.'));
  //         // console.error();
  //         // console.error(chalk.reset('Script failed.'));
  //         console.error(baseFailureMsg);
  //         // console.error(chalk.reset('----------------------------------------------------------------------'));
  //         // console.error(chalk.reset('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - '));
  //         console.error(chalk.reset(stackLines[0]));
  //         console.error(chalk.dim(stackLines.slice(1).join('\n')));
  //         // console.error(chalk.reset('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - '));
  //         // console.error(chalk.reset('----------------------------------------------------------------------'));
  //         console.error();
  //         return process.exit(1);
  //       }
  //     }//</if :: the machine called `exits.error()` for whatever reason>
  //     // ‡
  //     //  ┌┬┐┌─┐┌─┐┌─┐┬ ┬┬ ┌┬┐  ╔═╗╦ ╦╔═╗╔═╗╔═╗╔═╗╔═╗  ┬ ┬┌─┐┌┐┌┌┬┐┬  ┌─┐┬─┐
  //     //   ││├┤ ├┤ ├─┤│ ││  │   ╚═╗║ ║║  ║  ║╣ ╚═╗╚═╗  ├─┤├─┤│││ │││  ├┤ ├┬┘
  //     //  ─┴┘└─┘└  ┴ ┴└─┘┴─┘┴   ╚═╝╚═╝╚═╝╚═╝╚═╝╚═╝╚═╝  ┴ ┴┴ ┴┘└┘─┴┘┴─┘└─┘┴└─
  //     // Default `success` behavior
  //     else if (exitCodeName === 'success') {

  //       // If no output was received, then simply call it a day.
  //       if (_.isUndefined(output)) {
  //         //--•
  //         // We SHOULD just be able to let the process exit naturally.
  //         // But just in case there are any lingering event listeners,
  //         // etc, we'll manually exit with a status code of 0.
  //         return process.exit(0);
  //       }
  //       // Otherwise, output was received.
  //       else {

  //         // Figure out if our exit was expecting any output.
  //         var wasOutputExpected =
  //           !_.isUndefined(deferred.exits.success.outputExample) ||
  //           !_.isUndefined(deferred.exits.success.example) ||
  //           _.isFunction(deferred.exits.success.getExample) ||
  //           !_.isUndefined(deferred.exits.success.like) ||
  //           !_.isUndefined(deferred.exits.success.itemOf);

  //         // If so, then log the output.
  //         if (wasOutputExpected) {
  //           try {
  //             // TODO: support json-encoded output vs colors
  //             console.log(util.inspect(output, {depth: null, colors: true}));
  //           } catch (e) {
  //             throw new Error('Consistency violation: Could not log provided output.  Details: '+util.inspect(e, {depth: null}));
  //           }
  //         }
  //         // Otherwise, output was not expected.
  //         // (So don't log anything.)
  //         else { }

  //         // If the process has not already been explicitly terminated
  //         // by throwing an uncaught fatal error above, then we SHOULD
  //         // just be able to let it exit naturally.  But just in case
  //         // there are any lingering event listeners, etc, we'll manually
  //         // exit with a status code of 0.
  //         return process.exit(0);

  //       }//</else :: output was received>

  //     }//</if :: the machine called `exits.success()`>
  //     // ‡
  //     //  ┌┬┐┌─┐┌─┐┌─┐┬ ┬┬ ┌┬┐  ╔╦╗╦╔═╗╔═╗╔═╗╦  ╦  ╔═╗╔╗╔╔═╗╔═╗╦ ╦╔═╗  ┌─┐─┐ ┬┬┌┬┐  ┬ ┬┌─┐┌┐┌┌┬┐┬  ┌─┐┬─┐
  //     //   ││├┤ ├┤ ├─┤│ ││  │   ║║║║╚═╗║  ║╣ ║  ║  ╠═╣║║║║╣ ║ ║║ ║╚═╗  ├┤ ┌┴┬┘│ │   ├─┤├─┤│││ │││  ├┤ ├┬┘
  //     //  ─┴┘└─┘└  ┴ ┴└─┘┴─┘┴   ╩ ╩╩╚═╝╚═╝╚═╝╩═╝╩═╝╩ ╩╝╚╝╚═╝╚═╝╚═╝╚═╝  └─┘┴ └─┴ ┴   ┴ ┴┴ ┴┘└┘─┴┘┴─┘└─┘┴└─
  //     // Default behavior for miscellaneous exits
  //     else {
  //       console.log(chalk.cyan('Something went wrong:'));
  //       console.error(output.stack ? chalk.gray(output.stack) : output);

  //       //--•
  //       // We SHOULD just be able to let the process exit naturally.
  //       // But just in case there are any lingering event listeners,
  //       // etc, we'll manually exit with a status code of 0.
  //       return process.exit(0);

  //     }//</else :: the machine called some other miscellaneous exit>

  //   };//</defined default callback for this exit>

  // });//</each exit>




  // //  ███╗   ███╗ ██████╗ ███╗   ██╗██╗  ██╗███████╗██╗   ██╗     ██████╗  █████╗ ████████╗ ██████╗██╗  ██╗
  // //  ████╗ ████║██╔═══██╗████╗  ██║██║ ██╔╝██╔════╝╚██╗ ██╔╝     ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██║  ██║
  // //  ██╔████╔██║██║   ██║██╔██╗ ██║█████╔╝ █████╗   ╚████╔╝█████╗██████╔╝███████║   ██║   ██║     ███████║
  // //  ██║╚██╔╝██║██║   ██║██║╚██╗██║██╔═██╗ ██╔══╝    ╚██╔╝ ╚════╝██╔═══╝ ██╔══██║   ██║   ██║     ██╔══██║
  // //  ██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██║  ██╗███████╗   ██║        ██║     ██║  ██║   ██║   ╚██████╗██║  ██║
  // //  ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝   ╚═╝        ╚═╝     ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝
  // //
  // //   ██╗███████╗ ██████╗ ██████╗     ███████╗ █████╗ ██╗██╗     ███████╗
  // //  ██╔╝██╔════╝██╔═══██╗██╔══██╗    ██╔════╝██╔══██╗██║██║     ██╔════╝
  // //  ██║ █████╗  ██║   ██║██████╔╝    ███████╗███████║██║██║     ███████╗
  // //  ██║ ██╔══╝  ██║   ██║██╔══██╗    ╚════██║██╔══██║██║██║     ╚════██║
  // //  ╚██╗██║     ╚██████╔╝██║  ██║    ███████║██║  ██║██║███████╗███████║
  // //   ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝
  // //
  // //      ██╗     ██╗███████╗███████╗ ██████╗██╗   ██╗ ██████╗██╗     ███████╗██╗
  // //      ██║     ██║██╔════╝██╔════╝██╔════╝╚██╗ ██╔╝██╔════╝██║     ██╔════╝╚██╗
  // //      ██║     ██║█████╗  █████╗  ██║      ╚████╔╝ ██║     ██║     █████╗   ██║
  // //      ██║     ██║██╔══╝  ██╔══╝  ██║       ╚██╔╝  ██║     ██║     ██╔══╝   ██║
  // //      ███████╗██║██║     ███████╗╚██████╗   ██║   ╚██████╗███████╗███████╗██╔╝
  // //      ╚══════╝╚═╝╚═╝     ╚══════╝ ╚═════╝   ╚═╝    ╚═════╝╚══════╝╚══════╝╚═╝
  // //
  // //
  // //  ╔═╗╦  ╦╔═╗╦═╗╦═╗╦╔╦╗╔═╗   ╔═╗═╗ ╦╔═╗╔═╗
  // //  ║ ║╚╗╔╝║╣ ╠╦╝╠╦╝║ ║║║╣    ║╣ ╔╩╦╝║╣ ║
  // //  ╚═╝ ╚╝ ╚═╝╩╚═╩╚═╩═╩╝╚═╝  o╚═╝╩ ╚═╚═╝╚═╝
  // //  ┌─    ┌─┐┬─┐┌─┐┌┬┐  ┌┬┐┬ ┬┌─┐  ┌┬┐┌─┐┌─┐┬ ┬┬┌┐┌┌─┐  ┬─┐┬ ┬┌┐┌┌┐┌┌─┐┬─┐    ─┐
  // //  │───  ├┤ ├┬┘│ ││││   │ ├─┤├┤   │││├─┤│  ├─┤││││├┤   ├┬┘│ │││││││├┤ ├┬┘  ───│
  // //  └─    └  ┴└─└─┘┴ ┴   ┴ ┴ ┴└─┘  ┴ ┴┴ ┴└─┘┴ ┴┴┘└┘└─┘  ┴└─└─┘┘└┘┘└┘└─┘┴└─    ─┘
  // //
  // // Now intercept `.exec()` to take care of sails.lower(), if relevant.
  // // (we have to do this because any of the callbacks above _could_ be overridden!)
  // var _originalExecBeforeItWasChangedForUseByMachinewhelk = deferred.exec;
  // deferred.exec = function (argumentPassedToExec) {

  //   // Do some setup (maybe)
  //   (function _doSetupMaybe (proceed){

  //     // If we're not managing a Sails app instance for this script, then just proceed.
  //     if (_.isUndefined(habitatVarsToSet.sails)) {
  //       return proceed();
  //     }

  //     // --•
  //     // Otherwise, we need to load Sails first.
  //     //  ┬  ┌─┐┌─┐┌┬┐  ┌─┐┌─┐┬┬  ┌─┐
  //     //  │  │ │├─┤ ││  └─┐├─┤││  └─┐
  //     //  ┴─┘└─┘┴ ┴─┴┘  └─┘┴ ┴┴┴─┘└─┘
  //     // Load the Sails app.
  //     //
  //     // > Note that we mix in env vars, CLI opts, and the .sailsrc file using
  //     // > the `.getRc()` method, if possible.
  //     var configOverrides = {};
  //     if (!_.isUndefined(habitatVarsToSet.sails.getRc)) {
  //       try {
  //         configOverrides = habitatVarsToSet.sails.getRc();
  //       } catch (e) { return proceed(e); }
  //     }//>-

  //     habitatVarsToSet.sails.load(configOverrides, function (err){
  //       if (err) {
  //         return proceed(new Error('This script relies on access to Sails, but when attempting to load this Sails app automatically, an error occurred.  Details: '+err.stack));
  //       }

  //       // --•
  //       return proceed();
  //     });//</after sails.load()>
  //   })(function afterMaybeDoingSetup(setupErr) {
  //     // If a setup error occurred, crash the process!
  //     // (better to terminate the process than run the script with faulty expectations)
  //     if (setupErr) {
  //       console.error('Something went wrong when trying to load this Sails app:');
  //       throw setupErr;
  //     }

  //     //  ┬─┐┬ ┬┌┐┌  ┬ ┬┌┐┌┌┬┐┌─┐┬─┐┬ ┬ ┬┬┌┐┌┌─┐   ╔═╗═╗ ╦╔═╗╔═╗
  //     //  ├┬┘│ ││││  │ ││││ ││├┤ ├┬┘│ └┬┘│││││ ┬   ║╣ ╔╩╦╝║╣ ║
  //     //  ┴└─└─┘┘└┘  └─┘┘└┘─┴┘└─┘┴└─┴─┘┴ ┴┘└┘└─┘  o╚═╝╩ ╚═╚═╝╚═╝
  //     // Run underlying .exec(), but intercept it.
  //     _originalExecBeforeItWasChangedForUseByMachinewhelk.apply(deferred, [function (sbErr, successResult){

  //       // Now we'll do teardown (maybe)
  //       (function _doTeardownMaybe (done){

  //         // If we're not managing a Sails app instance for this script, then just proceed.
  //         if (_.isUndefined(habitatVarsToSet.sails)) {
  //           return done();
  //         }

  //         // --•
  //         // Otherwise, we need to try to lower Sails now.
  //         //
  //         //  ┬  ┌─┐┬ ┬┌─┐┬─┐  ┌─┐┌─┐┬┬  ┌─┐
  //         //  │  │ ││││├┤ ├┬┘  └─┐├─┤││  └─┐
  //         //  ┴─┘└─┘└┴┘└─┘┴└─  └─┘┴ ┴┴┴─┘└─┘
  //         habitatVarsToSet.sails.lower(function (sailsLowerErr) {
  //           if (sailsLowerErr) {
  //             console.warn('This script relies on access to Sails, but when attempting to lower this Sails app automatically after running the script, an error occurred.  Details:',sailsLowerErr.stack);
  //             console.warn('Continuing to run the appropriate exit callback anyway...');
  //           }

  //           return done();
  //         });//</after sails.lower()>
  //       })(function afterMaybeDoingTeardown(unused) {
  //         if (unused) { throw new Error('Consistency violation: There should never be a teardown error!  But got:'+unused.stack); }

  //         // If the success exit was triggered, then...
  //         if (!sbErr) {

  //           // Determine the appropriate callback to call, and then call it.
  //           if (_.isFunction(argumentPassedToExec)) {
  //             argumentPassedToExec(undefined, successResult);
  //           }
  //           else if (_.isObject(argumentPassedToExec)) {
  //             if (argumentPassedToExec.success) { argumentPassedToExec.success(successResult); }
  //             else { callbacks.success(successResult); }
  //           }
  //           else { callbacks.success(successResult); }

  //         }
  //         // Otherwise, some other exit (e.g. `foo` or `error`) was triggered, so...
  //         else {

  //           // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  //           // If the catchall `error` exit was triggered, then we want the process to exit with an
  //           // exit code of 1.  But unfortunately, in some versions of Node (definitely in v4.3.0 anyway)
  //           // it seems that setting `process.exitCode = 1` doesn't actually work.  Now, IF IT DID work,
  //           // it would allow us to set the exit code here, but not actually have it take effect until the
  //           // process actually exits-- kind of like `res.status()` in Sails/Express.  The nice thing about
  //           // that would be that we could set it here, but still allow userland to override this behavior
  //           // by providing an `error` callback when calling `.exec()` (i.e. having it set `process.exitCode = 0`
  //           // or  call `process.exit(0)`).
  //           //
  //           // But obviously we can't do that.  So instead, we get as close as we can:
  //           //
  //           // Unless userland passes in an `error` callback to `.exec()` (or just passes in a conventional
  //           // Node callback function), then nothing special will happen as far as exit code.
  //           //
  //           // On the other hand, _if there is no custom catchall `error` handling logic provided_, then the
  //           // default error callback within `whelk` will call `process.exit(1)`.
  //           // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  //           // `outputToUse` will be passed to the callback if a non-catchall callback is in use.
  //           var outputToUse = _.isUndefined(sbErr.output) ? sbErr : sbErr.output;

  //           // Determine the appropriate callback to call, and then call it.
  //           if (_.isFunction(argumentPassedToExec)) {
  //             argumentPassedToExec(sbErr);
  //           }
  //           else if (_.isObject(argumentPassedToExec) && _.contains(_.keys(argumentPassedToExec), sbErr.exit)) {
  //             argumentPassedToExec[sbErr.exit](outputToUse);
  //           }
  //           else if (_.contains(_.keys(callbacks), sbErr.exit)) {
  //             callbacks[sbErr.exit](outputToUse);
  //           }
  //           else if (_.isObject(argumentPassedToExec) && _.contains(_.keys(argumentPassedToExec), 'error')) {
  //             argumentPassedToExec.error(sbErr);
  //           }
  //           else { callbacks.error(sbErr); }

  //         }//</else :: an exit other than `success` was triggered>

  //         // >-
  //         // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  //         // At this point, the exit callback has run.
  //         // It probably won't have asynchronous stuff in it, so it may be
  //         // completely done.  Or it might have other stuff to do still.
  //         //
  //         // But the important thing is that, when it is finished, the process will
  //         // exit naturally (unless there are any unintentional hanging callbacks in
  //         // the machine-- or e.g. if the machine started a TCP server).
  //         //
  //         // For more background, see:
  //         // https://nodejs.org/api/process.html#process_process_exit_code
  //         // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


  //         // The following spinlock protects against the machine calling more than one
  //         // exit, or the same exit twice.
  //         var exitCodeNameToTrack = (function _getExitCodeNameToTrack (){
  //           if (!sbErr) { return 'success'; }
  //           else if (sbErr.exit) { return sbErr.exit; }
  //           else { return 'error'; }
  //         })();//</self-calling function :: _getExitCodeNameToTrack()>

  //         if (exitAttempts.length > 0) {
  //           console.warn('Consistency violation: When running this script, the underlying implementation called its exits '+
  //           'more than once!  A script should _always_ call exactly one exit.  This particular unexpected extra termination '+
  //           'of the script process was attempted via the `'+exitCodeNameToTrack+'` exit.  It was ignored.  For debugging purposes, '+
  //           'here is a list of all exit attempts made by this script:',exitAttempts);
  //           return;
  //         }

  //         exitAttempts.push(exitCodeNameToTrack);


  //       });//</running self-calling function :: _doTeardownMaybe()>
  //     }]);//</calling underlying .exec() -- i.e. running the machine `fn`>
  //   });//</running self-calling function :: _doSetupMaybe()>
  // };//</definition of our .exec() override>



  // //     ███╗   ███╗███████╗████████╗ █████╗  ██╗██╗
  // //     ████╗ ████║██╔════╝╚══██╔══╝██╔══██╗██╔╝╚██╗
  // //     ██╔████╔██║█████╗     ██║   ███████║██║  ██║
  // //     ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║  ██║
  // //  ██╗██║ ╚═╝ ██║███████╗   ██║   ██║  ██║╚██╗██╔╝
  // //  ╚═╝╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═╝╚═╝
  // //
  // //  ┌─┐┬─┐┌─┐┬  ┬┬┌┬┐┌─┐  ╔╦╗╔═╗╔╦╗╔═╗  ┌┬┐┌─┐  ┌┬┐┌─┐┌─┐┬ ┬┬┌┐┌┌─┐  ┌─┐┌┐┌
  // //  ├─┘├┬┘│ │└┐┌┘│ ││├┤   ║║║║╣  ║ ╠═╣   │ │ │  │││├─┤│  ├─┤││││├┤   ├┤ │││
  // //  ┴  ┴└─└─┘ └┘ ┴─┴┘└─┘  ╩ ╩╚═╝ ╩ ╩ ╩   ┴ └─┘  ┴ ┴┴ ┴└─┘┴ ┴┴┘└┘└─┘  └  ┘└┘
  // //
  // // Now provide `this`.
  // //
  // // This allows us to provide access to special metadata (aka "habitat variables")
  // // this particular machine runner (i.e. `whelk`), as well
  // // as any other scope specific to our habitat.
  // //
  // // For example, if this machine declares the "sails" habitat, then we
  // // must be managing a Sails app instance for this script.  So we pass
  // // through that Sails app instance as `this.sails`.
  // //
  // // Similarly, since `whelk` parses serial command-line
  // // arguments, it _always_ provides ``this.serialCommandLineArgs`.
  // // > Note: If there are no serial command-line arguments, then
  // // > `this.serialCommandLineArgs` is an empty array).
  // if (deferred.meta){
  //   deferred.meta(habitatVarsToSet);
  // }
  // // Fall back to `setEnvironment` for older versions of the machine runner.
  // else if (deferred.setEnvironment) {
  //   console.warn(
  //     chalk.bold.yellow('Note:')+'  The provided, pre-built function (`'+chalk.bold.red(deferred.friendlyName||deferred.identity)+'`) does not support `.meta()`,\n'+
  //     'presumably because it comes from a package that is using an older version\n'+
  //     'of the machine runner.  Nevertheless, it does seem to support the traditional\n'+
  //     'usage (`setEnvironment()`), which should do the trick...\n'+
  //     chalk.gray(
  //     '|  If you happen to be the maintainer of this package, then please\n'+
  //     '|  upgrade your package to the latest version of the machine runner.'
  //     )+
  //     '\n'
  //   );
  //   deferred.setEnvironment(habitatVarsToSet);
  // }
  // // If even THAT doesn't work, then give up-- failing w/ a fatal error.
  // else {
  //   throw new Error(
  //     'The provided pre-built ("wet") machine does not support `.meta()`,\n'+
  //     'presumably because it was built with an older version of the machine runner.\n'+
  //     'Automatically tried to use `setEnvironment()` as well, but that didn\'t\n'+
  //     'work either.  So please try "dehydrating" the machine by entering its\n'+
  //     '`inputs`, `exits`, `fn`, etc. manually.\n'+
  //     '\n'+
  //     '(If you happen to be the author of the source package, then please upgrade\n'+
  //     'your pack to the latest version of the machine runner.)  If you experience\n'+
  //     'further issues, please visit http://sailsjs.com/support for help.'
  //   );
  // }//>-•


};
