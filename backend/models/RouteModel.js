const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
    fromTera: {type : mongoose.Schema.Types.ObjectId, ref: 'TaxiTera', required: true},
    toTera: {type : mongoose.Schema.Types.ObjectId, ref: 'TaxiTera', required: true},
    fare : {type: Number, required: true},
    distance: {type: Number, },
    estimatedTimeMin: {type: Number, required: true},
    roadCondition: {type: String,  enum : ['good', 'average', 'poor'] , default : 'good'},
    availabilityMin: {type: Number, default: 10},
    status : {type : String , enum : ['approved', 'pending', 'rejected'], default: 'pending'},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}

}, {timestamps: true})

RouteSchema.index({fromTera : 1})
RouteSchema.index({toTera : 1})

module.exports = mongoose.model('Route', RouteSchema);