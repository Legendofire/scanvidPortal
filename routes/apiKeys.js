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
      limit : 10000,
      expiry : timestamp,
      revoked: false,
      allowOverage: true
    });

    key.save(function(err, response) {
      if (err) console.error(err);
      res.json({apiKey: response._id});
    });
});

router.get("/edit/:uid", auth.adminLoggedIn, function(req, res, next) {
  var output = {
    child: "partials/users/edit.ejs",
    current_user: req.session.user
  };
  User.findOne({ _id: req.params.uid })
    .exec()
    .then(function(value) {
      output.user = value;
      return Brand.find({}).exec();
    })
    .then(function(brands) {
      output.brands = brands;
      res.render("layout", output);
    })
    .catch(function(err) {
      console.log(err);
    });
});

router.post("/edit/:uid", auth.adminLoggedIn, function(req, res, next) {
  User.findOne({ _id: req.params.uid })
    .exec()
    .then(function(user, err) {
      if (err) console.error(err);
      if (req.body.password) user.password = req.body.password;
      if (req.body.full_name) user.full_name = req.body.full_name;
      if (req.body.phone) user.phone = req.body.phone;
      if (req.body.email) user.email = req.body.email;
      if (req.body.brandName) user.brandName = req.body.brandName;
      if (!req.session.user.isBrand) {
        if (req.body.type) {
          user.isBrand = req.body.type;
        }
      }
      user.save(function(value, err) {
        if (err) console.error(err);
        res.redirect("/users");
      });
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
