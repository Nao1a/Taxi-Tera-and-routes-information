const mongoose = require('mongoose');

const taxiTeraSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  address: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  
} , {timestamps : true});

taxiTeraSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('TaxiTera', taxiTeraSchema);
