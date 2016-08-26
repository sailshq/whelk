#!/usr/bin/env node

 // wha_someRequiredString='3' wha_someRequiredJSON='[]' node test/sample-script.js

var asScript = require('../../');

//  ╔═╗╔═╗╔╦╗╔═╗╦  ╔═╗  ╔═╗╔═╗╦═╗╦╔═╗╔╦╗
//  ╚═╗╠═╣║║║╠═╝║  ║╣   ╚═╗║  ╠╦╝║╠═╝ ║
//  ╚═╝╩ ╩╩ ╩╩  ╩═╝╚═╝  ╚═╝╚═╝╩╚═╩╩   ╩
//  ┌─    ┌┐ ┬ ┬┌┐┌┌─┐┬ ┬  ┌─┐┌─┐  ┌┬┐┬┌─┐┌─┐┌─┐┬─┐┌─┐┌┐┌┌┬┐  ┌─┐┌┬┐┬ ┬┌─┐┌─┐
//  │───  ├┴┐│ │││││  ├─┤  │ │├┤    │││├┤ ├┤ ├┤ ├┬┘├┤ │││ │   └─┐ │ │ │├┤ ├┤
//  └─    └─┘└─┘┘└┘└─┘┴ ┴  └─┘└    ─┴┘┴└  └  └─┘┴└─└─┘┘└┘ ┴   └─┘ ┴ └─┘└  └┘
//  ┬┌┐┌┌─┐┬  ┬ ┬┌┬┐┬┌┐┌┌─┐  ┌─┐┌┐┌  ┌─┐┌┐┌┬  ┬  ┬  ┬┌─┐┬─┐  ┌┐┌┌─┐┌┬┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐    ─┐
//  │││││  │  │ │ │││││││ ┬  ├─┤│││  ├┤ │││└┐┌┘  └┐┌┘├─┤├┬┘  │││├─┤│││├┤ └─┐├─┘├─┤│  ├┤   ───│
//  ┴┘└┘└─┘┴─┘└─┘─┴┘┴┘└┘└─┘  ┴ ┴┘└┘  └─┘┘└┘ └┘    └┘ ┴ ┴┴└─  ┘└┘┴ ┴┴ ┴└─┘└─┘┴  ┴ ┴└─┘└─┘    ─┘
asScript({

  envVarNamespace: 'wha_',
  machine: {
    inputs: {
      someRequiredString: { example: 'some string', required: true },
      someOptionalString: { example: 'some string' },
      someRequiredJSON: { example: '*', required: true },
      someOptionalJSON: { example: '*' },
    },
    exits: {
      success: {
        example: 'blah blah'
      }
    },
    fn: function (inputs, exits){
      // console.log('GOT INPUTS:',require('util').inspect(inputs, {depth: null, colors: true}));
      return exits.success('it worked');
    }
  }
}).exec({
  success: function (outputMsg){
    process.stdout.write(outputMsg);
  }
});
