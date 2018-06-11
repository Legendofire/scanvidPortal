let apiKeys = require('../../model/apiKeys');

exports.shallPass = function(req, res, next) {
    // TODO: Check if API Key is Attached
    if(req.body.apiKey){
      // TODO: Get Key from DB
      apiKeys.find({key:req.body.apiKey}).exec().then((key) => {
          if(key.length > 0){
              if(){
                
              }
          } else {
              res.json({code:400,message:'API Key is not valid, Please contact the Admin.'})
          }
      }).catch((error) => {
          console.error(error);
          res.json({code:500,message:'Internal Server Error, Please contact the Admin.'})
      })
      // TODO: Check if API Key is valid
          // TODO: Check if not expired
          // TODO: Check if not revoked
      // TODO: Check if Key has access to resource
      // TODO: Log API Usage
    } else {
        res.json({code:400,message:'Missing API key, Please contact the Admin to generate one.'})
    }
};
