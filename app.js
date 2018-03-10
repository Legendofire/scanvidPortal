let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let session = require('express-session');
let jwt = require('jsonwebtoken');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

let promise = mongoose.connect('mongodb://scanvidDb:ZhaWVhTj7CmZPKrx@cluster0-shard-00-00-blfgg.mongodb.net:27017,cluster0-shard-00-01-blfgg.mongodb.net:27017,cluster0-shard-00-02-blfgg.mongodb.net:27017/scanvid?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin', {
  useMongoClient: true,
});

promise.then(function(db) {
  console.log('DB Connected');
}).catch(function(e) {
  console.log('DB Not Connected');
  console.error(e);
});

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'asdhfkhg432kj1gkjhgjkgh2k13j4gkjg',
  resave: true,
  saveUninitialized: true,
  rolling: true,
  cookie: {
    secure: false,
    maxAge: 30*60*1000,
  },
}));

// Application Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/products', require('./routes/products'));
app.use('/brands', require('./routes/brands'));
app.use('/api', require('./routes/api/mobileapp'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
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
