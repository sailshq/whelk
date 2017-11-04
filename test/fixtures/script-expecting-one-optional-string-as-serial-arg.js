#!/usr/bin/env node

var whelk = require('../../');

//  ┌─┐┌─┐┬─┐┬┌─┐┌┬┐  ┌─┐─┐ ┬┌─┐┌─┐┌─┐┌┬┐┬┌┐┌┌─┐
//  └─┐│  ├┬┘│├─┘ │   ├┤ ┌┴┬┘├─┘├┤ │   │ │││││ ┬
//  └─┘└─┘┴└─┴┴   ┴   └─┘┴ └─┴  └─┘└─┘ ┴ ┴┘└┘└─┘
//  ┌─┐┌┐┌┌─┐  ╔═╗╔═╗╔╦╗╦╔═╗╔╗╔╔═╗╦    ╔═╗╔╦╗╦═╗╦╔╗╔╔═╗
//  │ ││││├┤   ║ ║╠═╝ ║ ║║ ║║║║╠═╣║    ╚═╗ ║ ╠╦╝║║║║║ ╦
//  └─┘┘└┘└─┘  ╚═╝╩   ╩ ╩╚═╝╝╚╝╩ ╩╩═╝  ╚═╝ ╩ ╩╚═╩╝╚╝╚═╝
//  ┌─┐┌─┐  ┌─┐┌─┐┬─┐┬┌─┐┬    ┌─┐┬─┐┌─┐
//  ├─┤└─┐  └─┐├┤ ├┬┘│├─┤│    ├─┤├┬┘│ ┬
//  ┴ ┴└─┘  └─┘└─┘┴└─┴┴ ┴┴─┘  ┴ ┴┴└─└─┘
whelk({
  useRawOutput: true,
  def: {
    friendlyName: __filename,
    args: ['something'],
    inputs: {
      something: { example: 'some string'}
    },
    exits: {
      success: {
        outputExample: 'got "some string"'
      }
    },
    fn: function (inputs, exits){
      var _ = require('@sailshq/lodash');

      if (_.isUndefined(inputs.something)) {
        return exits.success('Nothing was provided!  Can\'t I have something?');
      }

      // --•
      return exits.success('got "'+inputs.something+'"');
    }
  }
});
