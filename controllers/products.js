let express = require("express");
let mongoose = require("mongoose");
let mime = require('mime');

let Product = require("./../model/products");

const Storage = require("@google-cloud/storage");
// Your Google Cloud Platform project ID

const ffmpeg = require("easy-ffmpeg");
var formidable = require("formidable");
const Multer = require("multer");
var fs = require("fs");

const projectId = "API Project";

// Creates a client
const storage = new Storage({
  keyFilename: "scanvid.json"
});
const outputFolder = "./public/tempFolder/";
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 300 * 1024 * 1024 // no larger than 300mb
  }
});

exports.getAllProducts = function(req, res, next) {
  if (req.session.user) {
    if (req.session.user.isBrand) {
      if (req.query.page) {
        console.log(req.query.page);
        console.log(req.session.user.brandName);
        Product.paginate(
          { brand: req.session.user.brandName },
          { page: req.query.page, limit: 10 }
        ).then(function(result) {
          res.json(result);
        });
      } else {
        Product.paginate(
          { brand: req.session.user.brandName },
          { page: 1, limit: 10 }
        ).then(function(result) {
          res.json(result);
        });
      }
    } else if (req.query.type) {
      if (req.query.page) {
        Product.paginate(
          { brand: req.query.type },
          { page: req.query.page, limit: 10 },
          function(err, result) {
            res.json(result);
          }
        );
      } else {
        Product.paginate(
          { brand: req.query.type },
          { page: 1, limit: 10 },
          function(err, result) {
            res.json(result);
          }
        );
      }
    } else {
      if (req.query.page) {
        Product.paginate({}, { page: req.query.page, limit: 10 }, function(
          err,
          result
        ) {
          res.json(result);
        });
      } else {
        Product.paginate({}, { page: 1, limit: 10 }, function(err, result) {
          res.json(result);
        });
      }
    }
  }
};

exports.searchDb = function(req, res, next) {
  if (req.session.user) {
    if (req.session.user.isBrand) {
      Product.find(
        { brand: req.session.user.brandName, $text: { $search: req.query.q } },
        { score: { $meta: "textScore" } }
      )
        .limit(20)
        .sort({ score: { $meta: "textScore" } })
        .exec(function(err, results) {
          res.json(results);
        });
    }
    if (req.query.type) {
      Product.find(
        { brand: req.query.type, $text: { $search: req.query.q } },
        { score: { $meta: "textScore" } }
      )
        .limit(20)
        .sort({ score: { $meta: "textScore" } })
        .exec(function(err, results) {
          res.json(results);
        });
    } else {
      Product.find(
        { brand: "unknown", $text: { $search: req.query.q } },
        { score: { $meta: "textScore" } }
      )
        .limit(20)
        .sort({ score: { $meta: "textScore" } })
        .exec(function(err, results) {
          res.json(results);
        });
    }
  }
};

exports.dbSearchBarcode = function(req, res, next) {
  if (req.session.user) {
    Product.findOne({ barcode: req.query.q }).exec(function(err, results) {
      console.log(results);
      res.json(results);
    });
  }
};

exports.analyzeVideo = function(req, res, next) {
  var picsFolder = "./public/tempFolder/";
  var form = new formidable.IncomingForm();
  form.maxFileSize = 200 * 1024 * 1024 * 1024;

  let productBarCode = "";

  form.on("file", function(name, file) {
    doesBucketExsistFor(productBarCode)
      .then(doesExsist => {
        if (doesExsist) {
            processVideo(file, productBarCode)
              .then(() => {
                if (req.api) {
                  res.json({status:200, message:'Video Uploaded'})
                } else {
                  res.redirect("products/view/" + fields.product);
                }
              })
              .catch((err) => {
                res.json({status:500, error:err})
              });
        } else {
          createBucketFor(productBarCode)
            .then(created => {
              if(created){
                processVideo(file, productBarCode)
                  .then(() => {
                    if (req.api) {
                      res.json({status:200, message:'Video Uploaded'})
                    } else {
                      res.redirect("products/view/" + fields.product);
                    }
                  })
                  .catch((err) => {
                    res.json({status:500, error:err})
                  });
              }else{
                res.json({status:500,error:"Internal Error"});
              }
            })
            .catch(err => {
              res.json({status:500,error:err});
            });
        }
      })
      .catch(err => {
        res.json({status:500,error:err});
      });
  });

  form.on("field", function(name, value) {
    if (name === "product") {
      productBarCode = value;
    }
  });

  form.parse(req);
};

