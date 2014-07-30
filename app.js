var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

// Mongo Connection
var monk = require('monk');
var db = monk('localhost:27017/waryofdairy'),
  postCollection = db.get('posts');

// Routes
var routes = require('./routes/index');
var users = require('./routes/users');
var search = require('./routes/search');
var blog = require('./routes/blog');

var app = express();

// Config
require('./config')(app, db);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Session secret
app.use(session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: 'super secret etc', //TODO generate and store in db.
  store: new MongoStore({
    'db': 'waryofdairy'
  })
}));

// Set view globals
app.use(function (req, res, next) {
  res.locals.title = 'Wary of Dairy';
  res.locals.selected = req.path.toLowerCase();
  res.locals.path = req.path;
  // Make our db accessible to our router
  req.db = db;
  req.posts = postCollection;
  // Session-persisted message middleware
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = err;
  if (msg) res.locals.message = msg;
  // Add users into locals if exists
  var user = req.session.user;
  if (user) res.locals.user = user;
  next();
});


app.use('/', routes);
app.use('/users', users);
app.use('/search', search);
app.use('/blog', blog);

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// On Startup if no users exist we create an admin
db.get('users').count({}, function (err, count) {
  console.log("User Count: " + count);
  if (!err && count === 0) {
    users.createUser(db, "admin", "admin@waryofdairy.com", "password");
  }
});


module.exports = app;
