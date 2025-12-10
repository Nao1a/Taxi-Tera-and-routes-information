const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, minlength: 3 },
    password: { type: String, required: true, minlength: 8 },
    email : {type : String, required: true, unique: true},
    isVerified: { type: Boolean, default: false },
    role: {
        type : String,
        enum : ['user', 'moderator', 'admin', 'taxiDriver'],
        default : 'user'
    },
    reputation : {type : Number, default : 5},
    isSubmissionBanned: { type: Boolean, default: false },
    submissionBanReason: { type: String },
    // Account ban (complete ban from platform)
    isAccountBanned: { type: Boolean, default: false },
    accountBanReason: { type: String },
    accountBannedAt: { type: Date },
    // Driver-specific fields
    driverDetails: {
        licenseText: { type: String },
        carPlate: { type: String },
        carType: { type: String },
        verificationStatus: {
            type: String,
            enum: ['unverified', 'pending', 'verified', 'rejected'],
            default: 'unverified'
        },
        documents: {
            licensePhoto: { type: String }, // Cloudinary URL
            carPhoto: { type: String } // Cloudinary URL
        },
        currentRoute: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
        routeAssignedDate: { type: Date },
        isBannedFromRoute: { type: Boolean, default: false },
        routeBanReason: { type: String }
    }
}, { timestamps : true })

module.exports = mongoose.model('User', UserSchema)
