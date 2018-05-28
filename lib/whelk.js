/**
 * Module dependencies
 */

var path = require('path');
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
 *         @property {Array?} envVarNamespace
 *         @property {Array?} rawSerialCommandLineArgs
 *         @property {SailsApp?} sails
 *         @property {Boolean?} useRawOutput
 *
 * @param {Error?} omen    [optional, for use in improving stack traces]
 *
 * @return {Deferred}
 *         A parley Deferred, ready to execute.  Accepts argins from
 *         serial command-line args, system environment vars, and
 *         command-line opts; and with pre-configured default exit
 *         handler callbacks that, unless overridden, write output
 *         to stdout or stderr.
 */
module.exports = function whelk(optsOrMachineDef, omen){

  // If one wasn't provided, build an omen for use in improving stack traces.
  // (unless this is a production environment without DEBUG enabled)
  omen = omen || flaverr.omen(whelk);


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

  // Use either `opts` or `opts.def` as the machine definition
  // If `opts.def` is truthy, we'll use that as the machine definition.
  // Otherwise, we'll understand the entire `opts` dictionary to be the machine
  // definition.
  var machineDef;
  var opts;
  var MISC_OPTIONS = ['args', 'envVarNamespace', 'rawSerialCommandLineArgs', 'sails', 'useRawOutput'];
  if (!optsOrMachineDef.def) {
    machineDef = optsOrMachineDef;
    opts = _.pick(optsOrMachineDef, MISC_OPTIONS);
  }
  else {
    machineDef = optsOrMachineDef.def;
    opts = _.pick(optsOrMachineDef, MISC_OPTIONS);
  }

  // `args` is a special case, since it's part of the machine spec, but also tolerated
  // in `opts` for compatibility.
  if (opts.args && !machineDef.args) {
    machineDef.args = opts.args;
  } else if (!opts.args && machineDef.args) {
    opts.args = machineDef.args;
  } else if (opts.args && machineDef.args && opts.args !== machineDef.args) {
    throw flaverr({
      name: 'ImplementationError',
      message: 'Invalid shell script: Definition and whelk-specific script options cannot both contain different `args` declarations.  Only one `args` declaration can be used at a time.'
    });
  }



  //  ██████╗ ██╗   ██╗██╗██╗     ██████╗
  //  ██╔══██╗██║   ██║██║██║     ██╔══██╗
  //  ██████╔╝██║   ██║██║██║     ██║  ██║
  //  ██╔══██╗██║   ██║██║██║     ██║  ██║
  //  ██████╔╝╚██████╔╝██║███████╗██████╔╝
  //  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝

  // Quick sanity check of provided shell script definition to make sure it's at
  // least close enough to correct to allow for parsing.
  if (!_.isObject(machineDef)) {
    throw flaverr({
      name: 'ImplementationError',
      message: 'Invalid shell script: Definition must be provided as a dictionary (i.e. plain JavaScript object, like `{}`).'
    });
  }//•

  // Make sure our shell script definition has an `identity`, inferring one for it if need be.
  var inferredIdentity = machineDef.identity || (machineDef.friendlyName ? _.kebabCase(machineDef.friendlyName) : undefined);
  machineDef = _.extend({
    identity: inferredIdentity
  }, machineDef);

  // If it could not be inferred at all, then fail with an error.
  if (!inferredIdentity) {
    throw flaverr({
      name: 'ImplementationError',
      message: 'Invalid shell script: Definition must include some way of identifying itself, such as a `friendlyName`.'
    });
  }//•

  // Now build our Callable (aka "wet machine").
  var wetMachine;
  try {
    wetMachine = Machine.buildWithCustomUsage({
      def: machineDef,
      implementationSniffingTactic: 'analogOrClassical'
    }, omen);
  } catch (err) {
    throw flaverr({
      name: 'ImplementationError',
      message: 'Could not build shell script.  '+err.message
    }, err);
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
          throw flaverr({
            name: 'ImplementationError',
            message: 'Invalid shell script: If specified, `args` should be provided as an array of strings.'
          });
        }//•

        _.each(opts.args, function (targetInputCodeName){

          // Check that target input definition exists.
          var targetInputDef = _.keys(wetMachine.getDef().inputs||{});
          if (!targetInputDef) {
            throw flaverr({
              name: 'ImplementationError',
              message: 'Invalid shell script: `args` references an unrecognized input (`'+targetInputCodeName+'`).  Each item in `args` should be the code name of a declared key in `inputs`.'
            });
          }

          // Check that target input definition does not explicitly expect a dictionary, array, or function.
          if (targetInputDef.type === 'lamda' || _.isObject(targetInputDef.type)) {
            throw flaverr({
              name: 'ImplementationError',
              message: 'Invalid shell script: `args` references an input (`'+targetInputCodeName+'`) which is _never_ compatible with data from serial command-line arguments.'
            });
          }
        });//</_.each() :: target input code name in the `opts.args` array>


      })(); break;


      case 'envVarNamespace': (function (){
        if (!_.isString(opts.envVarNamespace)) {
          throw flaverr({
            name: 'ImplementationError',
            message: 'Invalid shell script: If specified, `envVarNamespace` should be provided as a string.'
          });
        }
      })(); break;


      case 'rawSerialCommandLineArgs': (function (){
        if (!_.isArray(opts.rawSerialCommandLineArgs)) {
          throw flaverr({
            name: 'ImplementationError',
            message: 'Invalid shell script: If specified, `rawSerialCommandLineArgs` should be provided as an array of strings.'
          });
        }
      })(); break;


      case 'sails': (function (){
        if (!_.isObject(opts.sails) || opts.sails.constructor.name !== 'Sails') {
          throw flaverr({
            name: 'ImplementationError',
            message: 'Invalid shell script: The supposed Sails app instance provided as `sails` seems a little sketchy.  Make sure you are doing `sails: require(\'sails\')`.'
          });
        }
        // Note that we do additional validations below.
        // (bcause at this point in the code, we can't yet guarantee the machine's `habitat` will be correct--
        //  at least not across all versions of the `machine` runner)
      })(); break;


      case 'useRawOutput': (function (){
        if (!_.isBoolean(opts.useRawOutput)) {
          throw flaverr({
            name: 'ImplementationError',
            message: 'Invalid shell script: If specified, `useRawOutput` should be provided as either `true` or `false`.'
          });
        }
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



  // We'll use this local variable (`habitatVarsToSet`) build up the metadata dictionary
  // we'll pass in to the machine runner below via `.meta()`.
  //
  // > See http://node-machine.org for more details.
  var habitatVarsToSet = {};



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

  });//∞


  // If we seem to be on the REPL, don't even try to generate usage.
  if (
    (process.argv.length === 1 && path.basename(process.argv[0], '.js') === 'node') ||
    (process.argv.length === 2 && path.basename(process.argv[0], '.js') === 'sails' && process.argv[1] === 'console')
  ) {
    // (do nothing)
  } else {
    // Otherwise, give it a go.
    try {
      program.parse(process.argv);
    } catch (err) {
      throw flaverr({
        message: 'Could not parse command-line arguments for shell script.  '+err.message,
        raw: err
      });
    }
  }


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

  // var rawSerialCommandLineArgs = _.isArray(yargs.argv._) ? yargs.argv._ : [];
  var rawSerialCommandLineArgs = opts.rawSerialCommandLineArgs || (_.isArray(yargs.argv._) ? yargs.argv._ : []);

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
      console.error('Could not run script, because the app could not be loaded.\n', err);
      return process.exit(1);
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
        //
        // Note: This `err` is from above.
        if (err) {

          if (opts.useRawOutput) {
            process.stderr.write(util.inspect(err,{depth:5}));
          }
          // Otherwise, check what kind of error this is, and write console output accordingly.
          else {

            // Build base failure msg (used below)
            var baseFailureMsg = 'Could not '+(function _getImperativeMoodFragmentWithEndingPunctuation(){
              var imperativeMoodFragmentWithEndingPunctuation;
              if (wetMachine.getDef().description) {
                imperativeMoodFragmentWithEndingPunctuation = wetMachine.getDef().description[0].toLowerCase() + wetMachine.getDef().description.slice(1);// + '.';
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                // FUTURE: Bring in our trusty old `ensure-ending-punctuation.js` util here
                // (so we can gracefully add trailing punctuation, if appropriate -- e.g. a
                // period at the end)
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              }
              else if (wetMachine.getDef().friendlyName) {
                imperativeMoodFragmentWithEndingPunctuation = wetMachine.getDef().friendlyName[0].toLowerCase() + wetMachine.getDef().friendlyName.slice(1);
              }
              else {
                imperativeMoodFragmentWithEndingPunctuation = 'run script.';
              }


              return imperativeMoodFragmentWithEndingPunctuation;
            })();


            if (err.name === 'Exception') {
              console.log(
                chalk.cyan('Something went wrong:')+'\n'+
                chalk.gray(err.message)+'\n'
              );
            }
            else if (err.name === 'UsageError' && err.code === 'E_INVALID_ARGINS') {
              console.error(
                baseFailureMsg+'\n'+
                err.problems.length+' arg'+(err.problems.length !== 1 ?'s':'')+'/'+
                'opt'+(err.problems.length !== 1?'s':'')+' '+
                (err.problems.length !== 1?'are':'is')+' '+
                'missing or invalid:'+'\n'+
                _.map(err.problems, function (problem){ return '  • '+problem; }).join('\n')+'\n'+
                '\n'
              );
            }
            else if (err.name === 'TimeoutError') {
              console.error(
                baseFailureMsg+'\n'+
                'This is taking too long.\n'+
                chalk.gray('Should have finished in '+chalk.bold(wetMachine.getDef().timeout+'ms')+' or less.')+'\n'
              );
            }
            else if (err.name === 'Envelope' && err.code === 'E_FROM_WITHIN') {
              console.error(
                baseFailureMsg+'\n'+
                err.message+'\n'+
                // err.message.replace(/\n*(\s*)\[\?\][^\n]+\n*$/m, '$1')+'\n'+
                chalk.dim(util.inspect(err.raw, {depth:5}))+'\n'
              );
            }
            else {
              // console.error(
              //   baseFailureMsg+'\n'+
              //   err.message+'\n'+
              //   chalk.dim(util.inspect(err, {depth:5}))+'\n'
              // );
              var inspectedErrLines = util.inspect(err,{depth:5}).split('\n');
              console.error(
                baseFailureMsg+'\n'+
                inspectedErrLines[0]+'\n'+
                chalk.dim(inspectedErrLines.slice(1).join('\n'))+'\n'
              );
            }//ﬁ
          }//ﬁ

          if (err.name === 'Exception') {
            // Miscellaneous exits terminate the process with a 0 signal.
            // (Indicating that failure may or may not occurred.)
            //
            // > Note: While this may seem counter-intuitive, it is in line
            // > with the behavior of common shell commands like `git status`,
            // > `git commit`, and `ls`.
            return process.exit(0);
          }
          else {
            // Any generic error terminates the process with a 1 signal.
            // (Indicating failure.)
            return process.exit(1);
          }
        }//•

        if (result !== undefined) {
          if (opts.useRawOutput) {
            if (_.isString(result)) {
              process.stdout.write(result);
            } else {
              var stringified;
              try {
                stringified = JSON.stringify(result);
              } catch (unusedCircularStringificationErr) { /* ignored on purpose */ }
              if (stringified === undefined) {
                process.stdout.write(result.toString());
              } else {
                process.stdout.write(stringified);
              }
            }
          }
          else {
            console.log(
              _.isString(result) ?
                result
                :
                util.inspect(result, {depth: 5, colors: true})
            );
          }
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

};
