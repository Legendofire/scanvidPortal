var express = require('express');
var router = express.Router();

var auth = require('./../middleware/authentication.js');

const resource = 'Users';

var User = require('./../model/users.js');
var Prospect = require('./../model/prospect.js');
var Product = require('./../model/product.js');

router.get('/', auth.userLoggedWithAccessTo(resource,'ViewAll'), function(req, res, next) {
  User.find({}).
  exec(function(err, value) {
    res.render('layout', {
      child: 'partials/users/table.ejs',
      users: value,
      current_user: req.session.user
    })
  });
});

router.get('/view/:uid', auth.userLoggedWithAccessTo(resource,'View'), function(req, res, next) {
  var output = {
    child: 'partials/users/view.ejs',
    current_user: req.session.user
  };

  User.findOne({
    _id: req.params.uid
  }).
  populate('prospects').
  populate('prospects.technical_sales').
  exec().
  then(function(user,err) {
    if(err)console.error(err);
    output.user = user;
    return Product.find().exec();
  }).
  then(function(products) {
    output.products = products;
    return User.find({
      type: 'Sales'
    }).exec();
  }).
  then(function(sales) {
    output.sales = sales;
    return User.find({
      type: 'Tech'
    }).exec();
  }).
  then(function(techs) {
    output.tech = techs;
    res.render('layout', output);
  })
});

router.post('/add', auth.userLoggedWithAccessTo(resource,'Add'), function(req, res, next) {
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

router.get('/edit/:uid', auth.userLoggedWithAccessTo(resource,'Edit'), function(req, res, next) {
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

router.post('/edit/:uid', auth.userLoggedWithAccessTo(resource,'Edit'), function(req, res, next) {
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

router.post('/:uid/addProspect', auth.userLoggedWithAccessTo('Prospects','Add'), function(req, res, next) {
  var prospect = {
    contact_name: req.body.contact_name,
    company_name: req.body.company_name,
    contact_info: [req.body.contact_info],
    description: req.body.description,
    progression: req.body.progression,
    creator: req.body.creator
  }
  if (req.body.product) prospect.product = req.body.product;
  if (req.body.sales) prospect.sales = req.body.sales;
  if (req.body.technical_sales) prospect.technical_sales = req.body.technical_sales;

  var prospect_id = '';

  Prospect.create(prospect,function(err,value){
    prospect_id = value._id;
    if (err) console.error(err);
    User.findByIdAndUpdate(
      prospect.sales, {
        $push: {
          "prospects": prospect_id
        }
      }, {
        safe: true,
        upsert: true,
        new: true
      }
    ).then(function(err,value){
      if(err) console.error(err);
      User.findByIdAndUpdate(
        prospect.technical_sales, {
          $push: {
            "prospects": prospect_id
          }
        }, {
          safe: true,
          upsert: true,
          new: true
        }
      ).then(function(err,value){
        if(err) console.error(err);
        res.redirect('/users/view/' + req.params.uid);
      });
    });
  });
});

router.get('/delete/:uid', auth.userLoggedWithAccessTo(resource,'Delete'), function(req, res, next) {
  User.find({_id:req.params.uid}).remove().exec().then(function(err,value){
      if (err) console.error(err);
      res.redirect('users');
  });
});

module.exports = router;
