const mongoose = require('mongoose');

const hireRequestSchema = new mongoose.Schema({
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Snapshot of terms at time of application
  proposedGebi: { type: Number }, 
  experienceYears: { type: Number },
  notes: { type: String },

  // Negotiation History
  offerHistory: [{
      amount: Number,
      by: { type: String, enum: ['driver', 'owner'] },
      createdAt: { type: Date, default: Date.now }
  }],
  
  status: {
    type: String,
    enum: ['applied', 'chatting', 'hired', 'rejected', 'ended'],
    default: 'applied'
  }
}, { timestamps: true });

module.exports = mongoose.model('HireRequest', hireRequestSchema);