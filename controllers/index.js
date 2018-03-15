let express = require('express');
let mongoose = require('mongoose');

let Product = require('./../model/products');

exports.getDashboard = function(req, res, next) {
  if(req.session.user.isBrand){
    res.redirect('/brands/view/'+req.session.user.brandName);
  }else{
    let output = {
      'child': 'partials/dashboard/dashboard-content.ejs',
      'current_user': req.session.user
    }
    res.render('layout',output);
  }
};
