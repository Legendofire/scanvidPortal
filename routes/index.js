let express = require('express');
let router = express.Router();
let argon2 = require('argon2');
let _ = require('lodash');
let User = require('./../model/users');
let Product = require('./../model/product');
let Products = require('./../controllers/products');
let Index = require('./../controllers/index');

let auth = require('./../middleware/authentication');

router.get('/testFady',function(req, res, next){
  //Products.getAllProducts(req,res,next);
  //Products.searchDb(req,res,next);
  res.render('testDT');
});

router.get('/api/getAll',function(req, res, next){

  Products.getAllProducts(req,res,next);
  //res.render('testDT');
});
router.get('/api/dbSearch',function(req, res, next){

  Products.searchDb(req,res,next);
  //res.render('testDT');
});

router.get('/', auth.userLoggedIn, Index.getDashboard);

router.post('/auth', function(req, res, next) {
  User.findOne({
    username: req.body.username,
  }, function(err, user) {
    if (err) throw res.json(err);
    if (!user) {
      res.render('login', {
        error: 'Invalid Login Credentials!',
      });
    } else {
      argon2.verify(user.password, req.body.password).
      then(function(match) {
        if (match) {

          user.password = undefined;
          req.session.user = user;
          res.redirect('back');
        } else {
          res.render('login', {
            error: 'Invalid Login Credentials!',
          });
        }
      }).catch(function(err) {
        console.error(err);
      });
    }
  });
});

router.get('/auth', function(req, res, next) {
  res.redirect('/');
});

router.get('/logout', function(req, res, next) {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
