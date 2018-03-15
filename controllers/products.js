let express = require("express");
let mongoose = require("mongoose");

let Product = require("./../model/products");


exports.getAllProducts = function(req, res, next) {
  if (req.session.user) {
    if (req.session.user.isBrand) {
      if (req.query.page) {
        Product.paginate(
          { brand: req.session.user.brandName },
          { page: req.query.page, limit: 10 })
          .then(function(result) {
              res.json(result);
          });
      } else {
        Product.paginate(
          { brand: req.session.user.brandName },
          { page: 1, limit: 10 })
          .then(function(result) {
              res.json(result);
          });
      }
    }
    if (req.query.type) {
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
    Product.findOne({barcode:req.query.q}).exec(function(err,results){
      console.log(results);
      res.json(results);
    });
  }
};

exports.analyzeVideo=function(req,res,next){
  if (req.session.user) {

    if (!req.file) {
      return next();
    }

    const gcsname = 'scanvid--'+req.params.product;
    const file = storage.file(gcsname);

    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype
      }
    });

    stream.on('error', (err) => {
      req.file.cloudStorageError = err;
      next(err);
    });

    stream.on('finish', () => {
      req.file.cloudStorageObject = gcsname;
      file.makePublic().then(() => {
        req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
        next();
      });
    });

    stream.end(req.file.buffer);


  }
};


// if(req.user.isBrand){
//   var where = {
//     brandName = req.user.brand;
//   }
// }else{
//
// }
