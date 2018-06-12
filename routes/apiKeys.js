var express = require("express");
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

router.get('/view/:pid', auth.adminLoggedIn, function(req, res, next) {
  var output = {
    child: 'partials/users/singleView.ejs',
    current_user: req.session.user
  };

  User.findOne({_id:req.params.pid}).exec().then(function(user){
    if(user){
      output.user = user;
    }else{

    }

    res.render("layout", output);
  });
});

router.get("/delete/:uid", auth.adminLoggedIn, function(req, res, next) {
  User.find({ _id: req.params.uid })
    .remove()
    .exec()
    .then(function(value) {
      res.redirect("/users");
    });
});

module.exports = router;
