const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Open', 'Assigned', 'Resolved','Escalated'],
        default: 'Open'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Not required initially
    },
    assignedAt: {
        type: Date
    },
    resolvedAt: {
        type: Date
    },
    timeTakenInMinutes: {
        type: Number
    },
    resolutionComment: { type: String },
    escalationComment: { type: String },
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;