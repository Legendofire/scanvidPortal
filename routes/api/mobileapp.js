let express = require('express');
let router = express.Router();

let Product = require('../../model/products');

router.get('/scanbarcode',function(req, res, next){////Barcode Search

  Product.find({ barcode:req.query.q })
            .limit(10).exec(function(err, docs) {
    if(err)console.log(err);
    res.send(docs);

  });

});

router.get('/scantext',function(req, res, next){ ////Text Search
  var docs=['unknown','bosch'];
  var prom=[];
  for(var i=0;i<docs.length;i++){
    prom.push(Product.find({ brand :docs[i], $text : { $search : req.query.q } },{ score : { $meta: "textScore" } }).limit(10).sort({ score : { $meta : 'textScore' } }))
  }
    Promise.all(prom).then(function(docs) {
    res.send(docs)
  });

});


module.exports = router;
