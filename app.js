var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var jwt = require('jsonwebtoken');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var promise = mongoose.connect('mongodb://a7meds3d:Nidalee18@ds157833.mlab.com:57833/cloud-connect', {
  useMongoClient: true
});

promise.then(function(db){
  console.log('DB Connected');
}).catch(function(e){
  console.log('DB Not Connected');
  console.error(e);
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'asdhfkhg432kj1gkjhgjkgh2k13j4gkjg',
  resave: true,
  saveUninitialized: true,
  rolling: true,
  cookie: {
    secure: false,
    maxAge: 30*60*1000
  }
}))

app.all('/api/v1/*',function(req, res, next){
  req.msg = req.headers;
  if(req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT'){
    jwt.verify(req.headers.authorization.split(' ')[1],'CLOUDMANAGEAPI',function(err,decode){
      if(err) {
        req.user = undefined;
        console.error(err);
      }
      req.user = decode;
      next();
    })
  }else{
    req.user = undefined;
    next();
  }
});

// app.all('/*',function(req, res, next){
//   if (req.session.user) {
//     next();
//   } else {
//     res.render('login', {
//       'error': ''
//     });
//   }
// });

//Application Routes
var index = require('./routes/index');
var users = require('./routes/users');
var prospects = require('./routes/prospects');
var products = require('./routes/products');

app.use('/', index);
app.use('/users', users);
app.use('/products', products);
app.use('/prospects', prospects);

//API Routes
var aauth = require('./routes/api/auth');
var ausers = require('./routes/api/users');
var aprospects = require('./routes/api/prospects');
var aproducts = require('./routes/api/products');

app.use('/api/auth', aauth);
app.use('/api/v1/users', ausers);
app.use('/api/v1/product', aproducts);
app.use('/api/v1/prospect', aprospects);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