function processVideo(file, productBarCode){
  return new Promise((resolve, reject)=>{
    let videoStoragePromise = storeItemInBucket(file, "videos", productBarCode);
    let screenShotsPromises = [];
    getScreenShotsFromVideo(file)
      .then(fileNames => {
        fileNames.forEach((fileName) => {
          let file = {
            path: outputFolder+fileName,
            type: mime.lookup(outputFolder+fileName)
          }
          screenShotsPromises.push(storeItemInBucket(file, "images", productBarCode));
        });
      })
      .catch(err => {
        reject(err);
      });

      Promise
      .all([videoStoragePromise].concat(screenShotsPromises))
      .then(response => {
        resolve(response);
      })
      .catch(err => {
        reject(err);
      });
  });
}

/* Returning a Promise with whether the Bucket exsists or not*/
function doesBucketExsistFor(productBarCode) {
  return new Promise((resolve, reject) => {
    storage
      .getBuckets()
      .then(buckets => {
        let foundBucket = false;
        buckets[0].forEach(bucket => {
          if (
            bucket.name == `scanvid--videos--${productBarCode}` ||
            bucket.name == `scanvid--images--${productBarCode}`
          ) {
            foundBucket = true;
          }
        });
        foundBucket ? resolve(true) : resolve(false);
      })
      .catch(err => {
        reject(err);
      });
  });
}

/* Create Video and Image Bucket */
function createBucketFor(productBarCode) {
  return new Promise((resolve, reject) => {
    const imageBucketPromise = storage.createBucket(
      `scanvid--images--${productBarCode}`
    );
    const videoBucketPromise = storage.createBucket(
      `scanvid--videos--${productBarCode}`
    );
    Promise.all([imageBucketPromise, videoBucketPromise])
      .then(response => {
        const makeImageBucketPublicPromise = storage
          .bucket(`scanvid--images--${productBarCode}`);
        const makeVideosBucketPublicPromise = storage
          .bucket(`scanvid--videos--${productBarCode}`);
        Promise
          .all([
            makeImageBucketPublicPromise,
            makeVideosBucketPublicPromise
          ])
          .then((response) => {
            console.log(response);
            resolve(true);
          })
          .catch(err => {
            reject(err);
          });
      })
      .catch(err => {
        reject(err);
      });
  });
}

/* Store file in Bucket*/
function storeItemInBucket(file, fileType, productBarCode) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      metadata: {
        contentType: file.type
      }
    };
    let bucketName = `scanvid--${fileType}--${productBarCode}`;
    storage
      .bucket(bucketName)
      .upload(file.path, uploadOptions)
      .then((response)=>{
        storage
          .bucket(bucketName)
          .file(response[0].metadata.name)
          .makePublic()
          .then(()=>{
            resolve(true);
          })
          .catch((err)=>{
            reject(err);
          });
      })
      .catch((err)=>{
        reject(err);
      });
  })

}

/* get Screenshots from video*/
function getScreenShotsFromVideo(file, productBarCode) {
  let fileNames = [];
  return new Promise((resolve, reject) => {
    ffmpeg(file.path)
      .on("filenames", function(filenames) {
        fileNames = filenames;
      })
      .on("end", function() {
        resolve(fileNames);
      })
      .screenshots({
        count: 10,
        folder: outputFolder
      })
      .on("error", err => {
        reject(err);
      });
  });
}
