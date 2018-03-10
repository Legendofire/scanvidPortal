var express = require('express');
var router = express.Router();

var auth = require('./../middleware/authentication.js');

const resource = 'Users';

var User = require('./../model/users.js');
var Product = require('./../model/products.js');

router.get('/', function(req, res, next) {
  console.log(req.session.user);
  User.find({}).
  exec(function(err, value) {
    res.json(value);
  });
});

router.post('/add', auth.userLoggedIn , function(req, res, next) {
  var user = new User({
    username: req.body.username,
    password: req.body.password,
    full_name: req.body.full_name,
    email: req.body.email,
    phone: req.body.phone,
    type: req.body.type
  });

  user.save(function(err) {
    if (err) console.error(err);
    res.redirect('/users');
  });
});

router.get('/edit/:uid', auth.userLoggedIn, function(req, res, next) {
  User.findOne({_id:req.params.uid}).exec().then(function(value,err){
    if(err)console.error(err);
    var output = {
      child: 'partials/users/edit.ejs',
      current_user: req.session.user,
      user: value
    };
    res.render('layout',output);
  });
});

router.post('/edit/:uid', auth.userLoggedIn, function(req, res, next) {
  User.findOne({_id:req.params.uid}).exec().then(function(user, err){
    if(err) console.error(err);

    if(req.body.username) user.username = req.body.username;
    if(req.body.password) user.password = req.body.password;
    if(req.body.full_name) user.full_name = req.body.full_name;
    if(req.body.email) user.email = req.body.email;
    if(req.body.phone) user.phone = req.body.phone;

    if(req.session.user.type === 'Admin'){
      if(req.body.type) user.type = req.body.type;
    }

    user.save(function(value, err){
      if (err) console.error(err);
      res.redirect('/users');
    });
  });
});

router.get('/delete/:uid', auth.userLoggedIn, function(req, res, next) {
  User.find({_id:req.params.uid}).remove().exec().then(function(err,value){
      if (err) console.error(err);
      res.redirect('users');
  });
});

router.get('/tempadd', function(req, res, next) {
  var user = new User({
    username: "Admin",
    password: "Admin",
    full_name: "Admin McAdminFace",
    email: "admin@scanvid.com",
    phone: "01226222335",
    isBrand: false
  });

  user.save(function(err,value) {
    if (err) console.error(err);
    res.json(value);
  });
});

module.exports = router;
