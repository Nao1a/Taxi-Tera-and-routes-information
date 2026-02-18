const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // The Route Permit belongs to the Car. Can be null if "Any Route" or "No Permit"
  routeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Route',
    default: null
  },
  
  // Basic Info
  make: { type: String, required: true },
  model: { type: String, required: true },
  plateNumber: { type: String, required: true, unique: true },
  maxPassengers: { type: Number, default: 4 },
  
  // Verification (The "Libre")
  libreImage: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  rejectionReason: { type: String },

  // Rental Terms
  gebiAmount: { type: Number, required: true }, // Daily/Weekly amount
  paymentFrequency: { type: String, enum: ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly'], default: 'Weekly' }, 
  conditions: { type: String }, // Usage conditions text

  // Status
  status: {
    type: String,
    enum: ['pending', 'available', 'hired', 'maintenance', 'rejected'],
    default: 'pending' // Pending Admin Approval of the Libre
  }
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);