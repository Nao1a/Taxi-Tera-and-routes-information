const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, minlength: 3 },
    password: { type: String, required: true, minlength: 8 },
    email : {type : String, required: true, unique: true},
    isVerified: { type: Boolean, default: false },
    role: {
        type : String,
        enum : ['user', 'moderator', 'admin' , 'taxiOwner'],
        default : 'user'
    },
    reputation : {type : Number, default : 5}
}, { timestamps : true })

module.exports = mongoose.model('User', UserSchema)
