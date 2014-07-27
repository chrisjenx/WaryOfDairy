var express = require('express');
var router = express.Router();

/**
 * @param db {required} the monk db object
 * @param func {required} for callbacks of results callback(err, docs){err, array of posts}
 */
function getAllPosts(db, func) {
  db.get('posts').find({}, {}, function (err, docs) {
    if (err) func(err, null);
    return func(null, docs);
  });
}

/* GET users listing. */
router.get('/', function (req, res) {
  getAllPosts(req.db, function (err, posts) {
    res.render('blog/index', {
      posts: posts
    });
  });
});


// TODO auth

/* GET create blog */
router.get('/create', function (req, res) {

});

module.exports = router;
