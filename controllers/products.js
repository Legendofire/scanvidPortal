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
    fileSize: 200 * 1024 * 1024 // no larger than 300mb
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

exports.uploadImage = function(req, res, next){
  console.count("upload Image");
  console.log(req.body);
  var picsFolder = "./public/tempFolder/";
  var form = new formidable.IncomingForm();
  form.maxFileSize = 200 * 1024 * 1024;
  let productBarCode = "";
  console.count("upload Image");
  form.on("file", function(name, file) {
    console.log("Finished Uploading The File");
    doesBucketExsistFor(productBarCode)
      .then(doesExsist => {
        console.log("Finished Checking if Bucket Exsists");
        if (doesExsist) {
            console.log("Bucket Exsists");
            storeItemInBucket(file , 'images', productBarCode)
            .then(()=>{
              if (req.api) {
                res.json({status:200, message:"Successfully uploaded Image"})
              } else {
                res.redirect("/products/view/" + productBarCode);
              }
            })
            .catch((err)=>{
              if (req.api) {
                console.log(err);
                res.json({status:500, message:"Error while uploading Image"})
              } else {
                console.log(err);
                res.redirect("/products/view/" + productBarCode);
              }
            });
        } else {
          console.log("Bucket Doesn't Exsists");
          createBucketFor(productBarCode)
            .then(created => {
              if(created){
                console.log("Created Bucket");
                storeItemInBucket(file , 'images', productBarCode)
                .then(()=>{
                  if (req.api) {
                    res.json({status:200, message:"Successfully uploaded Image"})
                  } else {
                    res.redirect("/products/view/" + productBarCode);
                  }
                })
                .catch((err)=>{
                  console.log(err);
                  if (req.api) {
                    res.json({status:500,message:"Internal Error"});
                  } else {
                    res.redirect("/products/view/" + productBarCode);
                  }
                });
              }else{
                console.log("Failed to Create the Bucket");
                if (req.api) {
                  res.json({status:500, message:"Failed to Create Bucket"})
                } else {
                  res.redirect("/products/view/" + productBarCode);
                }
              }
            })
            .catch(err => {
              console.log("Failed to Create the Bucket");
              console.log(err);
              if (req.api) {
                res.json({status:500,message:"Internal Error"});
              } else {
                res.redirect("/products/view/" + productBarCode);
              }
            });
        }
      })
      .catch(err => {
        console.log("Failed while Checking if Bucket exsists");
        if (req.api) {
          console.log(err);
          res.json({status:500,message:"Internal Error"});
        } else {
          console.log(err);
          res.redirect("/products/view/" + productBarCode);
        }
      });
  });

  form.on("error", function(err){
    if (req.api) {
      console.log(err);
      res.json({status:500, error:err})
    } else {
      console.log(err);
      res.redirect("/products/view/" + productBarCode);
    }
  })

  form.on("field", function(name, value) {
    if (name === "product") {
      productBarCode = value;
    }
  });

  form.parse(req);
}

exports.analyzeVideo = function(req, res, next) {
  var picsFolder = "./public/tempFolder/";
  var form = new formidable.IncomingForm();
  form.maxFileSize = 200 * 1024 * 1024;
  let productBarCode = "";
  form.on("file", function(name, file) {
    console.log("Finished Uploading The File");
    doesBucketExsistFor(productBarCode)
      .then(doesExsist => {
        console.log("Finished Checking if Bucket Exsists");
        if (doesExsist) {
            console.log("Bucket Exsists");
            processVideo(file, productBarCode)
              .then(() => {
                console.log("Finished Processing Video");
                if (req.api) {
                  console.log("Responding from API");
                  res.json({status:200, message:'Video Uploaded'})
                } else {
                  console.log("Responding from CMS");
                  res.redirect("products/view/" + productBarCode);
                }
              })
              .catch((err) => {
                console.log(err);
                res.json({status:500,message:"Internal Error"});
              });
        } else {
          console.log("Bucket Doesn't Exsists");
          createBucketFor(productBarCode)
            .then(created => {
              if(created){
                processVideo(file, productBarCode)
                  .then(() => {
                    console.log("Finished Processing Video");
                    if (req.api) {
                      console.log("Responding from API");
                      res.json({status:200, message:'Video Uploaded'})
                    } else {
                      console.log("Responding from CMS");
                      res.redirect("products/view/" + productBarCode);
                    }
                  })
                  .catch((err) => {
                    console.log("Error while Processing Video");
                    if (req.api) {
                      console.log("Responding from API");
                      res.json({status:500, message:'Error while processing Video'});
                    } else {
                      console.log("Responding from CMS");
                      res.redirect("products/view/" + productBarCode);
                    }
                  });
              }else{
                console.log("Failed to Create the Bucket");
                res.json({status:500,message:"Internal Error"});
              }
            })
            .catch(err => {
              console.log("Failed to Create the Bucket");
              console.log(err);
              res.json({status:500,message:"Internal Error"});
            });
        }
      })
      .catch(err => {
        console.log("Failed while Checking if Bucket exsists");
        console.log(err);
        res.json({status:500,message:"Internal Error"});
      });
  });

  form.on("error", function(err){
    if (req.api) {
      console.log(err);
      res.json({status:500,message:"Internal Error"});
    } else {
      console.log(err);
      res.redirect("products/view/" + productBarCode);
    }
  })

  form.on("field", function(name, value) {
    if (name === "product") {
      productBarCode = value;
    }
  });

  form.parse(req);
}

function processVideo(file, productBarCode){
  console.log(`Started Processing ${file.name}`);
  return new Promise((resolve, reject)=>{
    let videoStoragePromise = storeItemInBucket(file, "videos", productBarCode);
    let screenShotsPromises = [];
    getScreenShotsFromVideo(file)
      .then(fileNames => {
        console.log(`Finished Generating Screenshots from ${file.name}`);
        fileNames.forEach((fileName) => {
          let file = {
            name: fileName,
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
        console.log("Finished Storing Video and Screenshots");
        resolve(response);
      })
      .catch(err => {
        reject(err);
      });
  });
}

/* Returning a Promise with whether the Bucket exsists or not*/
function doesBucketExsistFor(productBarCode) {
  console.log(`Started Checking if the Bucket for ${productBarCode} Exsist`);
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
  console.log(`Creating Buckets for: ${productBarCode}`);
  return new Promise((resolve, reject) => {
    const imageBucketPromise = storage.createBucket(
      `scanvid--images--${productBarCode}`
    );
    const videoBucketPromise = storage.createBucket(
      `scanvid--videos--${productBarCode}`
    );
    Promise.all([imageBucketPromise, videoBucketPromise])
      .then(response => {
        console.log("Finished Creating Buckets");
        resolve(true);
      })
      .catch(err => {
        reject(err);
      });
  });
}

/* Store file in Bucket*/
function storeItemInBucket(file, fileType, productBarCode) {
  console.log(`Storing ${file.name} in Bucket`);
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
        console.log(`Finished storing ${file.name} in Bucket`);
        storage
          .bucket(bucketName)
          .file(response[0].metadata.name)
          .makePublic()
          .then(()=>{
            console.log(`Finished making ${file.name} public`);
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
  console.log("Started Taking Screenshots from Video");
  let fileNames = [];
  return new Promise((resolve, reject) => {
    ffmpeg(file.path)
      .on("filenames", function(filenames) {
        console.log("Reserved file names");
        fileNames = filenames;
      })
      .on("end", function() {
        console.log("Finished taking screenshots");
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
