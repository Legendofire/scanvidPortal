let express = require('express');
let router = express.Router();
let bcrypt = require('bcrypt');
let _ = require('lodash');
let User = require('./../model/users');
let Products = require('./../controllers/products');
let Index = require('./../controllers/index');

let auth = require('./../middleware/authentication');

router.get('/api/getAll',Products.getAllProducts);
router.get('/api/dbSearch',Products.searchDb);
router.get('/api/dbSearchBarcode',Products.dbSearchBarcode);
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
      bcrypt.compare(req.body.password, user.password).then(function(match) {
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
