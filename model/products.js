var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var dataTables = require('datatables-query');

var ProductSchema = new Schema({
  title: String,
  barcode: String,
  name: String,
  ean: String,
})
ProductSchema.plugin(dataTables);
module.exports = mongoose.model('products', ProductSchema);
