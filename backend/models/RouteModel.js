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
        createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        // A normalized undirected key to prevent duplicates regardless of direction
        undirectedKey: { type: String }

}, {timestamps: true})

RouteSchema.index({fromTera : 1})
RouteSchema.index({toTera : 1})
// Unique undirected combination (requires from/to sorted)
RouteSchema.index({ undirectedKey: 1 }, { unique: true, partialFilterExpression: { undirectedKey: { $type: 'string' } } });

// Pre-save hook to compute undirectedKey as sorted pair of ids
RouteSchema.pre('save', function(next) {
    try {
        const a = this.fromTera?.toString();
        const b = this.toTera?.toString();
        if (a && b) {
            this.undirectedKey = [a, b].sort().join(':');
        }
        next();
    } catch (e) {
        next(e);
    }
});

module.exports = mongoose.model('Route', RouteSchema);