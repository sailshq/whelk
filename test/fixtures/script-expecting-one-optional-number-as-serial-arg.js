#!/usr/bin/env node

var asScript = require('../../');


//  ┌─┐┌─┐┬─┐┬┌─┐┌┬┐  ┌─┐─┐ ┬┌─┐┌─┐┌─┐┌┬┐┬┌┐┌┌─┐
//  └─┐│  ├┬┘│├─┘ │   ├┤ ┌┴┬┘├─┘├┤ │   │ │││││ ┬
//  └─┘└─┘┴└─┴┴   ┴   └─┘┴ └─┴  └─┘└─┘ ┴ ┴┘└┘└─┘
//  ┌─┐┌┐┌┌─┐  ╔═╗╔═╗╔╦╗╦╔═╗╔╗╔╔═╗╦    ╔╗╔╦ ╦╔╦╗╔╗ ╔═╗╦═╗
//  │ ││││├┤   ║ ║╠═╝ ║ ║║ ║║║║╠═╣║    ║║║║ ║║║║╠╩╗║╣ ╠╦╝
//  └─┘┘└┘└─┘  ╚═╝╩   ╩ ╩╚═╝╝╚╝╩ ╩╩═╝  ╝╚╝╚═╝╩ ╩╚═╝╚═╝╩╚═
//  ┌─┐┌─┐  ┌─┐┌─┐┬─┐┬┌─┐┬    ┌─┐┬─┐┌─┐
//  ├─┤└─┐  └─┐├┤ ├┬┘│├─┤│    ├─┤├┬┘│ ┬
//  ┴ ┴└─┘  └─┘└─┘┴└─┴┴ ┴┴─┘  ┴ ┴┴└─└─┘
asScript({
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
    var _ = require('lodash');

    if (_.isUndefined(inputs.highScore)) {
      return exits.success('No high score provided.  You must be bad at this game.');
    }

    // --•
    return exits.success('Provided high score is `'+inputs.highScore+'`.');
  }
}).exec({
  success: function (outputMsg){
    process.stdout.write(outputMsg);
  }
});
