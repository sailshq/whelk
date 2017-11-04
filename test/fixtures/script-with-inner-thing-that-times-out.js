#!/usr/bin/env node

var whelk = require('../../');
var doSomethingThatTakesTooLong = require('machine')({
  identity: 'do-something-that-takes-too-long',
  timeout: 2000,
  inputs: { numPets: { type: 'number' } },
  exits: {notFound:{}},
  fn: function (inputs, exits) {
    setTimeout(function(){
      return exits.success();
    }, 60000);
  }
});

whelk({
  friendlyName: __filename,
  fn: function (inputs, exits) {

    doSomethingThatTakesTooLong().exec(function (err){
      if (err){ return exits.error(err); }
      return exits.success();
    });

  }
});
