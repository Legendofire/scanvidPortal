let express = require('express');
let router = express.Router();
let argon2 = require('argon2');
let _ = require('lodash');
let User = require('./../model/users');
let Product = require('./../model/product');

let auth = require('./../middleware/authentication');

/* GET home page. */
router.get('/', auth.userLoggedIn, function(req, res, next) {
  console.log(req.session.user);
  if(req.session.user.isBrand){
    let brandName = req.session.user.brandName;
    res.json(`this is ${brandName} and it's a Brand not an Admin`);
  }else{
    res.json(`this is an Admin`);
  }
  //
  // res.render('layout', {
  //   child: 'partials/dashboard/dashboard-content.ejs',
  //   current_user: req.session.user,
  // });
});


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
