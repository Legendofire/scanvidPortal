let express = require('express');
let router = express.Router();
let argon2 = require('argon2');
// var jwt = require('jwt-express');
let jwt = require('jsonwebtoken');
let Users = require('./../../model/users.js');

router.post('/', function(req, res, next) {
  Users.findOne({'username': req.body.username}).
  exec(function(err, value) {
    if (err) res.json(err);
    argon2.verify(value.password, req.body.password).
    then(function(match) {
      value.password = undefined;
      if (match) {
        res.status(200).json({
          'message': 'Successful Login',
          'token': jwt.sign({
            'username': value.username,
            '_id': value._id,
            'type': value.type,
          }, 'CLOUDMANAGEAPI'),
          'user': value,
        });
        res.status(401).json({'message': 'Invalid Login Credentials'});
      }
    });
  });
});

module.exports = router;
