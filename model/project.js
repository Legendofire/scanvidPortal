var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ProjectSchema = new Schema({
  serial: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  indecies: [
    {
      name: String,
      KPIs:[
        {
          name: String,
          value: Number,
          actual: Number
        }
      ]
    }
  ],
  owningEntity: String,
  projectExec: String,
  plannedBudget: Number,
  consumedBudget: Number,
  plannedDuration: Number,
  actualDuration: Number,
  startDate: Date,
  actualPerc: Number,
  justification: String,
  execEntity: String
});

module.exports = mongoose.model('Project', ProjectSchema);
