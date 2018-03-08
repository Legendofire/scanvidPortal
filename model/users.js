let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  argon2 = require('argon2');

let UserSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  full_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  isBrand:{
    type: Boolean,
    require: true
  },
  brandName:{
    type: String
  },
  date_created: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre('save', function(next) {
  let user = this;

  if (!user.isModified('password')) return next();

  argon2.hash(user.password, {type: argon2.argon2id}).
  then(function(hash) {
    user.password = hash;
    next();
  }).
  catch(function(err) {
    next(new Error(err));
  });
});

module.exports = mongoose.model('User', UserSchema, 'users');
