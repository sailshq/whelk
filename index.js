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
 * (See README.md for more information.)
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param  {Dictionary|Machine} optsOrMachineDef
 *         @property {Dictionary?} machine
 *         @property {Array?} args
 *         @property {Array?} envVarNamespace
 *         @property {SailsApp?} sails
 *
 * @return {Machine}
 *         A live machine instance, but warped to accept CLI args/opts & env vars.
 *         Also granted other special abilities.
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
          throw new Error('Invalid option: If specified, `args` should be provided as an array of strings.');
        }
        _.each(opts.args, function (targetInputCodeName){
          var knownInputCodeNames = _.keys(machineDef.inputs||{});
          if (!_.contains(knownInputCodeNames, targetInputCodeName)) {
            throw new Error('Invalid option: `args` references an unrecognized input (`'+targetInputCodeName+'`).  Each item in `args` should be the code name of a known input defined in this machine!');
          }
        });
      })(); break;


      case 'envVarNamespace': (function (){
        if (!_.isString(opts.envVarNamespace)) {
          throw new Error('Invalid option: If specified, `envVarNamespace` should be provided as a string.');
        }
      })(); break;


      case 'sails': (function (){
        if (!_.isObject(opts.sails) || opts.sails.constructor.name !== 'Sails') {
          throw new Error('Invalid option: The supposed Sails app instance provided as `sails` seems a little sketchy.  Make sure you are doing `sails: require(\'sails\')`.');
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
  // Set up namespace for environment variables.
  var envVarNamespace = '___';
  if (_.isString(opts.envVarNamespace)) {
    envVarNamespace = opts.envVarNamespace;
  }


  // We'll use this local variable (`envToSet`) to hold the `env` dictionary we're building up below.
  // At the very end, we'll use this again when we build the dictionary to send to `setEnv`)
  //
  // > Remember: this `env` is _completely_ different from system "environment variables"!
  // > It is more closely related to the notion of "habitat" in the machine spec.
  // > See http://node-machine.org for more details.
  var envToSet = {};




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
  // (TODO: consider moving this into machine runner-- but need to do that _carefully_-- there's complexities in there)
  // we need to duck-type the provided machine to determine whether or not it is an already-instantiated machine or not.
  // If it is, use as-is. Otherwise, use the definition to build a new machine.
  // (checks new `isWetMachine` property, but also the function name for backwards compatibility)
  var wetMachine;
  if ( machineDef.isWetMachine || machineDef.name==='_callableMachineWrapper') {
    wetMachine = machineDef;
  }
  else {
    wetMachine = Machine.build(_.extend({
      identity: machineDef.identity || (machineDef.friendlyName ? _.kebabCase(machineDef.friendlyName) : 'anonymous-machine-as-script'),
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
        exits.error(new Error('Not implemented yet! (This is a default `fn` injected by `machine-as-script`.)'));
      }
    },machineDef));
  }


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
    // In the mean time, we'll go ahead and save a reference to this Sails app on `envToSet`, since we'll
    // be passing it into the machine instance's `fn` as `env.sails` (via `.setEnv()`)
    envToSet.sails = opts.sails;

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
  // (using CLI opts, serial CLI args, and/or env vars)
  // ======================================================================

  // Configure CLI usage helptext and set up commander
  program.usage('[options]');

  // Keep track of shortcuts used (e.g. can't have a "-p" option mean two different things at once)
  var shortcutsSoFar = [];

  // Loop over each input and set up command line opts for usage docs generated by commander.
  _.each(wetMachine.inputs, function (inputDef, inputName) {

    // Handle `--` flags
    var opt = '--'+inputName;

    // Handle `-` shortcuts
    var optShortcut = (function (){
      var _shortcut = '-'+inputName[0];
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

  // Build runtime input values from CLI options and args.
  var inputConfiguration = {};

  // Supply CLI options
  // (the ones that start with `-` or `--`)
  // =======================================================================================
  _.extend(inputConfiguration, yargs.argv);
  delete inputConfiguration._;
  delete inputConfiguration.$0;

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // TODO: make the following usage work in the way you would expect:
  // ```
  // kit exclaim --verbose 'my sweet code comment' wat --width '37'
  // ```
  // Currently, `'my sweet code comment'` is parsed as "verbose",
  // even though "verbose" should really be a boolean, and so that
  // string should be interpreted as a serial CLI arg (not an opt).
  //
  // (see https://github.com/yargs/yargs#booleankey for more info)
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


  // Supply environment variables
  // =======================================================================================
  _.each(wetMachine.inputs, function (inputDef, inputName){
    var envVarData = process.env[envVarNamespace + inputName];
    if (_.isUndefined(envVarData)) {
      return;
    }

    // If environment variable exists, we'll grab its value and
    // supply it as configuration for this input.
    inputConfiguration[inputName] = envVarData;
  });


  // Supply serial CLI arguments
  // (the kind that come one after another -- i.e. they don't start with `-` or `--`)
  // =======================================================================================
  envToSet.commandLineArgs = _.isArray(yargs.argv._) ? yargs.argv._ : [];
  // (^^ Note that we always supply `env.commandLineArgs`.)

  // But if `opts.args` was provided, then we ALSO iterate through the serial CLI args
  // and provide them as values for the appropriate inputs (i.e. according to the order
  // of code names in `opts.args`.)
  if (_.isArray(opts.args)) {
    _.each(opts.args, function (inputName, i){
      inputConfiguration[inputName] = envToSet.commandLineArgs[i];
    });
  }


  // TODO: deprecate
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Include a special `args` input for convenience--
  // but note that this is an experimental feature that could change.
  //
  // UPDATE: THIS WILL BE DEPRECATED SOON.  USE `env.commandLineArgs` INSTEAD!!!
  if (_.isArray(envToSet.commandLineArgs)) {
    inputConfiguration.args = envToSet.commandLineArgs;// << will be deprecated
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


  // Finally, loop through each of the input configurations and run `rttc.parseHuman()`.
  inputConfiguration = _.reduce(inputConfiguration, function (memo, val, inputName){

    // Skip special `args` input (unless there's actually an input named `args`.)
    var inputDef = wetMachine.inputs[inputName];
    if (!inputDef && inputName === 'args') {
      return memo;
    }
    if (!inputDef) {
      throw new Error('Unexpected error: received configuration for unknown input ('+inputName+')');
    }
    // Before using `rttc.parseHuman()`, ensure the value is a string
    // (yargs parses some things as numbers)
    val = val+'';
    memo[inputName] = rttc.parseHuman(val, rttc.infer(inputDef.example), true);
    return memo;
  }, {});

  // Set input values from CLI args/opts
  var liveMachine = wetMachine(inputConfiguration);


  // console.log('----------------------------------------------------------------------');
  // console.log('serial CLI args: ',envToSet.commandLineArgs);
  // console.log('input configuration that was parsed: ',inputConfiguration);
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
  // We use a local variable (`alreadyExited`) as a spinlock.
  var alreadyExited;
  _.each(_.keys(wetMachine.exits), function builtExitCallback(exitCodeName){

    // Build a callback for this exit that sends the appropriate response.
    callbacks[exitCodeName] = function respondApropos(output){
      // This spinlock protects against the machine calling more than one
      // exit, or the same exit twice.
      if (alreadyExited) { return; }
      alreadyExited = true;

      if (exitCodeName === 'error') {
        console.error(chalk.red('Unexpected error occurred:\n'), output);
        console.error(output.stack ? chalk.gray(output.stack) : output);
        return;
      }
      else if (exitCodeName === 'success') {
        if (_.isUndefined(output)) {
          try {
            if (
              !_.isUndefined(liveMachine.exits.success.example) ||
              _.isFunction(liveMachine.exits.success.getExample) ||
              !_.isUndefined(liveMachine.exits.success.like) ||
              !_.isUndefined(liveMachine.exits.success.itemOf)
            ) {
              // TODO: support json-encoded output vs colors
              console.log(util.inspect(output, {depth: null, colors: true}));
            }
          }
          catch (e) { /* fail silently if anything goes awry */ }
        }
        // Otherwise, output is expected.  So log it.
        else {
          console.log(chalk.green('OK.'));
        }
      }
      // Miscellaneous exit.
      else {
        console.log(chalk.cyan('Something went wrong:'));
        console.error(output.stack ? chalk.gray(output.stack) : output);
      }
    };//</callback definition>
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
  liveMachine.exec = function () {
    var args = Array.prototype.slice.call(arguments);

    // If we're not managing a Sails app instance for this script, then just do the normal thing.
    if (_.isUndefined(envToSet.sails)) {
      if (_.isObject(args[0])) {
        var combinedCbs = _.extend({}, callbacks, args[0]);
        _originalExecBeforeItWasChangedForUseByMachineAsScript.apply(liveMachine, [combinedCbs]);
      }
      else if (_.isFunction(args[0])) {
        _originalExecBeforeItWasChangedForUseByMachineAsScript.apply(liveMachine, [args[0]]);
      }
      else {
        _originalExecBeforeItWasChangedForUseByMachineAsScript.apply(liveMachine, [callbacks]);
      }
      return;
    }

    // --•
    // Otherwise, we need to load Sails first, then lower it afterwards.

    //  ┬  ┌─┐┌─┐┌┬┐  ┌─┐┌─┐┬┬  ┌─┐
    //  │  │ │├─┤ ││  └─┐├─┤││  └─┐
    //  ┴─┘└─┘┴ ┴─┴┘  └─┘┴ ┴┴┴─┘└─┘
    // Load the Sails app.
    envToSet.sails.load(function (err){
      if (err) {
        throw new Error('This script relies on access to Sails, but when attempting to load this Sails app automatically, an error occurred.  Details: '+err.stack);
      }

      //  ┬─┐┬ ┬┌┐┌  ┬ ┬┌┐┌┌┬┐┌─┐┬─┐┬ ┬ ┬┬┌┐┌┌─┐   ╔═╗═╗ ╦╔═╗╔═╗
      //  ├┬┘│ ││││  │ ││││ ││├┤ ├┬┘│ └┬┘│││││ ┬   ║╣ ╔╩╦╝║╣ ║
      //  ┴└─└─┘┘└┘  └─┘┘└┘─┴┘└─┘┴└─┴─┘┴ ┴┘└┘└─┘  o╚═╝╩ ╚═╚═╝╚═╝
      // Run underlying .exec(), but intercept it to tear down the Sails app.
      _originalExecBeforeItWasChangedForUseByMachineAsScript.apply(liveMachine, [function (sbErr, successResult){

        //  ┬  ┌─┐┬ ┬┌─┐┬─┐  ┌─┐┌─┐┬┬  ┌─┐
        //  │  │ ││││├┤ ├┬┘  └─┐├─┤││  └─┐
        //  ┴─┘└─┘└┴┘└─┘┴└─  └─┘┴ ┴┴┴─┘└─┘
        envToSet.sails.lower(function (sailsLowerErr) {
          if (sailsLowerErr) {
            console.warn('This script relies on access to Sails, but when attempting to lower this Sails app automatically after running the script, an error occurred.  Details:',sailsLowerErr.stack);
            console.warn('Continuing to run the appropriate exit callback anyway...');
          }

          // Success
          if (!sbErr) {
            if (_.isObject(args[0])) {
              if (args[0].success) { args[0].success(successResult); }
              else { callbacks.success(successResult); }
            }
            else if (_.isFunction(args[0])) {
              args[0](undefined, successResult);
            }
            else { callbacks.success(successResult); }
          }
          // Some other exit (or catchall error)
          else {
            if (_.isObject(args[0]) && _.contains(_.keys(args[0]), sbErr.exit)) {
              args[0][sbErr.exit](sbErr.output);
            }
            else if (_.isFunction(args[0])) {
              args[0](sbErr);
            }
            else if (_.contains(_.keys(callbacks), sbErr.exit)) {
              callbacks[sbErr.exit](sbErr.output);
            }
            else { callbacks.error(sbErr); }
          }

        });//</after sails.lower()>
      }]);//</after calling underlying .exec()>

    });//</after sails.load()>
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
  // Now provide `env.
  //
  // This allows us to provide access to special variables for this
  // particular machine runtime (i.e. `machine-as-script`), as well
  // as any other scope specific to the machine's habitat.
  //
  // For example, if this machine declares the "sails" habitat, then we
  // must be managing a Sails app instance for this script.  So we pass
  // through that Sails app instance as `env.sails`.
  //
  // Similarly, since `machine-as-script` parses serial command-line
  // arguments, it _always_ provides ``env.commandLineArgs`.
  liveMachine.setEnv(envToSet);





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
