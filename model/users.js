var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  argon2 = require('argon2');


var Prospect = require('./prospect');

var UserSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  full_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  prospects: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Prospect'
    }
  ],
  date_created: {
    type: Date,
    default: Date.now
  }
});

UserSchema.pre('save',function(next){
  var user = this;

  if(!user.isModified('password')) return next();

  argon2.hash(user.password,{type:argon2.argon2id}).
  then(function(hash){
    user.password = hash;
    next();
  }).
  catch(function(err){
    next(new Error(err));
  });
});

UserSchema.statics.findPopulated = function(id){
  //TODO Add the populate here to slim the router
}

module.exports = mongoose.model('users', UserSchema);
