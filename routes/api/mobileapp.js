let express = require('express');
let router = express.Router();

let Product = require('../../model/products');
var Brand = require("./../../model/brands.js");
var ProductController = require('./../../controllers/products.js');


router.get('/scanbarcode',function(req, res, next){////Barcode Search

  Product.findOne({ barcode:req.query.q })
            .limit(10).exec(function(err, docs) {
    if(err)console.log(err);
    res.send(docs);

  });

});

router.get('/scantext',function(req, res, next){ ////Text Search
  Brand.find({})
    .exec()
    .then(function(brands) {
      var prom=[];
      brands.forEach(function(value){
        prom.push(Product.findOne({ brand :value.brandName, $text : { $search : req.query.q } },{ score : { $meta: "textScore" } }).limit(10).sort({ score : { $meta : 'textScore' } }))
      });

        Promise.all(prom).then(function(docs) {
        res.send(docs)
      });
    })
    .catch(function(err) {
      console.error(err);
    });

});

router.post('/analyzeVideo',ProductController.analyzeVideo);


module.exports = router;
