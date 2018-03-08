var express = require('express');
var router = express.Router();
var argon2 = require('argon2');
var _ = require('lodash');
var User = require('./../model/users');
var Prospect = require('./../model/prospect');
var Product = require('./../model/product');
var Products = require('./../controllers/products');

var ProspectCont = require('./../controllers/prospects');

var auth = require('./../middleware/authentication');

router.get('/testFady',function(req, res, next){
  //Products.getAllProducts(req,res,next);
  
});

router.get('/test',function(req, res, next){
  var start_date = req.query.start_date?new Date(req.query.start_date):new Date(2014, 0, 1);
  var end_date = req.query.end_date?new Date(req.query.end_date):new Date(2030, 0, 1);
  ProspectCont.getFinishedProspectsIn(start_date,end_date).then(function(value){
    console.log(value);
    res.json(value);
  }).catch(function(err){
    console.log(err);
  });
});

/* GET home page. */
router.get('/', auth.userLoggedIn, function(req, res, next) {
  if(req.session.user.type === "Sales" || req.session.user.type === "Tech"){
    res.redirect('users/view/'+req.session.user._id);
  }else{
    var dashData = {};
    var start_date = req.query.start_date?new Date(req.query.start_date):new Date(2014, 0, 1);
    var end_date = req.query.end_date?new Date(req.query.end_date):new Date(2030, 0, 1);

    var dateQuery = {
      date_created: {
        $gte: start_date,
        $lte: end_date
      }
    }

    console.log(dateQuery);
    //MINI Pyramid of DOOM!!
    //TODO Consider Generators
    Product.count({}).exec()
    .then(function(value, err){
      dashData.productsCount = value;
      return Prospect.count({}).exec();
    }).then(function(value, err){
      dashData.prospectsCount = value;
      return User.count({}).exec();
    }).then(function(value, err){
      dashData.usersCount = value;
      return Prospect.find(dateQuery).populate('sales').populate('technical_sales').exec();
    }).then(function(value, err){
      dashData.prospects = value;
      var query = {
        "date_created": {
            $gte: start_date,
            $lte: end_date
          },
        "progression" : "100"
      }
      return Prospect.find(query).populate('sales').populate('technical_sales').exec();
    }).then(function(value, err){
      console.log('finishedProspects',value);
      dashData.finishedProspects = value;
      return ProspectCont.getActionsIn(start_date,end_date);
    }).then(function(value){
      var actions = [];
      value.forEach(function(item,index){
        actions.push(item);
      });
      dashData["actions"] = actions;
      res.render('layout', {
        child: 'partials/dashboard/dashboard-content.ejs',
        current_user: req.session.user,
        dashData:dashData
      });
    }).catch(function(err){
      console.error(err);
      // res.render('error',err);
    });
    //Top Section
    //-users with actions pending this period
    //transaction summary
    //-chart 1 : Prospects in SC vs not in SC
    //-chart 2 : new Actions
    //-chart 3 : new prospects
    //-chart 4 : new SC

  }
});


router.post('/auth', function(req, res, next) {
  User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (err) throw res.json(err);
    if (!user) {
      res.render('login', {
        error: 'Invalid Login Credentials!'
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
            error: 'Invalid Login Credentials!'
          });
        }
      }).catch(function(err){
        console.error(err);
      });
    }
  });
});

router.get('/auth',function(req,res,next){
  res.redirect('/');
});

router.get('/logout', function(req, res, next) {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
