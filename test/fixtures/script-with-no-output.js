#!/usr/bin/env node

var whelk = require('../../');

//  ┌─┐┌─┐┬─┐┬┌─┐┌┬┐  ╦ ╦╦╔╦╗╦ ╦  ╔╗╔╔═╗  ╔═╗╦ ╦╔╦╗╔═╗╦ ╦╔╦╗
//  └─┐│  ├┬┘│├─┘ │   ║║║║ ║ ╠═╣  ║║║║ ║  ║ ║║ ║ ║ ╠═╝║ ║ ║
//  └─┘└─┘┴└─┴┴   ┴   ╚╩╝╩ ╩ ╩ ╩  ╝╚╝╚═╝  ╚═╝╚═╝ ╩ ╩  ╚═╝ ╩
whelk({
  useRawOutput: true,
  def: {
    friendlyName: __filename,
    exits: {
      success: {
        outputExample: ['blah blah']
      }
    },
    fn: function (inputs, exits){
      return exits.success();
    }
  }
});
