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
exports.getAllNew=function(req,res,next){
  if(req.session.user){
     if(req.session.user.isBrand){
         Product.paginate({brand:req.session.user.brandName}, { page:1,limit: 10 }, function(err, result) {
         res.json(result);
       });
     }
  }else{
      if(req.query.page){
          Product.paginate({}, { page:req.query.page,limit: 10 }, function(err, result) {
          res.json(result);
        });
      }else{
        Product.paginate({}, { page:1,limit: 10 }, function(err, result) {
        res.json(result);
      });
    }
  }
}

exports.searchDb=function(req,res,next){
  if(req.session.user){
     if(req.session.user.isBrand){
       Product.find(
           { brand :req.session.user.brandName, $text : { $search : req.query.q } },
           { score : { $meta: "textScore" } }
       )
       .limit(20)
       .sort({ score : { $meta : 'textScore' } })
       .exec(function(err, results) {
           res.json(results);
       });
     }
  }else{
  
      Product.find(
          { brand:"unknown",$text : { $search : req.query.q } },
          { score : { $meta: "textScore" } }
      )
      .limit(20)
      .sort({ score : { $meta : 'textScore' } })
      .exec(function(err, results) {
          res.json(results);
      });
  }
};




// if(req.user.isBrand){
//   var where = {
//     brandName = req.user.brand;
//   }
// }else{
//
// }
