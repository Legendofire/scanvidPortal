var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var dataTables = require('datatables-query');
var mongoosePaginate = require('mongoose-paginate');

var ProductSchema = new Schema({
  title: String,
  barcode: String,
  name: String,
  ean: String,
  brand:String,
})

ProductSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('products', ProductSchema);
