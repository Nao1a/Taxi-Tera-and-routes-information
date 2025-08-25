const mongoose = require('mongoose');

const taxiTeraSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  address: String,
  notes: String,
  condition: { type: String, enum: ['good','average','poor'], default: 'good' },
  createdAt: { type: Date, default: Date.now },
  
} , {timestamps : true});

taxiTeraSchema.index({ location: '2dsphere' });
// Enforce uniqueness of name (case-insensitive collation should be set on collection)
taxiTeraSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('TaxiTera', taxiTeraSchema);
