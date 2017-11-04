#!/usr/bin/env node

var whelk = require('../../');


//  ┌─┐┌─┐┬─┐┬┌─┐┌┬┐  ┌─┐─┐ ┬┌─┐┌─┐┌─┐┌┬┐┬┌┐┌┌─┐
//  └─┐│  ├┬┘│├─┘ │   ├┤ ┌┴┬┘├─┘├┤ │   │ │││││ ┬
//  └─┘└─┘┴└─┴┴   ┴   └─┘┴ └─┴  └─┘└─┘ ┴ ┴┘└┘└─┘
//  ┌─┐┌┐┌┌─┐  ╔═╗╔═╗╔╦╗╦╔═╗╔╗╔╔═╗╦    ╔╗╔╦ ╦╔╦╗╔╗ ╔═╗╦═╗
//  │ ││││├┤   ║ ║╠═╝ ║ ║║ ║║║║╠═╣║    ║║║║ ║║║║╠╩╗║╣ ╠╦╝
//  └─┘┘└┘└─┘  ╚═╝╩   ╩ ╩╚═╝╝╚╝╩ ╩╩═╝  ╝╚╝╚═╝╩ ╩╚═╝╚═╝╩╚═
//  ┌─┐┌─┐  ┌─┐┌─┐┬─┐┬┌─┐┬    ┌─┐┬─┐┌─┐
//  ├─┤└─┐  └─┐├┤ ├┬┘│├─┤│    ├─┤├┬┘│ ┬
//  ┴ ┴└─┘  └─┘└─┘┴└─┴┴ ┴┴─┘  ┴ ┴┴└─└─┘
whelk({
  useRawOutput: true,
  def: {
    friendlyName: __filename,
    args: ['highScore'],
    inputs: {
      highScore: { example: 1234 }
    },
    exits: {
      success: {
        outputExample: 'Provided high score is `1234`.'
      }
    },
    fn: function (inputs, exits){
      var _ = require('@sailshq/lodash');

      if (_.isUndefined(inputs.highScore)) {
        return exits.success('No high score provided.  You must be bad at this game.');
      }

      // --•
      return exits.success('Provided high score is `'+inputs.highScore+'`.');
    }
  }
});
