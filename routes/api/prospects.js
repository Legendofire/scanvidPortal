var express = require('express');
var router = express.Router();

var auth = require('./../../middleware/api/auth.js');
const resource = 'Prospects';

var Prospect = require('./../../model/prospect.js');
var Product = require('./../../model/product.js');
var User = require('./../../model/users.js');

// Add a Prospects
router.post('/', auth.userLoggedWithAccessTo(resource, 'Add'), function(req, res, next) {
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
    if (err) res.status(500).json(err);
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
    ).then(function(value, err) {
      if (err) res.status(500).json(err);
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
        if (err) res.status(500).json(err);
        res.status(200).json({
          Message: 'Resource Added Successfully'
        });
      });
    });
  });
});
//Edit a Prospect
router.put('/:pid', auth.userLoggedWithAccessTo(resource, 'Edit'), function(req, res, next) {
  var prospect = {};
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
  if (req.user.type === 'Admin') {
    if (req.body.creator) prospect.creator = req.body.creator;
  }

  Prospect.findOneAndUpdate({
    _id: req.params.pid
  }, prospect, {
    upsert: true
  }, function(err, doc) {
    if (err) res.status(500).json(err);
    res.status(200).json({
      'Message': 'Resource Edited Successfully'
    })
  });
});
router.put('/:pid/addAction', auth.userLoggedWithAccessTo(resource, 'Edit'), function(req, res, next) {
  if(req.body.action_type !== 'Done' || (req.body.action_type === 'Done' && req.body.sales_connect_id)){
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
            if (err) res.status(500).json(err);;
          });
      }
      res.status(200).json({
        Message : 'Action Added Successfully'
      });
    });
  }else{
    res.status(500).json({
      Message : 'Missing Sales Connect ID'
    });
  }
});
//Get All Prospects
router.get('/', auth.userLoggedWithAccessTo(resource, 'ViewAll'), function(req, res, next) {
  var query = {};
  var start = req.query.start_date;
  var end = req.query.end_date;
  if (req.query.start_date && req.query.end_date) {
    query = {
      date_created: {
        $gte: start,
        $lte: end
      }
    }
  }
  else if(req.query.start_date){
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
  populate('sales', '_id full_name').
  populate('technical_sales', '_id full_name').
  exec(function(err, value) {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json({
        data: value
      })
    }
  });
});
//Get A Prospect
router.get('/:id', auth.userLoggedWithAccessTo(resource, 'View'), function(req, res, next) {
  var query = {
    _id : req.params.id
  };
  if (req.query.start_date && req.query.end_date) {
    query.date_created = {
        $gte: start,
        $lte: end
    }
  }
  else if(req.query.start_date){
    query.date_created = {
        $gte: start
    }
  }
  else if (req.query.end_date) {
    query.date_created = {
        $lte: end
    }
  }

  Prospect.find({
    '_id': req.params.id
  }).
  populate('sales').
  populate('technical_sales').
  exec(function(err, value) {
    if (err) {
      rres.status(500).json(err);
    } else {
      res.json({
        status: 200,
        data: value
      });
    }
  });
});
router.get('/for/:uid', auth.userLoggedWithAccessTo(resource, 'View'), function(req, res, next) {
  User.findOne({
    _id: req.params.uid
  }).
  populate('prospects').
  exec().
  then(function(user, err) {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json({
        Data: user.prospects
      })
    }
  });
});
//Delete A Prospect
router.delete('/:id', auth.userLoggedWithAccessTo(resource, 'Delete'), function(req, res, next) {
  //TODO Delete from Users
  Prospect.findOne({
    '_id': req.params.id
  }).remove(function(err, value) {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json({
        Message: 'Resource Deleted Successfully'
      })
    }
  });
});
module.exports = router;
