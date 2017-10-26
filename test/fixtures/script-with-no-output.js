#!/usr/bin/env node

var whelk = require('../../');

//  ┌─┐┌─┐┬─┐┬┌─┐┌┬┐  ╦ ╦╦╔╦╗╦ ╦  ╔╗╔╔═╗  ╔═╗╦ ╦╔╦╗╔═╗╦ ╦╔╦╗
//  └─┐│  ├┬┘│├─┘ │   ║║║║ ║ ╠═╣  ║║║║ ║  ║ ║║ ║ ║ ╠═╝║ ║ ║
//  └─┘└─┘┴└─┴┴   ┴   ╚╩╝╩ ╩ ╩ ╩  ╝╚╝╚═╝  ╚═╝╚═╝ ╩ ╩  ╚═╝ ╩
whelk({
  exits: {
    success: {
      outputExample: ['blah blah']
    }
  },
  fn: function (inputs, exits){
    return exits.success();
  }
}).exec({
  success: function (output){
    process.stdout.write(JSON.stringify(output));
  }
});
