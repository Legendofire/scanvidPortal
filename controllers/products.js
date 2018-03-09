
let express = require('express');
let mongoose = require('mongoose');

let Product = require('./../model/products');


exports.getAllProducts = function(req, res, next) {
  var  datatablesQuery = require('datatables-query'),
       params = req.body,
       query = datatablesQuery(Product);
       // if(req.body.search.value){
       //   Product.find(
       //       { $text : { $search : req.body.search.value } },
       //       { score : { $meta: "textScore" } }
       //   )
       //   .sort({ score : { $meta : 'textScore' } })
       //   .exec(function(err, results) {
       //     var finalToSend={"draw":2,"recordsTotal":12676238,"recordsFiltered":6237376,"data":[{"title":results[0].title},{"title":results[1].title}]};
       //       res.json(finalToSend);
       //   });
       // }else {
             query.run(params).then(function (data) {
                 res.json(data);
             }, function (err) {
                 res.status(500).json(err);
             });
        //}
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
