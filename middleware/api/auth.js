// const userGroups = require('./../../config/userGroups');
//
// var User = require('./../../model/users.js');
// var Prospect = require('./../../model/prospect.js');
//
// exports.userLoggedWithAccessTo = function(resource, action) {
//   return function(req, res, next) {
//     var current_user = req.user;
//     if (current_user) {
//       const path = req.originalUrl.split('/')[3];
//       if (userGroups[current_user.type][resource][action]) {
//         if (userGroups[current_user.type].selfOnly) {
//           if (req.params.pid) {
//             Prospect.findOne({
//               _id: req.params.pid
//             }).
//             exec().
//             then(function(value, err) {
//               if (err) console.error(err);
//               if (value.sales == current_user._id
//                 ||value.technical_sales == current_user._id) {
//                 next();
//               } else {
//                 res.status(401).json({
//                   error: "Insufficient Access Level"
//                 });
//               }
//             });
//           }
//           else if (req.params.uid) {
//             User.findOne({
//               _id: req.params.uid
//             }).
//             exec().
//             then(function(value, err) {
//               if (err) console.error(err);
//               if (value._id == current_user._id) {
//                 next();
//               } else {
//                 res.status(401).json({
//                   error: "Insufficient Access Level"
//                 });
//               }
//             });
//           }
//           else {
//             next();
//           }
//         } else {
//           next();
//         }
//       } else {
//         res.status(401).json({
//           error: "Insufficient Access Level"
//         });
//       }
//     } else {
//       res.status(401).json({
//         error: "Unauthorized Access"
//       });
//     }
//   }
// }
//
exports.userLoggedIn = function(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.status(401).json({
      error: 'Unauthorized Access',
    });
  }
};
