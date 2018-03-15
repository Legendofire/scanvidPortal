var express = require('express');
var router = express.Router();

var auth = require('./../middleware/authentication.js');

const resource = 'Brands';

var User = require('./../model/users.js');
var Product = require('./../model/products.js');
var Brand = require('./../model/brands.js');

router.get('/', auth.adminLoggedIn, function(req, res, next) {
  Brand.find({}).
  exec().then(function(brands){
    var output = {
      child: 'partials/brands/table.ejs',
      current_user: req.session.user,
      brands: brands
    };
    res.render('layout',output);
  });
});

router.post('/add', auth.adminLoggedIn , function(req, res, next) {
  var brand = new Brand({
    brandName: req.body.brandName
  });

  brand.save(function(err) {
    if (err) console.error(err);
    res.redirect('/brands');
  });
});

// router.get('/edit/:bid', auth.adminLoggedIn, function(req, res, next) {
//   User.findOne({_id:req.params.uid}).exec().then(function(value,err){
//     if(err)console.error(err);
//     var output = {
//       child: 'partials/users/edit.ejs',
//       current_user: req.session.user,
//       user: value,
//       brands: [{brandName:'Bosch'},{brandName:'Duckies'},{brandName:'MacDonalds'}]
//     };
//     res.render('layout',output);
//   });
//});
//
// router.post('/edit/:uid', auth.adminLoggedIn, function(req, res, next) {
//   User.findOne({_id:req.params.uid}).exec().then(function(user, err){
//     if(err) console.error(err);
//
//     //if(req.body.username) user.username = req.body.username;
//     if(req.body.password) user.password = req.body.password;
//     if(req.body.full_name) user.full_name = req.body.full_name;
//     if(req.body.phone) user.phone = req.body.phone;
//     if(req.body.email) user.email = req.body.email;
//
//     if(!req.session.user.isBrand){
//       if(req.body.type){
//         user.isBrand = req.body.type;
//       }
//     }
//
//     user.save(function(value, err){
//       if (err) console.error(err);
//       res.redirect('/users');
//     });
//   });
// });

router.get('/view/:bid', auth.adminLoggedIn, function(req, res, next) {
  var output = {
    child: 'partials/brands/view.ejs',
    current_user: req.session.user
  };
  Brand.findOne({_id:req.params.bid}).exec().then(function(brand){
    output.brand = brand;
    return User.find({brandName:brand.brandName}).exec();
  }).then(function(users){
    output.users = users;
    res.render('layout',output);
  });
});

router.get('/delete/:uid', auth.adminLoggedIn, function(req, res, next) {
  Brand.find({_id:req.params.uid}).remove().exec().then(function(value){
      res.redirect('/brands');
  });
});

module.exports = router;
