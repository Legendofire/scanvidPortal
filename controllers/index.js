let express = require('express');
let mongoose = require('mongoose');

let Product = require('./../model/products');

exports.getDashboard = function(req, res, next) {
  //let promise = {};
  //Should look something like this (didn't test it yet)
  // let products = [];
  // if(!req.session.user.isBrand){
  //   promise = Product.find({}).exec();
  // }else{
  //   promise = Product.find({'brandName':req.session.user.brandName}).exec();
  // }

  //promise.then(products=>{
    // let output = {
    //   'child': 'partials/dashboard/dashboard-content.ejs',
    //   'current_user': req.session.user,
    //   'dashData': {
    //     'products': products
    //   }
    // }
    // res.render('layout',output);
  //})

  let output = {
    'child': 'partials/dashboard/dashboard-content.ejs',
    'current_user': req.session.user,
    'dashData': {             //here we will add the products
      'prospects': [],
      'actions': [],
      'finishedProspects': []
    }
  }
  res.render('layout',output);
};
