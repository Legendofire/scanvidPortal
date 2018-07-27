var express = require('express');
var router = express.Router();

var auth = require('./../middleware/authentication.js');

const resource = 'Products';

var ProductController = require('./../controllers/products.js');

var Product = require('./../model/products.js');
var Brand = require('./../model/brands.js');


const Storage = require('@google-cloud/storage');
// Your Google Cloud Platform project ID
const projectId = 'API Project';

// Creates a client
const storage = new Storage({
  keyFilename: 'scanvid.json'
});

var Firestore = require('@google-cloud/firestore');
const firestore = new Firestore({
  projectId: "multicam-fe34a",
  keyFilename: "./config/multicam-fe34a.json"
})

const document = firestore.doc('ids/sWvWzogwzSjChGJQlOCq');


router.get('/', auth.adminLoggedIn, function(req, res, next) {
  if(req.session.user.isBrand){
    res.redirect('/brands/view/'+req.session.user.brandName);
  }else{
    let output = {
      'child': 'partials/products/table.ejs',
      'current_user': req.session.user
    }
    Brand.find({}).exec().then(function(brands){
      output.brands = brands;
      res.render('layout',output);
    });

  }
});

router.post('/video',ProductController.analyzeVideo);

router.post('/image', ProductController.uploadImage);

/* GET users listing. */
router.post('/add', auth.userLoggedIn, function(req, res, next) {
  var prod = new Product({
    title: req.body.title,
    barcode: req.body.barcode,
    brand: req.body.brand
  });

  prod.save(function(err){
    if (err) {
      res.json(err);
    }else{
      res.redirect('/products')
    }
  });
});

router.get('/view/:pid', auth.userLoggedIn, function(req, res, next) {
  var output = {
    child: 'partials/products/singleView.ejs',
    current_user: req.session.user
  };

  Product.findOne({barcode:req.params.pid}).exec().then(function(product){
    if(product){
      output.product = product;
      if(req.session.user.isBrand){
        if(req.session.user.brandName == product.brand){
          return storage.bucket('scanvid--images--'+req.params.pid).getFiles();
        }else{
          res.redirect('/brands/view/'+req.session.user.brandName);
          return;
        }
      }else{
          return storage.bucket('scanvid--images--'+req.params.pid).getFiles();
      }
    }else{
      console.error('barcode '+req.params.pid+' not found');
      res.redirect('/brands/view/'+req.session.user.brandName);
      return;
    }
  })
  .then(function(media){
    if(media[0]){
        var images=[];
        media[0].forEach(file=>{
          images.push('https://storage.googleapis.com/scanvid--images--'+req.params.pid+'/'+file.name);
        });
        output.imageFiles=images;
      }
    return storage.bucket('scanvid--videos--'+req.params.pid).getFiles();

  })
  .then(function(media){
    if(media[0]){
        var videos=[];
        media[0].forEach(file=>{
          videos.push('https://storage.googleapis.com/scanvid--videos--'+req.params.pid+'/'+file.name);
        });
        output.videoFiles=videos;
      }
      console.log(output);
    res.render('layout', output);
  })
  .catch(function(err){
    console.trace(err);
    console.log('gg')
    res.render('layout', output);

  })
});

router.get('/edit/:pid', auth.userLoggedIn, function(req, res, next) {
  var output = {
    child: 'partials/products/edit.ejs',
    current_user: req.session.user
  };
  Product.findOne({barcode:req.params.pid}).exec().then(function(product){
    if(product){
      output.product = product;
      if(req.session.user.isBrand){
        if(req.session.user.brandName == product.brand){
          output.product = product;
          output.tags = product.tags;
          return Brand.find({}).exec();
        }else{
          res.redirect('/brands/view/'+req.session.user.brandName);
          return;
        }
      }else{
        output.product = product;
        output.tags = product.tags;
        return Brand.find({}).exec();
      }
    }else{
      console.error('barcode '+req.params.pid+' not found');
      res.redirect('/brands/view/'+req.session.user.brandName);
      return;
    }
  }).then(function(brands){
    output.brands = brands
    res.render('layout',output);
  });
});

router.post('/edit/:pid', auth.userLoggedIn, function(req, res, next) {
  Product.findOne({barcode:req.params.pid}).exec().then(function(product){
    if(!req.session.user.isBrand || req.session.user.brandName == product.brand){
      if(req.body.title) product.title = req.body.title;
      if(req.body.barcode) product.barcode = req.body.barcode;
      if(req.body.brand && !req.session.user.isBrand) product.brand = req.body.brand;
      if(req.body.tags) product.tags = JSON.parse(req.body.tags);
      console.log(JSON.parse(req.body.tags));
      product.save(function(value, err){
        if (err) console.error(err);
        res.redirect('/products/view/' + req.params.pid);
      });
    }else{
      res.redirect('/brands/view/' + req.session.user.brandName);
    }
  });
});

router.get('/pushToFirebase/:pid', auth.userLoggedIn, function(req, res, next) {
  document.get().then(doc=>{
    let idArray = doc.get("id");
    idArray.push(req.params.pid);
    document.update(
      { id:idArray},
      { merge: true}
    ).then(doc=>{
      res.redirect('/products/view/' + req.params.pid);
    }).catch((err)=>{
      console.log(err);
    })
  })
});

module.exports = router;
