let express = require("express");
let router = express.Router();
let fs = require("fs");
const Storage = require("@google-cloud/storage");

let Product = require("../../model/products");
let Brand = require("./../../model/brands.js");
let apiKey = require("./../../model/apiKeys");
let ProductController = require("./../../controllers/products.js");
let authentication = require("./../../middleware/api/auth");

// Your Google Cloud Platform project ID
const projectId = "API Project";

// Creates a client
const storage = new Storage({
  keyFilename: "scanvid.json"
});

const ffmpeg = require("easy-ffmpeg");
var formidable = require("formidable");
const Multer = require("multer");
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 300 * 1024 * 1024 // no larger than 300mb
  }
});

router.post("/scanbarcode", authentication.shallPass, function(req, res, next) {
  ////Barcode Search
  console.log(req.body.q);
  if(req.body.q){
    Product.findOne({ barcode: req.body.q })
      .limit(10)
      .exec(function(err, docs) {
        if (err) console.log(err);
        if(docs){
          var obj = {};
          obj.title = docs.title;
          obj.barcode = docs.barcode;
          obj.brand = docs.brand;
          // var patt = new RegExp("^(?:http(s)?://)?[w.-]+");
          // for (var i = 0; i < docs.tags.length; i++) {
          //   //if (patt.test(docs.tags[i].value)) {
          //     tags.push(docs.tags[i]);
          //   //}
          // }
          if(docs.tags){
            obj.tags = docs.tags.filter(tag=>{
              if(req.body.lang){
                if(!tag.lang || tag.lang === " "){
                  return true;
                } else {
                  if(tag.lang === req.body.lang){
                    return true
                  }else{
                    return false;
                  }
                }
              }else{
                return true;
              }
            });
          }
          logAction(req.key, "scanbarcode", req.body.q);
          res.send(obj);
        } else {
          res.json({"Message":"Couldn't find the barcode you are looking for"});
        }
      });
  } else {
    res.status(500);
    res.json({"message":"Did you use Get instead of Post?. Also make sure you supply the proper parameters"})
  }

});

router.post("/scantext", authentication.shallPass, function(req, res, next) {
  if(req.body.q){
  Brand.find({})
    .exec()
    .then(function(brands) {
      var prom = [];
      brands.forEach(function(value) {
        prom.push(
          Product.findOne(
            {
              brand: value.brandName,
              $text: {
                $search: req.body.q
              }
            },
            {
              score: {
                $meta: "textScore"
              }
            }
          )
            .limit(10)
            .sort({
              score: {
                $meta: "textScore"
              }
            })
            .exec()
        );
      });

      Promise.all(prom)
        .then(function(docs) {
          let response = [];
          docs = docs.filter(doc=>doc); //filter the nulls out
          if(docs){
            var obj = {};
            var tags = [];

            obj.title = docs[0].title;
            obj.barcode = docs[0].barcode;
            obj.brand = docs[0].brand;
            obj.tags = docs[0].tags.filter(tag=>{
              if(req.body.lang){
                if(!tag.lang || tag.lang === " "){
                  return true;
                } else {
                  if(tag.lang === req.body.lang){
                    return true
                  }else{
                    return false;
                  }
                }
              }else{
                return true;
              }
            });
            logAction(req.key, "scantext", req.body.q);
            res.send(obj);
          } else {
            res.json({"Message":"Couldn't find the text you are looking for"});
          }

        })
        .catch(error => {
          console.log(error);
        });
    })
    .catch(function(err) {
      next(err);
      console.error(err);
    });
  } else {
    res.status(500);
    res.json({"message":"Did you use Get instead of Post?. Also make sure you supply the proper parameters"})
  }
});

router.post("/analyzeVideo", authentication.shallPass, function(
  req,
  res,
  next
) {
  req.api = true;
  logAction(req.key, "scantext", req.body.product);
  ProductController.analyzeVideo(req, res, next);
}); /// product: barcode + video:video as form data

router.post("/uploadImage", authentication.shallPass, function(req, res, next){
  req.api = true;
  logAction(req.key, "scantext", req.body.product);
  ProductController.uploadImage(req, res, next);
})

function logAction(key, functionName, productID) {
  console.log(key);
  apiKey.update(
    {
      _id: key
    },
    {
      $push: {
        log: {
          function: functionName,
          productID: productID
        }
      }
    },
    (err, response) => {
      if (err) {
        console.error(err);
        return false;
      }
      return true;
    }
  );
}

module.exports = router;
