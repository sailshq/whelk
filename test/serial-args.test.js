/**
 * Module dependencies
 */

var util = require('util');
var assert = require('assert');
var Process = require('machinepack-process');




describe('running a script', function (){



  //  ██████╗  █████╗ ███████╗██╗ ██████╗    ██╗   ██╗███████╗ █████╗  ██████╗ ███████╗
  //  ██╔══██╗██╔══██╗██╔════╝██║██╔════╝    ██║   ██║██╔════╝██╔══██╗██╔════╝ ██╔════╝
  //  ██████╔╝███████║███████╗██║██║         ██║   ██║███████╗███████║██║  ███╗█████╗
  //  ██╔══██╗██╔══██║╚════██║██║██║         ██║   ██║╚════██║██╔══██║██║   ██║██╔══╝
  //  ██████╔╝██║  ██║███████║██║╚██████╗    ╚██████╔╝███████║██║  ██║╚██████╔╝███████╗
  //  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝     ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
  //
  describe('and provide a REQUIRED argin via a serial command-line argument', function (){
    this.slow(1400);

    it('should not fail', function (done){

      Process.executeCommand({
        dir: __dirname,
        command: 'node ./fixtures/script-expecting-one-required-string-as-serial-arg.js sumthin',
        environmentVars: {},
        timeout: 1500
      }).exec(function (err,outs){
        if (err){ return done(err); }
        try {
          assert.equal(outs.stdout, 'got "sumthin"');
        } catch (e) { return done(e); }
        return done();
      });
    });//</it>

  });//</describe :: and provide a REQUIRED argin via a serial command-line argument>


  describe('and provide an OPTIONAL argin via a serial command-line argument', function (){
    this.slow(1400);

    it('should not fail', function (done){

      Process.executeCommand({
        dir: __dirname,
        command: 'node ./fixtures/script-expecting-one-optional-string-as-serial-arg.js sumthin',
        environmentVars: {},
        timeout: 1500
      }).exec(function (err,outs){
        if (err){ return done(err); }
        try {
          assert.equal(outs.stdout, 'got "sumthin"');
        } catch (e) { return done(e); }
        return done();
      });
    });//</it>

  });//</describe :: and provide an OPTIONAL argin via a serial command-line argument>


  describe('without providing a serial command-line argument, even though declared `args` point at an OPTIONAL input def', function (){
    this.slow(1400);

    describe('and without specifying the optional argin any other way', function (){

      it('should not fail', function (done){
        Process.executeCommand({
          dir: __dirname,
          command: 'node ./fixtures/script-expecting-one-optional-string-as-serial-arg.js',
          environmentVars: {},
          timeout: 1500
        }).exec(function (err,outs){
          if (err){ return done(err); }
          try {
            assert.equal(outs.stdout, 'Nothing was provided!  Can\'t I have something?');
          } catch (e) { return done(e); }
          return done();
        });
      });//</it>

    });//</describe :: without specifying the optional argin any other way>


    describe('but with a command-line option provided instead', function (){

      it('should not fail', function (done){
        Process.executeCommand({
          dir: __dirname,
          command: 'node ./fixtures/script-expecting-one-optional-string-as-serial-arg.js --something=\'sumthin\'\\\'\' different\'',
          environmentVars: {},
          timeout: 1500
        }).exec(function (err,outs){
          if (err){ return done(err); }
          try {
            assert.equal(outs.stdout, 'got "sumthin\' different"');
          } catch (e) { return done(e); }
          return done();
        });
      });//</it>

    });//</describe :: but with a command-line option provided instead>

    describe('but with an environment variable provided instead', function (){

      it('should not fail', function (done){
        Process.executeCommand({
          dir: __dirname,
          command: '___something=\'sumthin\'\\\'\' different\' node ./fixtures/script-expecting-one-optional-string-as-serial-arg.js',
          environmentVars: {},
          timeout: 1500
        }).exec(function (err,outs){
          if (err){ return done(err); }
          try {
            assert.equal(outs.stdout, 'got "sumthin\' different"');
          } catch (e) { return done(e); }
          return done();
        });
      });//</it>

    });//</describe :: but with an environment variable provided instead>

  });//</describe :: without providing a serial command-line argument, even though declared `args` point at an OPTIONAL input def>



  //  ███████╗██╗  ██╗████████╗██████╗  █████╗ ███╗   ██╗███████╗ ██████╗ ██╗   ██╗███████╗
  //  ██╔════╝╚██╗██╔╝╚══██╔══╝██╔══██╗██╔══██╗████╗  ██║██╔════╝██╔═══██╗██║   ██║██╔════╝
  //  █████╗   ╚███╔╝    ██║   ██████╔╝███████║██╔██╗ ██║█████╗  ██║   ██║██║   ██║███████╗
  //  ██╔══╝   ██╔██╗    ██║   ██╔══██╗██╔══██║██║╚██╗██║██╔══╝  ██║   ██║██║   ██║╚════██║
  //  ███████╗██╔╝ ██╗   ██║   ██║  ██║██║  ██║██║ ╚████║███████╗╚██████╔╝╚██████╔╝███████║
  //  ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝
  //
  //  ███████╗███████╗██████╗ ██╗ █████╗ ██╗          █████╗ ██████╗  ██████╗ ███████╗
  //  ██╔════╝██╔════╝██╔══██╗██║██╔══██╗██║         ██╔══██╗██╔══██╗██╔════╝ ██╔════╝
  //  ███████╗█████╗  ██████╔╝██║███████║██║         ███████║██████╔╝██║  ███╗███████╗
  //  ╚════██║██╔══╝  ██╔══██╗██║██╔══██║██║         ██╔══██║██╔══██╗██║   ██║╚════██║
  //  ███████║███████╗██║  ██║██║██║  ██║███████╗    ██║  ██║██║  ██║╚██████╔╝███████║
  //  ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
  //
  describe('and provide serial command-line argument(s) when none are explicitly expected via `args`', function (){
    this.slow(1400);

    it('should work just like normal even though there\'s one extra serial cmdline arg', function (done){

      Process.executeCommand({
        dir: __dirname,
        command: 'node ./fixtures/script-with-no-output.js sumthin',
        environmentVars: {},
        timeout: 1500
      }).exec(function (err,outs){
        if (err){ return done(err); }
        try { assert.equal(outs.stdout, ''); }
        catch (e) { return done(e); }
        return done();
      });
    });//</it>

    it('should work just like normal even though there\'s 2 extra serial cmdline args', function (done) {

      Process.executeCommand({
        dir: __dirname,
        command: 'node ./fixtures/script-with-no-output.js sumthin sumthin_ELSE',
        environmentVars: {},
        timeout: 1500
      }).exec(function (err,outs){
        if (err){ return done(err); }
        try { assert.equal(outs.stdout, ''); }
        catch (e) { return done(e); }
        return done();
      });
    });//</it>

  });//</describe :: and attempt to provide an argin via an UNEXPECTED serial command-line argument>


  describe('and attempt to provide a 2nd serial command-line argument, when only one is expected by `args`', function (){
    this.slow(1400);

    it('should terminate with an error', function (done){

      Process.executeCommand({
        dir: __dirname,
        command: 'node ./fixtures/script-expecting-one-required-string-as-serial-arg.js sumthin sumthin_ELSE',
        environmentVars: {},
        timeout: 1500
      }).exec(function (err,outs){
        if (err) {
          try {
            assert(err.stack.match('Too many serial command-line arguments were provided.'), new Error('Expected error to look different!  Here\'s what I got: '+err.stack));
          } catch (e) { return done(e); }
          return done();
        }

        return done(new Error('Should have exited with an error (because unexpected serial args were provided)  But instead, script exited with normal code 0 and returned: '+util.inspect(outs, {depth:null})));
      });

    });//</it>

  });//</describe :: and attempt to provide an extra argin via an UNEXPECTED 2ND serial command-line argument>



  //  ███╗   ███╗██╗███████╗ ██████╗    ███████╗██████╗  ██████╗ ███████╗
  //  ████╗ ████║██║██╔════╝██╔════╝    ██╔════╝██╔══██╗██╔════╝ ██╔════╝
  //  ██╔████╔██║██║███████╗██║         █████╗  ██║  ██║██║  ███╗█████╗
  //  ██║╚██╔╝██║██║╚════██║██║         ██╔══╝  ██║  ██║██║   ██║██╔══╝
  //  ██║ ╚═╝ ██║██║███████║╚██████╗    ███████╗██████╔╝╚██████╔╝███████╗
  //  ╚═╝     ╚═╝╚═╝╚══════╝ ╚═════╝    ╚══════╝╚═════╝  ╚═════╝ ╚══════╝
  //
  //   ██████╗ █████╗ ███████╗███████╗███████╗    ██╗    ██╗    ██╗
  //  ██╔════╝██╔══██╗██╔════╝██╔════╝██╔════╝    ██║    ██║   ██╔╝
  //  ██║     ███████║███████╗█████╗  ███████╗    ██║ █╗ ██║  ██╔╝
  //  ██║     ██╔══██║╚════██║██╔══╝  ╚════██║    ██║███╗██║ ██╔╝
  //  ╚██████╗██║  ██║███████║███████╗███████║    ╚███╔███╔╝██╔╝
  //   ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝     ╚══╝╚══╝ ╚═╝
  //
  //  ███████╗███████╗██████╗ ██╗ █████╗ ██╗          █████╗ ██████╗  ██████╗ ███████╗
  //  ██╔════╝██╔════╝██╔══██╗██║██╔══██╗██║         ██╔══██╗██╔══██╗██╔════╝ ██╔════╝
  //  ███████╗█████╗  ██████╔╝██║███████║██║         ███████║██████╔╝██║  ███╗███████╗
  //  ╚════██║██╔══╝  ██╔══██╗██║██╔══██║██║         ██╔══██║██╔══██╗██║   ██║╚════██║
  //  ███████║███████╗██║  ██║██║██║  ██║███████╗    ██║  ██║██║  ██║╚██████╔╝███████║
  //  ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
  //
  //  ██╗   ██╗███████╗ █████╗  ██████╗ ███████╗
  //  ██║   ██║██╔════╝██╔══██╗██╔════╝ ██╔════╝
  //  ██║   ██║███████╗███████║██║  ███╗█████╗
  //  ██║   ██║╚════██║██╔══██║██║   ██║██╔══╝
  //  ╚██████╔╝███████║██║  ██║╚██████╔╝███████╗
  //   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
  //
  describe('and provide an INVALID argin via a serial command-line argument', function (){
    this.slow(1400);

    it('should terminate with an error', function (done){

      Process.executeCommand({
        dir: __dirname,
        command: 'node ./fixtures/script-expecting-one-optional-number-as-serial-arg.js sumthin',
        environmentVars: {},
        timeout: 1500
      }).exec(function (err,outs){
        if (err){
          try {
            assert.equal(err.code, 1);
          } catch (e) {
            return done(new Error('Expected process exit code to be 1, but got `'+err.code+'`.  Raw error from script: '+err.stack));
          }

          // --•
          return done();
        }

        // --•
        return done(new Error('Should have exited with a runtime validation error (because an INVALID argin was provided).  But instead, script exited with normal code 0 and returned: '+util.inspect(outs, {depth:null})));
      });
    });//</it>

  });//</describe :: and provide an INVALID argin via a serial command-line argument>


  describe('without providing a serial command-line argument, even though declared `args` point at a REQUIRED input def', function (){
    this.slow(1400);

    describe('and without specifying the required argin any other way', function (){

      it('should terminate with an error', function (done){
        Process.executeCommand({
          dir: __dirname,
          command: 'node ./fixtures/script-expecting-one-required-string-as-serial-arg.js',
          environmentVars: {},
          timeout: 1500
        }).exec(function (err,outs){
          if (err){
            try {
              assert.equal(err.code, 1);
            } catch (e) {
              return done(e);
            }
            return done();
          }

          return done(new Error('Should have exited with a runtime validation error (because a required argin was omitted).  But instead, script exited with normal code 0 and returned: '+util.inspect(outs, {depth:null})));
        });
      });//</it>

    });//</describe :: without specifying the required argin any other way>


    describe('but with a command-line option provided instead', function (){

      it('should work just like normal', function (done) {
        Process.executeCommand({
          dir: __dirname,
          command: 'node ./fixtures/script-expecting-one-required-string-as-serial-arg.js --something=\'sumthin\'',
          environmentVars: {},
          timeout: 1500
        }).exec(function (err,outs){
          if (err){ return done(err); }
          try {
            assert.equal(outs.stdout, 'got "sumthin"');
          } catch (e) { return done(e); }
          return done();
        });
      });//</it>

    });//</describe :: but with a command-line option provided instead>

    describe('but with an environment variable provided instead', function (){

      it('should work just like normal', function (done) {
        Process.executeCommand({
          dir: __dirname,
          command: '___something=\'sumthin\' node ./fixtures/script-expecting-one-required-string-as-serial-arg.js',
          environmentVars: {},
          timeout: 1500
        }).exec(function (err,outs){
          if (err){ return done(err); }
          try {
            assert.equal(outs.stdout, 'got "sumthin"');
          } catch (e) { return done(e); }
          return done();
        });
      });//</it>

    });//</describe :: but with an environment variable provided instead>

  });//</describe :: without providing a serial command-line argument, even though declared `args` point at a REQUIRED input def>


});//</describe :: running a script>
