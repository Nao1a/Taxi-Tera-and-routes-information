const mongoose = require('mongoose');

const UserSubmissionSchema = new mongoose.Schema({
  type: { type: String, enum: ['newTera','newRoute','fareUpdate','conditionUpdate'], required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true }, // flexible structure
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  adminNotes: String
}, { timestamps: true });

module.exports = mongoose.model('UserSubmission', UserSubmissionSchema);