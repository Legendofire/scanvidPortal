
let express = require('express');
let mongoose = require('mongoose');

let Product = require('./../model/products');


exports.getAllProducts = function(req, res, next) {
  Product.find({brand: 'bosch', name: 'AL 1830 CV'}, function(err, value) {
    if (err) {
      res.json(err);
    } else {
      res.send(value);
    }
  });
};

// if(req.user.isBrand){
//   var where = {
//     brandName = req.user.brand;
//   }
// }else{
//
// }
