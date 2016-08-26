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
  error: function (err) {
    console.log('ERROR WATCH OUT:',err);
    console.log('process.exitCode is :',process.exitCode);
    // process.exit(1);
  },
  success: function (output){
    console.log('WAAAAAA');
    // process.stdout.write(JSON.stringify(output));
  }
});
