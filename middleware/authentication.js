const userGroups = require('./../config/userGroups');

var User = require('./../model/users.js');
var Prospect = require('./../model/prospect.js');

exports.userLoggedWithAccessTo = function(resource, action) {
  return function(req, res, next) {
    var current_user = req.session.user;
    if (req.session && current_user) {
      const path = req.originalUrl.split('/')[1];
      if (userGroups[current_user.type][resource][action]) {
        if (userGroups[current_user.type].selfOnly) {
          if (req.params.pid) {
            Prospect.findOne({
              _id: req.params.pid
            }).
            exec().
            then(function(value, err) {
              if (err) console.error(err);
              if (value.sales == current_user._id
                ||value.technical_sales == current_user._id) {
                next();
              } else {
                res.render('page_403');
              }
            });
          }
          else if (req.params.uid) {
            User.findOne({
              _id: req.params.uid
            }).
            exec().
            then(function(value, err) {
              if (err) console.error(err);
              if (value._id == current_user._id) {
                next();
              } else {
                res.render('page_403');
              }
            });
          }
          else {
            next();
          }
        } else {
          next();
        }
      } else {
        res.render('page_403');
      }
    } else {
      res.render('login', {
        error: "Please Login First!"
      });
    }
  }
}

exports.userLoggedIn = function(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.render('login', {
      error: "Please Login First!"
    });
  }
}
