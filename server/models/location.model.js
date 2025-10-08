const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    ipAddress: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Available', 'Assigned'],
        default: 'Available'
    }
});

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;