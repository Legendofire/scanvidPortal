var express = require('express');
var router = express.Router();

var auth = require('./../middleware/authentication.js');

const resource = 'Products';

var Product = require('./../model/product.js');

/* GET users listing. */
router.post('/add', auth.userLoggedIn, function(req, res, next) {
  var prod = new Product({
    name: req.body.name,
    description: req.body.description
  });

  prod.save(function(err){
    if (err) {
      res.json(err);
    }else{
      res.redirect('/products')
    }
  });
});

router.get('/', auth.userLoggedIn, function(req, res, next) {
  var output = {
    child: 'partials/products/table.ejs',
    current_user: req.session.user
  };

  Product.find({},function(err,value){
    if (err) {
      res.json(err);
    }else{
      output.products = value;
      res.render('layout', output);
    }

  });
});

router.get('/view/:pid', auth.userLoggedIn, function(req, res, next) {
  var output = {
    child: 'partials/products/view.ejs',
    current_user: req.session.user
  };
  Product.findOne({_id:req.params.pid},function(err,value){
    if (err) console.error(err);
    output.product = value;
    res.render('layout', output);
  });
});

router.get('/edit/:pid', auth.userLoggedIn, function(req, res, next) {
  Product.findOne({_id:req.params.pid}).exec().then(function(value,err){
    if(err)console.error(err);
    var output = {
      child: 'partials/products/edit.ejs',
      current_user: req.session.user,
      product: value
    };
    res.render('layout',output);
  });
});

router.post('/edit/:pid', auth.userLoggedIn, function(req, res, next) {
  Product.findOne({_id:req.params.pid}).exec().then(function(product, err){
    if(err) console.error(err);
    if(req.body.name) product.name = req.body.name;
    if(req.body.description) product.description = req.body.description;
    product.save(function(value, err){
      if (err) console.error(err);
      res.redirect('/products/view/' + req.params.pid);
    });
  });
});

module.exports = router;
