/**
 * Module dependencies
 */

var assert = require('assert');
var Process = require('machinepack-process');




describe('running a script', function (){

  describe('that passes an empty machine def to `machine-as-script`', function (){

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
