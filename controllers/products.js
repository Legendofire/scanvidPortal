var express = require('express');
var mongoose = require('mongoose');

var Product = require('./../model/products');


exports.getAllProducts = function(req,res,next) {
  
  Product.find({brand:'bosch',name:'AL 1830 CV'},function(err,value){
    if (err) {
      res.json(err);
    }else{
      res.send(value);
    }

  });

}
