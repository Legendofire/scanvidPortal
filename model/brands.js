let mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let BrandsSchema = new Schema({
  brandName: String,
})

module.exports = mongoose.model('brands', BrandsSchema);
