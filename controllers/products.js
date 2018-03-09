let express = require('express');
let mongoose = require('mongoose');

let Product = require('./../model/products');


exports.getAllProducts = function(req, res, next) {
  var  datatablesQuery = require('datatables-query'),
       params = req.body,
       query = datatablesQuery(Product);

      if(req.session.user){
         if(req.session.user.isBrand){
         params.search.value=req.session.user.brandName;

         }
      }

             query.run(params).then(function (data) {
                 res.json(data);
             }, function (err) {
                 res.status(500).json(err);
             });

};
exports.getAllUnknown = function(req, res, next) { //not working
  console.log("hi");
      Product.find({brand:"unknown"})
      .exec(function(err, results) {
        console.log("done");
          res.json(results);
      });
};

exports.tryIndexed=function(req,res,next){
  Product.find(
      { $text : { $search : "PBH" } },
      { score : { $meta: "textScore" } }
  )
  .sort({ score : { $meta : 'textScore' } })
  .exec(function(err, results) {
      res.json(results);
  });
};




// if(req.user.isBrand){
//   var where = {
//     brandName = req.user.brand;
//   }
// }else{
//
// }
