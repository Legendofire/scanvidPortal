var express = require('express');
var router = express.Router();
var jwt = require('jwt-express');

var User = require('./../../model/users.js');
var Product = require('./../../model/product.js');

var auth = require('./../../middleware/api/auth.js');
const resource = 'Users';

//Users CRUD
// GET a User
router.get('/:id', auth.userLoggedWithAccessTo(resource,'View'), function(req, res, next){
  User.findOne(
    {_id:req.params.id}
  ).
  exec(function(err,value){
      value['password']=undefined;
      res.status(200).json(value);
  });
});
// GET all Users
router.get('/', auth.userLoggedWithAccessTo(resource,'ViewAll'), function(req, res, next){
  User.find({}).
  exec(function(err,value){
      value['password']=undefined;
      res.status(200).json({
        data : value
      });
  });
});
//Add a User
router.post('/', auth.userLoggedWithAccessTo(resource,'Add'), function(req, res, next) {
  var user = new User({
    username: req.body.username,
    password: req.body.password,
    full_name: req.body.full_name,
    email: req.body.email,
    phone: req.body.phone,
    type: req.body.type
  });

  user.save(function(err){
    if (err) {
      res.status(500).json(err);
    }else{
      res.status(200).json({
        Message : 'Resource Saved Successfully'
      });
    }
  });
});

//Update User Info
router.put('/:uid', auth.userLoggedWithAccessTo(resource,'Edit'), function(req, res, next){
  User.findById(req.params.uid ,function(err,user){
    if(err) res.json(err);

    newObj = {};
    if(req.body.username) newObj.username = req.body.username;
    if(req.body.password) newObj.password = req.body.password;
    if(req.body.full_name) newObj.full_name = req.body.full_name;
    if(req.body.email) newObj.email = req.body.email;
    if(req.body.phone) newObj.phone = req.body.phone;

    User.update({'_id':user._id},newObj,{},function(err,value){
      res.status(200).json({
        "Message":"Resource Added Successfully"
      });
    });
  });

  //res.json(req.body);
});
//Delete User
router.delete('/:uid', auth.userLoggedWithAccessTo(resource,'Delete'), function(req ,res ,next){
  User.findOne({'_id':req.params.uid}).remove(function(err,value){
    if(err) res.json(err);
    res.status(200).json({
      Message : "Resource Added Successfully"
    });
  });
})
// //Delete Prospect from a User
// router.delete('/:uid/prospect/:pid', auth.userLoggedWithAccessTo(resource,'Edit'), function(req ,res ,next){
//   User.update(
//     {'_id': req.params.uid},
//     {
//       $pullAll:
//       { 'prospects': [req.params.pid] }
//     }
//   );
// })

module.exports = router;
