let apiKeys = require("../../model/apiKeys");

exports.shallPass = function(req, res, next) {
  if (req.body.apiKey) {
    apiKeys
      .find({ _id: req.body.apiKey })
      .populate("user")
      .exec()
      .then(key => {
        if (key.length > 0) {
          let currentTimeStamp = new Date().getTime();
          let timeStampDifference = key[0].expiry - currentTimeStamp;
          if (key[0].revoked) {
            res.json({
              code: 400,
              message: "API Key is revoked, Please Contact the Admin."
            });
          } else if (timeStampDifference < 0) {
            res.json({
              code: 400,
              message:
                "API Key is expired, Please Contact the Admin to Generate a new one."
            });
          } else {
            let numberOfCalls = key[0].log.length;
            if (numberOfCalls > key[0].limit) {
              if (key[0].allowOverage) {
                if (key[0].user.isBrand) {
                  req.brandName = key[0].user.brandName;
                } else {
                  req.brandName = "Admin";
                }
                next();
              } else {
                res.json({
                  code: 400,
                  message:
                    "API Key Limit reached, Please Contact the Admin to Extend limit or Allow Overage."
                });
              }
            } else {
              if (key[0].user.isBrand) {
                req.brandName = key[0].user.brandName;
              } else {
                req.brandName = "Admin";
              }
              next();
            }
          }
        } else {
          res.json({
            code: 400,
            message:
              "API Key is not valid, Please Make sure you have the right API Key."
          });
        }
      })
      .catch(error => {
        console.error(error);
        res.json({
          code: 500,
          message: "Internal Server Error, Please contact the Admin."
        });
      });
  } else {
    res.json({
      code: 400,
      message:
        'Missing API key: please use post field "apiKey" for attaching a key.'
    });
  }
};
