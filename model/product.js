let mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let ProductSchema = new Schema({
  name: {
    type: String,
    required: true,
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
