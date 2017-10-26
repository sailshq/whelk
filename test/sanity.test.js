/**
 * Module dependencies
 */

var assert = require('assert');
var Process = require('machinepack-process');




describe('running a script', function (){

  describe('that passes an empty machine def to `whelk`', function (){
    this.slow(1400);

    it('should not fail', function (done){

      Process.executeCommand({
        dir: __dirname,
        command: 'node ./fixtures/sample-script.js --someRequiredString=hello --someRequiredJSON=\'{"x":40,"y":-79}\'',
        environmentVars: {},
        timeout: 1500
      }).exec(function (err,outs){
        if (err){ return done(err); }
        assert.equal(outs.stdout, 'it worked');
        return done();
      });
    });//</it>

  });//</describe>
});//</describe>





describe('running a script', function (){

  describe('that passes a machine def w/ an outputExample, but no actual runtime output, to `whelk`', function (){
    this.slow(1400);

    it('should not fail, and should return nothing (which ends up meaning empty string for our purposes here)', function (done){

      Process.executeCommand({
        dir: __dirname,
        command: 'node ./fixtures/script-with-no-output.js',
        environmentVars: {},
        timeout: 1500
      }).exec(function (err,outs){
        if (err){ return done(err); }
        try { assert.equal(outs.stdout, ''); }
        catch (e) { return done(e); }
        return done();
      });
    });//</it>

  });//</describe>
});//</describe>
