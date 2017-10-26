#!/usr/bin/env node

var whelk = require('../../');
var doSomething = require('machine')({
  identity: 'do-something',
  inputs: { numPets: { type: 'number' } },
  exits: {notFound:{}},
  fn: (inputs, exits)=>{
    setTimeout(function(){
      return exits.success();
    }, 60000);
  }
});

whelk({
  fn: function (inputs, exits) {

    doSomething({
      numPets: 'definitely not a number'
    }).exec((err)=>{
      if (err){ return exits.error(err); }
      return exits.success();
    });

  }
});
