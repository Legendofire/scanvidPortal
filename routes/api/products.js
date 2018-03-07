var express = require('express');
var router = express.Router();

const resource = 'Products';

var auth = require('./../../middleware/api/auth.js');

var Product = require('./../../model/product.js');

// Add a Products
router.post('/', auth.userLoggedWithAccessTo(resource,'Add'), function(req, res, next) {
  var prod = new Product({
    name: req.body.name,
    description: req.body.description
  });

  prod.save(function(err){
    if (err) {
      res.status(500).json(err);
    }else{
      res.status(200).json({
        Message: 'Resource Added Successfully'
      });
    }
  });
});
//Edit a Product
router.put('/:id', auth.userLoggedWithAccessTo(resource,'Edit'), function(req, res, next) {
  var prod = {};
  if(req.body.name) prod.name = req.body.name;
  if(req.body.description) prod.description = req.body.description;

  Product.update({'_id':req.params.id}, prod, {}, function(err){
    if (err) {
      res.json(err);
    }else{
      res.json({status:200})
    }
  });
});
//Get All Products
router.get('/', auth.userLoggedWithAccessTo(resource,'ViewAll'), function(req, res, next) {
  Product.find({},function(err,value){
    if (err) {
      res.status(500).json(err);
    }else{
      res.status(200).json({
        data : value
      });
    }
  });
});
//Get A Product
router.get('/:id', auth.userLoggedWithAccessTo(resource,'View'), function(req, res, next) {
  Product.findOne({_id:req.params.pid},function(err,prod){
    if (err) res.status(500).json(err);
    Prospect.find({product:req.params.pid},function(err,pros){
      prod.prospects = pros;
      res.status(200).json({
        data : prod
      });
    });
  });
});
// //Delete A Product
// router.delete('/:id', auth.userLoggedWithAccessTo(resource,'Delete'), function(req, res, next) {
//   Product.find({'_id':req.params.id}).remove(function(err,value){
//     if (err) {
//       res.json(err);
//     }else{
//       res.json({status:200})
//     }
//   });
// });
module.exports = router;
