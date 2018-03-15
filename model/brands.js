let mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let BrandSchema = new Schema({
  brandName: {
    type: String,
    required: true,
  },
  date_created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Brands', BrandSchema);
