 // wha_someRequiredString='3' wha_someRequiredJSON='[]' node test/sample-script.js

require('../')({

  envVarNamespace: 'wha_',
  machine: {
    inputs: {
      someRequiredString: { example: 'some string', required: true },
      someOptionalString: { example: 'some string' },
      someRequiredJSON: { example: '*', required: true },
      someOptionalJSON: { example: '*' },
    },
    fn: function (inputs, exits){
      console.log('GOT INPUTS:',require('util').inspect(inputs, {depth: null, colors: true}));
      return exits.success();
    }
  }
}).exec();
