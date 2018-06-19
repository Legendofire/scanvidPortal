let express = require("express");
let mongoose = require("mongoose");

let Product = require("./../model/products");

const Storage = require("@google-cloud/storage");
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
var fs = require("fs");

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
  var output = {};
  var imgArr = [];
  var picsFolder = "./public/tempFolder/";
  var form = new formidable.IncomingForm();

  form.on("fileBegin", function(name, file) {
    file.path = form.uploadDir + "/" + file.name;
    console.log(name, file);
  });

  form.parse(req, function(err, fields, files) {
    if (req.api) {
      console.log("////////////req.body////////");
      console.log(req.body);
      console.log("/////////////fields/////////");
      console.log(fields);
      console.log("//////////////files/////////");
      console.log(files);
    }
    var bool = false;
    const options = {
      metadata: {
        contentType: files.video.type
      }
    };
    storage.getBuckets().then(results => {
      const buckets = results[0];
      //console.log('Buckets:');
      buckets.forEach(bucket => {
        if (bucket.name == "scanvid--videos--" + fields.product) {
          console.log("exisits");
          bool = true;
          console.log("trying to upload video");
          storage
            .bucket("scanvid--videos--" + fields.product)
            .upload(files.video.path, options)
            .then(() => {
              console.log(`uploaded.`);
              ffmpeg(files.video.path)
                .frames(1000)
                .on("filenames", function(filenames) {
                  for (var i = 0; i < filenames.length; i++) {
                    filenames[i] =
                      fields.product +
                      Math.random() * Math.floor(6192847129841) +
                      ".png";
                  }
                  imgArr = filenames;
                  console.log("Will generate " + filenames.join(", "));
                })
                .on("data", function(data) {
                  console.log(data);
                })
                .on("end", function() {
                  console.log("screenshots taken");
                  var prom = [];

                  for (var i = 0; i < imgArr.length; i++) {
                    var imgPath = picsFolder + imgArr[i];
                    prom.push(
                      storage
                        .bucket("scanvid--images--" + fields.product)
                        .upload(imgPath)
                    );
                  }
                  prom.push(
                    storage
                      .bucket("scanvid--images--" + fields.product)
                      .makePublic({ includeFiles: true })
                  );
                  prom.push(
                    storage
                      .bucket("scanvid--videos--" + fields.product)
                      .makePublic({ includeFiles: true })
                  );
                  Promise.all(prom)
                    .then(function(data) {
                      console.log(data);
                      if (req.api) {
                        res.send({
                          status: "200",
                          comment: "Uploaded successfully"
                        });
                      } else {
                        res.redirect("products/view/" + fields.product);
                      }
                    })
                    .catch(function(err) {
                      console.log(err);
                      if (req.api) {
                        res.send({ status: "403", comment: err });
                      } else {
                        res.redirect("products/view/" + fields.product);
                      }
                    });
                })
                .screenshots({
                  // Will take screens at 20%, 40%, 60% and 80% of the video
                  count: 10,
                  folder: picsFolder
                });
            })
            .catch(err => {
              console.error("ERROR:", err);
              if (req.api) {
                res.send({ status: "403", comment: err });
              } else {
                res.redirect("products/view/" + fields.product);
              }
            });
        }
      });
      if (!bool) {
        storage
          .createBucket("scanvid--videos--" + fields.product)
          .then(() => {
            console.log("created new bucket");
            bool = true;
            console.log(`Bucket ${fields.product} created.`);
            console.log("trying to upload video");
            storage
              .bucket("scanvid--videos--" + fields.product)
              .upload(files.video.path, options)
              .then(() => {
                console.log(`uploaded.`);

                ffmpeg(files.video.path)
                  .frames(1000)
                  .on("filenames", function(filenames) {
                    for (var i = 0; i < filenames.length; i++) {
                      filenames[i] =
                        fields.product +
                        Math.random() * Math.floor(6192847129841) +
                        ".png";
                    }
                    imgArr = filenames;
                    console.log("Will generate " + filenames.join(", "));
                  })
                  .on("data", function(data) {
                    console.log(data);
                  })
                  .on("end", function() {
                    console.log("screenshots taken");
                    var prom = [];
                    storage
                      .createBucket("scanvid--images--" + fields.product)
                      .then(() => {
                        for (var i = 0; i < imgArr.length; i++) {
                          var imgPath = picsFolder + imgArr[i];
                          prom.push(
                            storage
                              .bucket("scanvid--images--" + fields.product)
                              .upload(imgPath)
                          );
                        }
                        prom.push(
                          storage
                            .bucket("scanvid--images--" + fields.product)
                            .makePublic({ includeFiles: true })
                        );
                        prom.push(
                          storage
                            .bucket("scanvid--videos--" + fields.product)
                            .makePublic({ includeFiles: true })
                        );
                        Promise.all(prom)
                          .then(function(data) {
                            console.log(data);
                            if (req.api) {
                              res.send({
                                status: "200",
                                comment: "Uploaded successfully"
                              });
                            } else {
                              res.redirect("products/view/" + fields.product);
                            }
                          })
                          .catch(function(err) {
                            console.log(err);
                            if (req.api) {
                              res.send({
                                status: "200",
                                comment: "Uploaded successfully"
                              });
                            } else {
                              res.redirect("products/view/" + fields.product);
                            }
                          });
                      });
                  })
                  .screenshots({
                    // Will take screens at 20%, 40%, 60% and 80% of the video
                    count: 10,
                    folder: picsFolder
                  });
              })
              .catch(err => {
                console.error("ERROR:", err);
                if (req.api) {
                  res.send({ status: "403", comment: err });
                } else {
                  res.redirect("products/view/" + fields.product);
                }
              });
          })
          .catch(err => {
            console.error("ERROR:", err);
            if (req.api) {
              res.send({ status: "403", comment: err });
            } else {
              res.redirect("products/view/" + fields.product);
            }
          });
      }
    });
  });
};

