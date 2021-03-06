var express = require("express");
var router = express.Router();

var auth = require("./../middleware/authentication.js");

const resource = "Brands";

var User = require("./../model/users.js");
var Brand = require("./../model/brands.js");
var Product = require("./../model/products.js");

router.get("/", auth.adminLoggedIn, function(req, res, next) {
  var output = {
    child: "partials/brands/table.ejs",
    current_user: req.session.user
  };
  Brand.find({})
    .exec()
    .then(function(brands) {
      output.brands = brands;
      res.render("layout", output);
    })
    .catch(function(err) {
      console.error(err);
    });
});

router.post("/add", auth.adminLoggedIn, function(req, res, next) {
  var brand = new Brand({
    brandName: req.body.brandName
  });
  brand.save(function(err) {
    if (err) console.error(err);
    res.redirect("/brands");
  });
});

router.get("/view/:uid", auth.userLoggedIn, function(req, res, next) {
  var output = {
    child: "partials/brands/view.ejs",
    current_user: req.session.user
  };
  var query = {};
  if(req.session.user.isBrand){
    query = {brandName: req.session.user.brandName};
  }else{
    query = {_id: req.params.uid};
  }
  Brand.findOne(query)
    .exec()
    .then(function(brand) {
      output.brand = brand;
      return User.find({brandName:brand.brandName});
    })
    .then(function(users) {
      output.users = users;
      return Brand.find({});
    }).then(function(brands){
      output.brands = brands;
      res.render("layout", output);
    })
    .catch(function(err) {
      console.log(err);
    });
});

router.get("/delete/:uid", auth.adminLoggedIn, function(req, res, next) {
  User.find({ _id: req.params.uid })
    .remove()
    .exec()
    .then(function(value) {
      res.redirect("/brands");
    });
});

module.exports = router;
