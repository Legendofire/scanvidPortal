exports.getItems = function(req, res, next){
  if(req.user.isBrand){
    var where = {
      brandName = req.user.brand;
    }
  }else{

  }
}
