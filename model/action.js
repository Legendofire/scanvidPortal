var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ActionSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  sales_connect_id: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Action', ActionSchema);
