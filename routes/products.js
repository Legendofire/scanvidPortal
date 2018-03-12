var express = require('express');
var router = express.Router();

var auth = require('./../middleware/authentication.js');

const resource = 'Products';

var Product = require('./../model/products.js');

const Storage = require('@google-cloud/storage');
// Your Google Cloud Platform project ID
const projectId = 'API Project';

// Creates a client
const storage = new Storage({
  keyFilename: 'scanvid.json'
});

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
  //res.json({Message: 'Don\'t ever do that'});
  var trialProductBarcode='3165140606585';
  var output = {
    child: 'partials/products/singleView.ejs',
    current_user: req.session.user
  };
  //get files
  // storage.bucket('scanvid--'+trialProductBarcode).getFiles()
  //   .then(results => {
  //     const files = results[0];
  //
  //
  //     output.imageFiles = files;
  //     files.forEach(file => {
  //       console.log(file.name);
  //     });
  //   })
  //   .catch(err => {
  //     console.error('ERROR:', err);
  //   });

    var prom=[];
    prom.push(storage.bucket('scanvid--'+trialProductBarcode).getFiles());
    prom.push(Product.find({barcode:trialProductBarcode}));

      Promise.all(prom).then(function(docs) {
        var images=[];
          docs[0][0].forEach(file=>{
            images.push('https://storage.googleapis.com/scanvid--'+trialProductBarcode+'/'+file.name);
          });
        output.imageFiles=images;
        output.products=docs[1];
      console.log(output);
      res.render('layout', output);
    });

  // Product.find({barcode:trialProductBarcode},function(err,value){
  //   if (err) {
  //     res.json(err);
  //   }else{
  //
  //     output.products = value;
  //     console.log(output);
  //     res.render('layout', output);
  //   }
  //
  // });
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
