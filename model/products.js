let mongoose = require('mongoose'),
  Schema = mongoose.Schema;
let dataTables = require('datatables-query');

let ProductSchema = new Schema({
  title: String,
  barcode: String,
  name: String,
  ean: String,
  website: String,
  youtube: String,
  image: String,
  video: String
});

ProductSchema.plugin(dataTables);
module.exports = mongoose.model('products', ProductSchema);