exports.analyzeVideo2 = function(req, res ,next){
  var picsFolder = "./public/tempFolder/";
  var form = new formidable.IncomingForm();
  form.maxFileSize = 200 * 1024 * 1024;

  let productBarCode = '';

  form.on("file", function(name, file) {
    file.path = form.uploadDir + "/" + file.name;
    //console.log(name, file);
    doesBucketExsistFor(value)
      .then(doesExsist => {
        console.log("analyzeVideo2 doesExsist:");
        console.log(doesExsist);
        if(doesExsist){
            storeItemInBucket(file ,'videos',productBarCode)
              .then(() => {

              })
              .catch(() => {

              });
        }else{
          createBucketFor(value)
            .then((created) => {
              console.log("status:");
              console.log(created);
            })
            .catch((err) => {
              console.log("error:");
              console.log(err);
            });
        }
      })
      .catch(err => {
        console.log(err);
      });
  });

  form.on("field", function(name, value){
      if(name === "product"){
        productBarCode = value;
      }
  })

  form.parse(req);
}

/* Returning a Promise with whether the Bucket exsists or not*/
function doesBucketExsistFor(productBarCode) {
  return new Promise((resolve, reject) => {
    storage
      .getBuckets()
      .then(buckets => {
        //Search in the buckets for this product's bucket
        buckets[0].forEach(bucket => {
          //console.log("doesBucketExsistFor bucket name:");
          //console.log(bucket.name);
          if (bucket.name == `scanvid--videos--${productBarCode}` || bucket.name == `scanvid--images--${productBarCode}`) {
            //if bucket found resolve with true
            resolve(true);
          }
        });
        //if no bucket is found resolve with false
        resolve(false);
      })
      .catch(err => {
        reject(err);
      });
  });
}

/* Create Video and Image Bucket */
function createBucketFor(productBarCode){
  return new Promise((resolve, reject) => {
    const imageBucketPromise = storage.createBucket(`scanvid--images--${productBarCode}`);
    const videoBucketPromise = storage.createBucket(`scanvid--videos--${productBarCode}`);
    //console.log("createBucketFor bucketname:");
    //console.log(`scanvid--videos--${productBarCode}`);
    Promise
      .all([imageBucketPromise,videoBucketPromise])
      .then((response) => {
        //console.log("createBucketFor Response:");
        //console.log(response);
        const makeImageBucketPublicPromise = storage
          .bucket(`scanvid--images--${productBarCode}`)
          .makePublic({ includeFiles: true });
        const makeVideosBucketPublicPromise = storage
          .bucket(`scanvid--videos--${productBarCode}`)
          .makePublic({ includeFiles: true });
        Promise
          .all([makeImageBucketPublicPromise, makeVideosBucketPublicPromise])
          .then(()=>{
            resolve(true);
          })
          .catch((err)=>{
            reject(err);
          })
      })
      .catch(err => {
        reject(err);
      });
  });
}

function storeItemInBucket(file, fileType, productBarCode) {
  const uploadOptions = {
    metadata: {
      contentType: files.video.type
    }
  };
  let bucketName = `scanvid--${fileType}--${productBarCode}`;
  return storage
    .bucket(bucketName)
    .upload(file.path, uploadOptions);
}
