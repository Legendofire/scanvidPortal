let express = require("express");
let router = express.Router();

let Product = require("../../model/products");
var Brand = require("./../../model/brands.js");
var ProductController = require('./../../controllers/products.js');


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



router.get('/scanbarcode',function(req, res, next){////Barcode Search

  Product.findOne({ barcode:req.query.q })
            .limit(10).exec(function(err, docs) {
    if(err)console.log(err);
    var obj={};
    var tags=[];
    obj.title=docs.title;
    obj.barcode=docs.barcode;
    obj.brand=docs.brand;
    var patt = new RegExp("^(?:http(s)?:\/\/)?[\w.-]+");
    for(var i=0; i < docs.tags.length; i++){
      if (patt.test(docs.tags[i].value)) {
        tags.push(docs.tags[i]);
      }
    }
    obj.tags=tags;
    res.send(obj);


  });

router.get("/scanbarcode", function(req, res, next) {
  ////Barcode Search
  // Product.findOne({ barcode: req.query.q })
  //   .limit(10)
  //   .exec(function(err, docs) {
  //     if (err) console.log(err);
  //     var obj = {};
  //     var tags = [];
  //     obj.title = docs.title;
  //     obj.barcode = docs.barcode;
  //     obj.brand = docs.brand;
  //     var patt = new RegExp("^(?:http(s)?://)?[w.-]+");
  //     for (var i = 0; i < docs.tags.length; i++) {
  //       if (patt.test(docs.tags[i].value)) {
  //         tags.push(docs.tags[i]);
  //       }
  //     }
  //     obj.tags = tags;
  //     res.send(obj);
  //   });
});

router.get("/scantext", function(req, res, next) {
  ////Text Search   ////Edit only send the object
  // console.log(req.query);
  // Brand.find({})
  //   .exec()
  //   .then(function(brands) {
  //     var prom = [];
  //     brands.forEach(function(value) {
  //       prom.push(
  //         Product.findOne(
  //           { brand: value.brandName, $text: { $search: req.query.q } },
  //           { score: { $meta: "textScore" } }
  //         )
  //           .limit(10)
  //           .sort({ score: { $meta: "textScore" } })
  //       );
  //     });
  //     Promise.all(prom).then(function(docs) {
  //       var obj = {};
  //       var tags = [];
  //       obj.title = docs[0].title;
  //       obj.barcode = docs[0].barcode;
  //       obj.brand = docs[0].brand;
  //       var patt = new RegExp("^(?:http(s)?://)?[w.-]+");
  //       for (var i = 0; i < docs[0].tags.length; i++) {
  //         if (patt.test(docs[0].tags[i].value)) {
  //           tags.push(docs[0].tags[i]);
  //         }
  //       }
  //       obj.tags = tags;
  //       res.send(obj);
  //     });
  //   })
  //   .catch(function(err) {
  //     next(err);
  //     console.error(err);
  //   });
});

router.post('/analyzeVideo',function(req,res,next){
  req.api=true;
  ProductController.analyzeVideo(req,res,next);
});  /// product: barcode + video:video as form data

router.post('/analyzeVideoTest',function(req,res,next){
  req.api=true;
  var output={};
  var imgArr=[];
  var picsFolder='./public/tempFolder/';

     var bool=false;

     storage.getBuckets().then(results => {
         const buckets = results[0];
         //console.log('Buckets:');
         buckets.forEach(bucket => {
           if(bucket.name=='scanvid--videos--'+req.body.product){
             console.log('exisits');
             bool=true;
            // console.log('trying to upload video');

                 console.log(`trying to get images.`);
                   ffmpeg(req.body.video).frames(1000)
                     .on('filenames', function(filenames) {

                       for(var i=0;i<filenames.length;i++){
                         filenames[i]=req.body.product+(Math.random() * Math.floor(6192847129841))+'.png';
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
                               prom.push(storage .bucket('scanvid--images--'+req.body.product).upload(imgPath));


                             }
                             prom.push(storage.bucket('scanvid--images--'+req.body.product).makePublic({includeFiles:true}));
                             prom.push(storage.bucket('scanvid--videos--'+req.body.product).makePublic({includeFiles:true}));
                             Promise.all(prom).then(function(data){
                               console.log(data);
                               if(req.api){
                                 res.send({status:'200',comment:'Uploaded successfully'});
                               }else{
                                 res.redirect('products/view/'+req.body.product);
                               }

                             }).catch(function(err){
                               console.log(err);
                               if(req.api){
                                 res.send({status:'403',comment:err});
                               }else{
                                 res.redirect('products/view/'+req.body.product);
                               }
                             })

                     })
                     .screenshots({
                       // Will take screens at 20%, 40%, 60% and 80% of the video
                       count: 10,
                       folder: picsFolder
                     });

           }
         });
            });
});

module.exports = router;
