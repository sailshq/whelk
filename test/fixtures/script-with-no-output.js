#!/usr/bin/env node

var asScript = require('../../');

//  ┌─┐┌─┐┬─┐┬┌─┐┌┬┐  ╦ ╦╦╔╦╗╦ ╦  ╔╗╔╔═╗  ╔═╗╦ ╦╔╦╗╔═╗╦ ╦╔╦╗
//  └─┐│  ├┬┘│├─┘ │   ║║║║ ║ ╠═╣  ║║║║ ║  ║ ║║ ║ ║ ╠═╝║ ║ ║
//  └─┘└─┘┴└─┴┴   ┴   ╚╩╝╩ ╩ ╩ ╩  ╝╚╝╚═╝  ╚═╝╚═╝ ╩ ╩  ╚═╝ ╩
asScript({
  exits: {
    success: {
      outputExample: ['blah blah']
    }
  },
  fn: function (inputs, exits){
    // console.log('GOT INPUTS:',require('util').inspect(inputs, {depth: null, colors: true}));
    return exits.success();
  }
}).exec({
  success: function (output){
    process.stdout.write(JSON.stringify(output));
  }
});
