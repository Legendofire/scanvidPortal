const User = require('./../model/users.js');

exports.userLoggedIn = function(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.render('login', {
      error: "Please Login First!"
    });
  }
}

exports.adminLoggedIn = function(req, res, next) {
  if (req.session && req.session.user) {
    if(!req.session.user.isBrand){
      next();
    }else{
      res.render('login', {
        error: "You are not an Admin!"
      });
    }
  } else {
    res.render('login', {
      error: "Please Login First!"
    });
  }
}
