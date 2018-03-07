var express = require('express');
var router = express.Router();
var argon2 = require('argon2');
//var jwt = require('jwt-express');
var jwt = require('jsonwebtoken');
var Users = require('./../../model/users.js');
var Prospect = require('./../../model/prospect.js');

router.post('/', function(req, res, next) {
  Users.findOne({'username':req.body.username}).
  populate('prospects').
  exec(function(err,value){
    if(err) res.json(err);
    argon2.verify(value.password,req.body.password).
    then(function(match){
      value.password = undefined;
      if(match){
        res.status(200).json({
          'message':'Successful Login',
          'token':jwt.sign({
            'username':value.username,
            '_id':value._id,
            'type':value.type
          }, 'CLOUDMANAGEAPI'),
          'user':value
        });
        res.status(401).json({'message':'Invalid Login Credentials'});
      }
    })
  })
});

module.exports = router;
