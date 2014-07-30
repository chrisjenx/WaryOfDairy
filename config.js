/**
 * Created by chris on 26/07/2014.
 */

module.exports = exports = function (express, db) {

  // Init config
  var users = db.get('users');
  users.index('email', { unique: true });


  var posts = db.get('posts');

};