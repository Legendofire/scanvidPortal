var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ProductSchema = new Schema({
  name: {
    type: String,
    required: false
  },
  barcode: {
    type: String,
    required: false
  },
  brand: {
    type: String,
    required: false
  },
  title: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('Product', ProductSchema);
