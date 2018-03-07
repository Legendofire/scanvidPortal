var express = require('express');
var router = express.Router();
var ObjectId = require('mongoose').Types.ObjectId;
var faker = require('faker');

var auth = require('./../middleware/authentication.js');

const resource = 'Prospects';

var User = require('./../model/users.js');
var Prospect = require('./../model/prospect.js');
var Product = require('./../model/product.js');

router.get('/', auth.userLoggedWithAccessTo(resource, 'ViewAll'), function(req, res, next) {
  var output = {
    child: 'partials/prospects/table.ejs',
    current_user: req.session.user
  };

  var query = {};
  if (req.query.start_date && req.query.end_date) {
    query = {
      date_created: {
        $gte: start,
        $lte: end
      }
    }
  }
  else if (req.query.start_date) {
    query = {
      date_created: {
        $gte: start
      }
    }
  }
  else if (req.query.end_date) {
    query = {
      date_created: {
        $lte: end
      }
    }
  }

  Prospect.find(query).
  populate('products').
  populate('sales').
  populate('technical_sales').
  exec().
  then(function(prospects) {
    output.prospects = prospects;
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

router.get('/for/:uid', auth.userLoggedWithAccessTo(resource, 'View'), function(req, res, next) {
  var output = {
    child: 'partials/prospects/table.ejs',
    current_user: req.session.user
  };

  User.findOne({
    _id: req.params.uid
  }).
  populate('prospects').
  exec().
  then(function(user, err) {
    output.prospects = user.prospects;
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

router.get('/view/:pid', auth.userLoggedWithAccessTo(resource, 'View'), function(req, res, next) {
  Prospect.findOne({
    _id: req.params.pid
  }).
  populate('sales').
  populate('technical_sales').
  populate('product').
  exec().
  then(function(value, err) {
    if (err) console.error(err);
    res.render('layout', {
      child: 'partials/prospects/view.ejs',
      current_user: req.session.user,
      prospect: value
    });
  });
});

router.post('/add', auth.userLoggedWithAccessTo(resource, 'Add'), function(req, res, next) {
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

  Prospect.create(prospect, function(err, value) {
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
    ).then(function(err, value) {
      if (err) console.error(err);
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
      ).then(function(value, err) {
        if (err) console.error(err);
        res.redirect('/prospects/view/' + prospect_id);
      });
    });
  });
});

router.get('/add', function(req, res, next) {
  res.redirect('/prospects');
});

router.post('/:pid/addAction', auth.userLoggedWithAccessTo(resource, 'Edit'), function(req, res, next) {
  if (req.body.action_type !== 'Done' || (req.body.action_type === 'Done' && req.body.sales_connect_id)) {
    Prospect.findByIdAndUpdate(
      req.params.pid, {
        $push: {
          "actions": {
            type: req.body.action_type,
            description: req.body.action_description,
            date: req.body.action_date,
          }
        }
      }, {
        safe: true,
        upsert: true,
        new: true
      },
      function(value, err) {
        if (err) console.log(err);
        if (req.body.action_type === "Done") {
          Prospect.findByIdAndUpdate(
            req.params.pid, {
              progression: 100,
              sales_connect_id: req.body.sales_connect_id
            }, {
              safe: true,
              upsert: true,
              new: true
            },
            function(value, err) {
              if (err) console.log(err);
            });
        }
        res.redirect('/prospects/view/' + req.params.pid);
      });
  } else {
    res.redirect('/prospects/view/' + req.params.pid);
  }
});

router.get('/edit/:pid', auth.userLoggedWithAccessTo(resource, 'Edit'), function(req, res, next) {
  Prospect.findOne({
    _id: req.params.pid
  }).exec().then(function(value, err) {
    if (err) console.error(err);
    var output = {
      child: 'partials/prospects/edit.ejs',
      current_user: req.session.user,
      prospect: value
    };
    res.render('layout', output);
  });
});

router.post('/edit/:pid', auth.userLoggedWithAccessTo(resource, 'Edit'), function(req, res, next) {
  Prospect.findOne({
    _id: req.params.pid
  }).exec().then(function(prospect, err) {
    if (err) console.error(err);
    if (req.body.contact_name) prospect.contact_name = req.body.contact_name;
    if (req.body.company_name) prospect.company_name = req.body.company_name;
    if (req.body.contact_info) prospect.contact_info = req.body.contact_info;
    if (req.body.description) prospect.description = req.body.description;
    if (req.body.product) prospect.product = req.body.product;
    if (req.body.progression) prospect.progression = req.body.progression;
    if (req.body.progression > 99) prospect.progression = 99;
    if (req.body.creator) prospect.creator = req.body.creator;
    if (req.body.sales) prospect.sales = req.body.sales;
    if (req.body.technical_sales) prospect.technical_sales = req.body.technical_sales;
    if (req.body.sales_connect_id) prospect.sales_connect_id = req.body.sales_connect_id;

    if (req.session.user.type === 'Admin') {
      if (req.body.creator) prospect.creator = req.body.creator;
    }

    prospect.save(function(value, err) {
      if (err) console.error(err);
      res.redirect('/prospects/view/' + req.params.pid);
    });
  });
});

router.get('/delete/:pid', auth.userLoggedWithAccessTo(resource, 'Delete'), function(req, res, next) {
  Prospect.findOne({
    _id: req.params.pid
  }).remove().exec().then(function(err, value) {
    if (err) console.error(err);
    //TODO Delete from Users
    res.redirect('/prospects');
  });
});

router.get('/seed/:num', function(req, res, next) {
  addRandProspect(req.params.num);
});

function addRandProspect(num){
  if(num>0){
    var prospect = {
      contact_name: faker.name.findName(),
      company_name: faker.company.companyName(),
      contact_info: [faker.internet.email()],
      description: faker.company.catchPhrase(),
      progression: faker.random.number(90),
      creator: faker.random.arrayElement(['Admin','Sales','Tech']),
      product: '59b445e8c27c2437d197cdff',
      sales: faker.random.arrayElement(['59bdc631022a9a5e61f4a5d8','59bdc78f022a9a5e61f4a5d9','59bdcf25824522688845a0a5']),
      technical_sales: faker.random.arrayElement(['59bdc7e4022a9a5e61f4a5da','59bdc838022a9a5e61f4a5db','59bdc887022a9a5e61f4a5dc','59bdc8f0022a9a5e61f4a5dd','59bdc940022a9a5e61f4a5de']),
      date_created: faker.date.between('2017-01-01', '2018-01-01')
    }
    var prospect_id = '';

    Prospect.create(prospect, function(err, value) {
      prospect_id = value._id;
      //if (err) console.error(err);
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
      ).then(function(err, value) {
        //if (err) console.error(err);
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
        ).then(function(value, err) {
          //if (err) console.error(err);
          console.log(num);
          addRandProspect(num-1);
        });
      });
    });
  }else{
    return;
  }
}
module.exports = router;
