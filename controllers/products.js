
let express = require('express');
let mongoose = require('mongoose');

let Product = require('./../model/products');


exports.getAllProducts = function(req, res, next) {
  // Product.find({brand: 'bosch', name: 'AL 1830 CV'}, function(err, value) {
  //   if (err) {
  //     res.json(err);
  //   } else {
  //     res.send(value);
  //   }
  // });
  var  datatablesQuery = require('datatables-query'),
       params = req.body,
       query = datatablesQuery(Product);

   query.run(params).then(function (data) {
       res.json(data);
   }, function (err) {
       res.status(500).json(err);
   });
};

// if(req.user.isBrand){
//   var where = {
//     brandName = req.user.brand;
//   }
// }else{
//
// }
