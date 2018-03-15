var express = require("express");
var router = express.Router();

var auth = require("./../middleware/authentication.js");

const resource = "Users";

var User = require("./../model/users.js");
var Brand = require("./../model/brands.js");
var Product = require("./../model/products.js");

router.get("/", auth.adminLoggedIn, function(req, res, next) {
  var output = {
    child: "partials/users/table.ejs",
    current_user: req.session.user
  };
  User.find({})
    .exec()
    .then(function(users) {
      output.users = users;
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

router.post("/add", auth.adminLoggedIn, function(req, res, next) {
  var user = new User({
    username: req.body.username,
    password: req.body.password,
    full_name: req.body.full_name,
    email: req.body.email,
    phone: req.body.phone,
    isBrand: req.body.type,
    brandName: req.body.brandName
  });

  user.save(function(err) {
    if (err) console.error(err);
    res.redirect("/users");
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

router.get("/delete/:uid", auth.adminLoggedIn, function(req, res, next) {
  User.find({ _id: req.params.uid })
    .remove()
    .exec()
    .then(function(value) {
      res.redirect("/users");
    });
});

module.exports = router;
