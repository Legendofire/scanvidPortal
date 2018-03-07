'use strict';

const passport = require('passport');
const Stategy = require('passport-local').Strategy;
const User = require('./model/user');

passport.use(new Strategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

module.exports = passport;
