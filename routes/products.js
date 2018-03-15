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

const ffmpeg = require('easy-ffmpeg')
var formidable = require('formidable');
const Multer = require('multer');
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 300 * 1024 * 1024 // no larger than 300mb
  }
});
var fs = require('fs');

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

router.post('/video',auth.userLoggedIn,function(req,res,next){
  if (req.session.user) {
    var output={};
    var imgArr=[];
    var picsFolder='./public/tempFolder/';
      var form = new formidable.IncomingForm();
     form.parse(req, function (err, fields, files) {
       var bool=false;
       const options = {
        metadata: {
          contentType: files.video.type,
        },
      }
       storage.getBuckets().then(results => {
           const buckets = results[0];
           //console.log('Buckets:');
           buckets.forEach(bucket => {
             if(bucket.name=='scanvid--videos--'+fields.product){
               console.log('exisits');
               bool=true;
               console.log('trying to upload video');
               storage
                 .bucket('scanvid--videos--'+fields.product)
                 .upload(files.video.path,options)
                 .then(() => {
                   console.log(`uploaded.`);
                     ffmpeg(files.video.path).frames(1000)
                       .on('filenames', function(filenames) {

                         for(var i=0;i<filenames.length;i++){
                           filenames[i]=fields.product+(Math.random() * Math.floor(6192847129841))+'.png';
                         }
                         imgArr=filenames;
                         console.log('Will generate ' + filenames.join(', '))
                       })
                       .on('data',function(data){
                         console.log(data);
                       })
                       .on('end', function() {
                         console.log('screenshots taken');
                         var prom=[];

                               for(var i=0;i<imgArr.length;i++){
                                 var imgPath=picsFolder+imgArr[i];
                                 prom.push(storage .bucket('scanvid--images--'+fields.product).upload(imgPath));


                               }
                               prom.push(storage.bucket('scanvid--images--'+fields.product).makePublic({includeFiles:true}));
                               prom.push(storage.bucket('scanvid--videos--'+fields.product).makePublic({includeFiles:true}));
                               Promise.all(prom).then(function(data){
                                 console.log(data);
                                 res.redirect('/view/'+fields.product);

                               }).catch(function(err){
                                 console.log(err);
                                 res.redirect('/view/'+fields.product);
                               })

                       })
                       .screenshots({
                         // Will take screens at 20%, 40%, 60% and 80% of the video
                         count: 10,
                         folder: picsFolder
                       });
                 })
                 .catch(err => {
                   console.error('ERROR:', err);
                   res.redirect('/view/'+fields.product);
                 });
             }
           });
           if(!bool){
               storage.createBucket('scanvid--videos--'+fields.product).then(() => {
                   console.log('created new bucket');
                   bool=true;
                   console.log(`Bucket ${fields.product} created.`);
                           console.log('trying to upload video');
                           storage
                             .bucket('scanvid--videos--'+fields.product)
                             .upload(files.video.path,options)
                             .then(() => {
                               console.log(`uploaded.`);

                                   ffmpeg(files.video.path).frames(1000)
                                     .on('filenames', function(filenames) {

                                       for(var i=0;i<filenames.length;i++){
                                         filenames[i]=fields.product+(Math.random() * Math.floor(6192847129841))+'.png';
                                       }
                                       imgArr=filenames;
                                       console.log('Will generate ' + filenames.join(', '))
                                     })
                                     .on('data',function(data){
                                       console.log(data);
                                     })
                                     .on('end', function() {
                                       console.log('screenshots taken');
                                       var prom=[];
                                        storage.createBucket('scanvid--images--'+fields.product).then(() => {
                                             for(var i=0;i<imgArr.length;i++){
                                               var imgPath=picsFolder+imgArr[i];
                                               prom.push(storage .bucket('scanvid--images--'+fields.product).upload(imgPath));


                                             }
                                             prom.push(storage.bucket('scanvid--images--'+fields.product).makePublic({includeFiles:true}));
                                             prom.push(storage.bucket('scanvid--videos--'+fields.product).makePublic({includeFiles:true}));
                                             Promise.all(prom).then(function(data){
                                               console.log(data);
                                              res.redirect('/view/'+fields.product);

                                             }).catch(function(err){
                                               console.log(err);
                                               res.redirect('/view/'+fields.product);
                                             })
                                         })

                                     })
                                     .screenshots({
                                       // Will take screens at 20%, 40%, 60% and 80% of the video
                                       count: 10,
                                       folder: picsFolder
                                     });

                             })
                             .catch(err => {
                               console.error('ERROR:', err);
                               res.redirect('/view/'+fields.product);
                             });

                 })
                 .catch(err => {
                   console.error('ERROR:', err);
                   res.redirect('/view/'+fields.product);
                 });
               }
           })



      });


  }
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

      product.save(function(value, err){
        if (err) console.error(err);
        res.redirect('/products/view/' + req.params.pid);
      });
    }else{
      res.redirect('/brands/view/' + req.session.user.brandName);
    }
  });
});

module.exports = router;
