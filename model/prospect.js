var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ProspectSchema = new Schema({
  contact_name: {
    type: String,
    required: true
  },
  company_name: {
    type: String,
    required: true
  },
  contact_info: {
    type: Array,
    required: true
  },
  description:{
    type: String,
    required: true
  },
  product:{
    type: Schema.Types.ObjectId, ref: 'Product'
  },
  progression:{
    type: String
  },
  creator:{
    type: String
  },
  sales: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  technical_sales: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  actions: [{
    type: {type: String},
    description: {type: String},
    date: {type: Date}
  }],
  sales_connect_id: {
    type: String
  },
  date_created: {
    type: Date,
    default: Date.now
  }
});

ProspectSchema.index({ "actions.date": 1 });

module.exports = mongoose.model('Prospect', ProspectSchema);
