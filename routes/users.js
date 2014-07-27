var express = require('express');
var checkAuth = require('../auth').checkAuth;
var hash = require('../pass').hash;
var router = express.Router();

// Authenticate using mongo database of doom!
function authenticate(db, name, pass, fn) {
  console.log('Authenticating %s:%s', name, pass);
  // Open Users table
  var users = db.get('users');
  users.findOne({ username: name }, {}, function (err, user) {
    // Will error if we cant find the user
    if (err || !user) return fn(new Error('Invalid Details'), null);
    // apply the same algorithm to the POSTed password, applying
    // the hash against the pass / salt, if there is a match we
    // found the user
    hash(pass, user.salt, function (err, hash) {
      if (err) return fn(err, null);
      if (hash == user.hash) {
        // Don't want the password floating around the system
        delete user.hash;
        delete user.salt;
        return fn(null, user);
      }
      fn(new Error('Invalid Details'));
    });
  });
}

function createUser(db, userName, userEmail, userPass, func) {
  // when you create a user, generate a salt & password hash
  var users = db.get('users');
  hash(userPass, function (err, salt, hash) {
    if (err) throw err;
    // store the salt & hash in the "db"
    // Submit to the DB
    users.insert({
      "username": userName,
      "email": userEmail,
      "salt": salt,
      "hash": hash
    }, function (err, doc) {
      // No callback?
      if (!func) return;
      // Return error or success :)
      if (err) return func(err);
      return func(null)
    });
  });
}

/* Login Routes */
router.route('/login')
  /* GET Login page */
  .get(function (req, res) {
    res.render('users/login');
  })
  /* POST Login and Auth User */
  .post(function (req, res) {
    authenticate(req.db, req.body.username, req.body.userpassword, function (err, user) {
      if (user) {
        // Regenerate session when signing in
        // to prevent fixation
        req.session.regenerate(function () {
          // Store the user's primary key
          // in the session store to be retrieved,
          // or in this case the entire user object
          req.session.user = user;
          req.session.success = 'Authenticated as ' + user.username + '.';
          res.redirect('back');
        });
      } else {
        console.error('Failed to login %s', req.body.username);
        req.session.error = 'Authentication failed.';
        res.redirect('login');
      }
    });
  });


// ========
// EVERY THING IS AUTHED FROM HERE DOWN
// ========

// All user pages after login require Auth.
router.use(checkAuth);

/* GET users listing. */
router.get('/', function (req, res) {
  var db = req.db;
  var collection = db.get('users');
  collection.find({}, {}, function (e, docs) {
    res.render('users/list', {
      "userlist": docs
    });
  });
});

router.get('/logout', function (req, res) {
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function () {
    res.redirect('/');
  });
});

/* Create Routes */
router.route('/create')
  /* GET Create User page. */
  .get(function (req, res) {
    res.render('users/create', { title: 'Add New User' });
  })
  /* POST to Create User */
  .post(function (req, res) {
    // Get our form values. These rely on the "name" attributes
    var userName = req.body.username;
    var userEmail = req.body.useremail;
    var userPassword = req.body.userpassword;

    createUser(req.db, userName, userEmail, userPassword, function (err) {
      if (err) {
        // If it failed, return error
        res.send("There was a problem adding the information to the database.");
      } else {
        // And forward to success page
        res.redirect("back");
      }
    });
  });

module.exports = router;
module.exports.createUser = createUser;
