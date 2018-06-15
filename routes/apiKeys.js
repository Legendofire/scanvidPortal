var express = require("express");
var mongoose = require('mongoose');
const resource = "apiKeys";

var config = require("./../config/key.js");
var auth = require("./../middleware/authentication.js");
var User = require("./../model/users.js");
var Brand = require("./../model/brands.js");
var Product = require("./../model/products.js");
var apiKey = require("./../model/apiKeys.js");

var router = express.Router();

router.post("/add", auth.adminLoggedIn, function(req, res, next) {
    let dateArr = req.body.expiry.split('-');
    let timestamp = new Date(dateArr[0],dateArr[1],dateArr[2]).getTime();
    var key = new apiKey({
      user : req.body.user,
      limit : req.body.limit,
      expiry : timestamp,
      revoked: false,
      allowOverage: req.body.allowOverage
    });

    key.save(function(err, response) {
      if (err) console.error(err);
      res.redirect("/users/view/"+req.body.user);
    });
});

router.get("/edit/:aid", auth.adminLoggedIn, function(req, res, next) {
  var output = {
    child: "partials/users/key_edit.ejs",
    current_user: req.session.user
  };
  apiKey.findOne({ _id: req.params.aid })
    .exec()
    .then(function(value) {
      output.key = value;
      res.render("layout", output);
    })
    .catch(function(err) {
      console.log(err);
    });
});

router.post("/edit/:aid", auth.adminLoggedIn, function(req, res, next) {
      let query = {};
      if (req.body.limit){
        query.limit = req.body.limit;
      }
      if (req.body.revoked){
        query.revoked = req.body.revoked;
      }
      if (req.body.allowOverage){
        query.allowOverage = req.body.allowOverage;
      }
      apiKey.findOneAndUpdate({_id: req.params.aid}, query ,(err, doc)=>{
          if (err) console.error(err);
          res.redirect("/users/view/"+doc.user);
      });
});

router.get('/view/:pid', auth.userLoggedIn, function(req, res, next) {
  var output = {
    child: 'partials/users/apiSingleView.ejs',
    current_user: req.session.user
  };

  apiKey
    .find({
      _id:req.params.pid
    })
    .populate('user')
    .exec()
    .then(function(currentKey){
      output.currentKey = currentKey[0];
      res.render("layout", output);
    });
});

router.post('/chartData', function(req, res, next){
    var fromDate = new Date(req.body.fromDate).getTime();
    var toDate = new Date(req.body.toDate).getTime();

    apiKey.aggregate([
      {"$match":{
        "_id": mongoose.Types.ObjectId(req.body.apiKey)
      }},
      {"$unwind": '$log'},
      {"$match": {
        "log.date": {
          $gte: new Date(req.body.fromDate),
          $lte: new Date(req.body.toDate)
        }
      }},
      {"$group":{
        "_id": {
          day: {$dayOfMonth: "$log.date"},
          month: {$month: "$log.date"},
          year: {$year: "$log.date"},
          function: "$log.function"
        },
        "count": {
          $sum: 1
        }
      }},
      {"$sort": {'_id.day':1}}
    ],function(err, results){
      if(err)console.log(err);
      var accumelator = 0;
      labels = [];
      keyUsage = results.map(function(item, index){
        labels.push(`${item._id.year}-${item._id.month}-${item._id.day}`);
        accumelator = accumelator + item.count;
        return {
          date: `${item._id.year}-${item._id.month}-${item._id.day}`,
          value: accumelator
        }
      });

      accumelator = 0;
      scantextUsage = results.filter(function(item){
          return item._id.function === 'scantext'
      }).map(function(item, index){
        accumelator = accumelator + item.count;
        return {
          date: `${item._id.year}-${item._id.month}-${item._id.day}`,
          value: accumelator
        }
      });
      accumelator = 0;
      scanbarcodeUsage = results.filter(function(item){
          return item._id.function === 'scanbarcode'
      }).map(function(item, index){
        accumelator = accumelator + item.count;
        return {
          date: `${item._id.year}-${item._id.month}-${item._id.day}`,
          value: accumelator
        }
      });
      res.json({
        labels: labels,
        keyUsage:keyUsage,
        scantext: scantextUsage,
        scanbarcode: scanbarcodeUsage
      });
    })
})

router.get('/generateApiTraffic/:keys/:logs', function(req, res, next){
    var userID = '5b23870bd54c94427bd27569';
    var dateStartLimit = new Date('06/02/2018').getTime(); //weird behaviour when setting it to 01
    var dateEndLimit = new Date('06/31/2018').getTime(); //Same with 30 instead of 31
    var dateSpan = dateEndLimit - dateStartLimit;
    console.log(dateStartLimit, dateEndLimit);
    var limitStartLimit = '100';
    var limitEndLimit = '1200';
    var limitSpan = limitEndLimit - limitStartLimit;
    var functionNames = ['scantext', 'scanbarcode'];
    var productIDs = ['8001090703835','0634479159251','0634479159305','8001090732934','0634479159817'];

    for(var i = 0; i < req.params.keys; i++){
      var log = [];
      for(var j=0; j < req.params.logs; j++){
        log.push({
          date: Math.floor(Math.random() * dateSpan) + dateStartLimit,
          productID: productIDs[Math.floor(Math.random() * 5)],
          function: functionNames[Math.floor(Math.random() * 2)]
        })
      }
      var key = new apiKey({
        user : userID,
        limit : Math.floor(Math.random() * limitSpan) + limitStartLimit  ,
        expiry : Math.floor(Math.random() * dateSpan) + dateStartLimit,
        revoked: false,
        allowOverage: true,
        log: log
      });
      key.save(function(err, response) {
        if (err) console.error(err);
      });
    }

    res.json({msg:'done'});

});

module.exports = router;
