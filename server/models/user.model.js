const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true, // This field must be provided
        unique: true,   // No two users can have the same username
        trim: true      // Removes whitespace from both ends
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'], // The value must be one of these two
        default: 'user'         // If not provided, it will be 'user'
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;