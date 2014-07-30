var express = require('express');
var checkAuth = require('../auth').checkAuth;
var router = express.Router();

var marked = require('marked');

/**
 * @param db {required} the monk db object
 * @param func {required} for callbacks of results callback(err, docs){err, array of posts}
 */
function loadPosts(db, func) {
  db.get('posts').find({ 'publish': true }, {}, function (err, docs) {
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

/* GET post for id */
router.get('/:id', function (req, res) {
  req.posts.findOne({_id: req.params.id}, {}, function (err, doc) {
    doc.content = marked(doc.content);
    res.render('blog/post', {
      'post': doc
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
    // Get our form values. These rely on the "name" attributes
    var title = req.body.title;
    var content = req.body.content;
    var publish = req.body.publish === "on";

    req.posts.insert({
      "title": title,
      "content": content,
      "publish": publish,
      "created_at": new Date(),
      "updated_at": new Date(),
      "created_user_id": req.session.user._id
    }, function (err, doc) {
      // Return error or success :)
      if (err) {
        req.session.error = 'Error saving post: ' + err.message;
        res.redirect('back');
      } else {
        req.session.success = 'Post created';
        res.redirect('/blog/' + doc._id);
      }
    });
  });

module.exports = router;
module.exports.loadPosts = loadPosts;
