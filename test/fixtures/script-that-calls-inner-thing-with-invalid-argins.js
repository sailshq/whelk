#!/usr/bin/env node

var whelk = require('../../');
var doSomething = require('machine')({
  identity: 'do-something',
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

    doSomething({
      numPets: 'definitely not a number'
    }).exec(function(err){
      if (err){ return exits.error(err); }
      return exits.success();
    });

  }
});
