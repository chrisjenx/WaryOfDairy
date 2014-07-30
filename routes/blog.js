var express = require('express');
var checkAuth = require('../auth').checkAuth;
var router = express.Router();

/**
 * @param db {required} the monk db object
 * @param func {required} for callbacks of results callback(err, docs){err, array of posts}
 */
function loadPosts(db, func) {
  db.get('posts').find({}, {}, function (err, docs) {
    if (err) func(err, null);
    return func(null, docs);
  });
}

/* GET users listing. */
router.get('/', function (req, res) {
  loadPosts(req.db, function (err, posts) {
    res.render('blog/index', {
      posts: posts
    });
  });
});

/* GET create blog */
router.route('/create')
  .all(checkAuth)
  .get(function (req, res) {
    res.render('blog/create');
  })
  .post(function (req, res) {

  });

module.exports = router;
module.exports.loadPosts = loadPosts;
