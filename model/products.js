let mongoose = require('mongoose'),
  Schema = mongoose.Schema;
var dataTables = require('datatables-query');
var mongoosePaginate = require('mongoose-paginate');

let ProductSchema = new Schema({
  title: String,
  barcode: String,
  brand:String,
  tags:Object
})

//Tags contain {
//   category1: String,
//   category2: String,
//   manual: String,
//   image: String
// }

ProductSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('products', ProductSchema);
