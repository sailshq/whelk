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
    throw new Error('whatever');
    return exits.success();
  }
}).exec({
  success: function (output){
    console.log('WAAAAAA');
    // process.stdout.write(JSON.stringify(output));
  }
});
