let express = require("express");
let router = express.Router();

let Product = require("../../model/products");
var Brand = require("./../../model/brands.js");
var ProductController = require("./../../controllers/products.js");

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

router.post("/analyzeVideo", function(req, res, next) {
  // req.api = true;
  // ProductController.analyzeVideo(req, res, next);
}); /// product: barcode + video:video as form data

module.exports = router;
