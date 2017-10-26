#!/usr/bin/env node

var whelk = require('../../');

//  ┌─┐┌─┐┬─┐┬┌─┐┌┬┐  ┌─┐─┐ ┬┌─┐┌─┐┌─┐┌┬┐┬┌┐┌┌─┐
//  └─┐│  ├┬┘│├─┘ │   ├┤ ┌┴┬┘├─┘├┤ │   │ │││││ ┬
//  └─┘└─┘┴└─┴┴   ┴   └─┘┴ └─┴  └─┘└─┘ ┴ ┴┘└┘└─┘
//  ┌─┐┌┐┌┌─┐  ╦═╗╔═╗╔═╗ ╦ ╦╦╦═╗╔═╗╔╦╗  ╔═╗╔╦╗╦═╗╦╔╗╔╔═╗
//  │ ││││├┤   ╠╦╝║╣ ║═╬╗║ ║║╠╦╝║╣  ║║  ╚═╗ ║ ╠╦╝║║║║║ ╦
//  └─┘┘└┘└─┘  ╩╚═╚═╝╚═╝╚╚═╝╩╩╚═╚═╝═╩╝  ╚═╝ ╩ ╩╚═╩╝╚╝╚═╝
//  ┌─┐┌─┐  ┌─┐┌─┐┬─┐┬┌─┐┬    ┌─┐┬─┐┌─┐
//  ├─┤└─┐  └─┐├┤ ├┬┘│├─┤│    ├─┤├┬┘│ ┬
//  ┴ ┴└─┘  └─┘└─┘┴└─┴┴ ┴┴─┘  ┴ ┴┴└─└─┘
whelk({
  args: ['something'],
  inputs: {
    something: { example: 'some string', required: true }
  },
  exits: {
    success: {
      outputExample: 'got "some string"'
    }
  },
  fn: function (inputs, exits){
    // console.log('GOT INPUTS:',require('util').inspect(inputs, {depth: null, colors: true}));
    return exits.success('got "'+inputs.something+'"');
  }
}).exec({
  success: function (outputMsg){
    process.stdout.write(outputMsg);
  }
});
