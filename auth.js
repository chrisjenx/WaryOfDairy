/**
 * Routing middleware, check user is logged in for this action(s)
 * @param req
 * @param res
 * @param next
 */
exports.checkAuth = function (req, res, next) {
//  if (!req.session.user_id) {
  if (!req.session.user) {
    req.session.error = 'You are not authorized to view this page';
    res.redirect('/users/login');
  } else {
    next();
  }
};