const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username : String,
    email : {type : String, required: true, unique: true},
    role: {
        type : String,
        enum : ['user', 'moderator', 'admin' , 'taxoOwner'],
        default : 'user'
    },
    reputation : {type : Number, default : 5}
}, { timestamps : true })

module.exports = mongoose.model('User', UserSchema)
