let mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let apiKeySchema = new Schema({
  key: String,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  limit: Number,
  created: { type: Date, default: Date.now },
  expiry: Number,
  revoked: Boolean,
  allowOverage: Boolean,
  log: [{
      date: { type: Date, default: Date.now },
      function: String,
      productID: { type: Schema.Types.ObjectId, ref: 'Product' }
  }]
})

module.exports = mongoose.model('apiKeys', apiKeySchema);
