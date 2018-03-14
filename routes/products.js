var express = require('express');
var router = express.Router();

var auth = require('./../middleware/authentication.js');

const resource = 'Products';

var Product = require('./../model/products.js');
var Brand = require('./../model/brands.js');

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
  var trialProductBarcode='3165140606585';
  var output = {
    child: 'partials/products/singleView.ejs',
    current_user: req.session.user
  };

  Product.findOne({barcode:trialProductBarcode}).exec().then(function(product){
    output.product = product;

    return storage.bucket('scanvid--'+trialProductBarcode).getFiles();
  })
  .then(function(media){
    var images=[];
    media[0].forEach(file=>{
      images.push('https://storage.googleapis.com/scanvid--'+trialProductBarcode+'/'+file.name);
    });
    output.imageFiles=images;

    res.render('layout', output);
  })
  .catch(function(err){
    console.trace(err);
  })
});


router.get('/view/:pid', auth.userLoggedIn, function(req, res, next) {
  var output = {
    child: 'partials/products/singleView.ejs',
    current_user: req.session.user
  };

  Product.findOne({barcode:req.params.pid}).exec().then(function(product){
    output.product = product;

    return storage.bucket('scanvid--'+req.params.pid).getFiles();
  })
  .then(function(media){
    if(media[0]){
        var images=[];
        media[0].forEach(file=>{
          images.push('https://storage.googleapis.com/scanvid--'+req.params.pid+'/'+file.name);
        });
        output.imageFiles=images;
      }

    res.render('layout', output);
  })
  .catch(function(err){
    console.trace(err);
    res.render('layout', output);

  })
});

router.get('/edit/:pid', auth.userLoggedIn, function(req, res, next) {
  var output = {
    child: 'partials/products/edit.ejs',
    current_user: req.session.user
  };
  Product.findOne({barcode:req.params.pid}).exec().then(function(value){
    output.product = value;
    return Brand.find({}).exec();
  }).then(function(brands){
    output.brands = brands
    res.render('layout',output);
  });
});

router.post('/edit/:pid', auth.userLoggedIn, function(req, res, next) {
  Product.findOne({barcode:req.params.pid}).exec().then(function(product){
    if(req.body.title) product.title = req.body.title;
    if(req.body.barcode) product.barcode = req.body.barcode;
    if(req.body.brand && !req.session.user.isBrand) product.brand = req.body.brand;
    var tags = {};
    if(req.body.category1) tags.category1 = req.body.category1;
    if(req.body.category2) tags.category2 = req.body.category2;
    if(req.body.manual) tags.manual = req.body.manual;
    if(req.body.image) tags.image = req.body.image;
    if(tags.length>0){
      product.tags = tags;
    }

    product.save(function(value, err){
      if (err) console.error(err);
      res.redirect('/products/view/' + req.params.pid);
    });
  });
});

module.exports = router;
