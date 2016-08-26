/**
 * Module dependencies
 */

var assert = require('assert');
var Process = require('machinepack-process');




describe('running a script', function (){

  describe('that provides an argin via a serial command-line argument', function (){
    this.slow(1400);

    it('should not fail', function (done){

      Process.executeCommand({
        dir: __dirname,
        command: 'node ./fixtures/script-expecting-one-serial-arg.js something',
        environmentVars: {},
        timeout: 1500
      }).exec(function (err,outs){
        if (err){ return done(err); }
        assert.equal(outs.stdout, 'got "something"');
        return done();
      });
    });//</it>

  });//</describe>


  describe('that attempts to provide an argin via an UNEXPECTED serial command-line argument', function (){
    this.slow(1400);

    it('should terminate with an error', function (done){

      Process.executeCommand({
        dir: __dirname,
        command: 'node ./fixtures/script-with-no-output.js something',
        environmentVars: {},
        timeout: 1500
      }).exec(function (err,outs){
        if (err){
          // TODO: check err code (err.output.code is probably 1-- probably need to refine that a bit further in mp-process)
          console.warn('Got an error.  Was expecting it prbly, but just in case:',err);
          return done();
        }

        return done(new Error('Should have exited with an error (because unexpected serial args were provided)'));
      });
    });//</it>

  });//</describe>

});//</describe :: running a script>
