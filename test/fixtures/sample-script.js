#!/usr/bin/env node

 // wha_someRequiredString='3' wha_someRequiredJSON='[]' node test/sample-script.js

var whelk = require('../../');

//  ╔═╗╔═╗╔╦╗╔═╗╦  ╔═╗  ╔═╗╔═╗╦═╗╦╔═╗╔╦╗
//  ╚═╗╠═╣║║║╠═╝║  ║╣   ╚═╗║  ╠╦╝║╠═╝ ║
//  ╚═╝╩ ╩╩ ╩╩  ╩═╝╚═╝  ╚═╝╚═╝╩╚═╩╩   ╩
//  ┌─    ┌┐ ┬ ┬┌┐┌┌─┐┬ ┬  ┌─┐┌─┐  ┌┬┐┬┌─┐┌─┐┌─┐┬─┐┌─┐┌┐┌┌┬┐  ┌─┐┌┬┐┬ ┬┌─┐┌─┐
//  │───  ├┴┐│ │││││  ├─┤  │ │├┤    │││├┤ ├┤ ├┤ ├┬┘├┤ │││ │   └─┐ │ │ │├┤ ├┤
//  └─    └─┘└─┘┘└┘└─┘┴ ┴  └─┘└    ─┴┘┴└  └  └─┘┴└─└─┘┘└┘ ┴   └─┘ ┴ └─┘└  └┘
//  ┬┌┐┌┌─┐┬  ┬ ┬┌┬┐┬┌┐┌┌─┐  ┌─┐┌┐┌  ┌─┐┌┐┌┬  ┬  ┬  ┬┌─┐┬─┐  ┌┐┌┌─┐┌┬┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐    ─┐
//  │││││  │  │ │ │││││││ ┬  ├─┤│││  ├┤ │││└┐┌┘  └┐┌┘├─┤├┬┘  │││├─┤│││├┤ └─┐├─┘├─┤│  ├┤   ───│
//  ┴┘└┘└─┘┴─┘└─┘─┴┘┴┘└┘└─┘  ┴ ┴┘└┘  └─┘┘└┘ └┘    └┘ ┴ ┴┴└─  ┘└┘┴ ┴┴ ┴└─┘└─┘┴  ┴ ┴└─┘└─┘    ─┘
whelk({
  useRawOutput: true,
  envVarNamespace: 'wha_',
  def: {
    friendlyName: __filename,
    inputs: {
      someRequiredString: { example: 'some string', required: true },
      someOptionalString: { example: 'some string' },
      someRequiredJSON: { example: '*', required: true },
      someOptionalJSON: { example: '*' },
    },
    exits: {
      success: {
        outputExample: 'blah blah'
      }
    },
    fn: function (inputs, exits){
      // console.log('GOT INPUTS:',require('util').inspect(inputs, {depth: null, colors: true}));
      return exits.success('it worked');
    }
  }
});
