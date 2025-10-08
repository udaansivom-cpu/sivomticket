const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ticket = require('../models/ticket.model');
const Location = require('../models/location.model'); // Ensure Location is imported

// Route: POST /api/tickets/create
// Desc: Create a new ticket for a location
// Access: Private (Admin only)
router.post('/create', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    const { title, description, locationId, priority } = req.body;
    try {
        const newTicket = new Ticket({
            title,
            description,
            location: locationId,
            priority
        });
        await newTicket.save();
        res.status(201).json(newTicket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Route: PUT /api/tickets/:id/assign
// Desc: Assign an existing ticket to a user
// Access: Private (Admin only)
router.put('/:id/assign', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    try {
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            {
                assignedTo: req.body.userId,
                assignedAt: new Date(),
                status: 'Assigned'
            },
            { new: true } // Return the updated document
        );
        if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });
        res.json(ticket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ... keep the existing /mytickets and /:id/resolve routes ...
// They will continue to work, but we'll update the resolve route slightly

// Route: PUT /api/tickets/:id/resolve
// Desc: Mark a ticket as resolved
// Access: Private (Users only)
// Add this new route
router.put('/:id/escalate', auth, async (req, res) => {
    const { escalationComment } = req.body;
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket || ticket.assignedTo.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Ticket not found or user not authorized' });
        }
        if (!escalationComment) {
            return res.status(400).json({ msg: 'Escalation comment is required' });
        }

        ticket.status = 'Escalated';
        ticket.escalationComment = escalationComment;
        await ticket.save();

        res.json({ msg: 'Ticket has been escalated to the admin' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
router.put('/:id/resolve', auth, async (req, res) => {
    const { resolutionComment } = req.body; // Get comment from request body

    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket || ticket.assignedTo.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Ticket not found or user not authorized' });
        }

        ticket.status = 'Resolved';
        ticket.resolvedAt = new Date();
        ticket.resolutionComment = resolutionComment; // <-- SAVE THE COMMENT
        const timeDifference = ticket.resolvedAt.getTime() - ticket.assignedAt.getTime();
        ticket.timeTakenInMinutes = Math.round(timeDifference / 60000);
        await ticket.save();

        res.json({ msg: 'Ticket marked as resolved' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// Route: GET /api/tickets/all
// Desc: Get ALL tickets
// Access: Private (Admin only)
router.get('/all', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    try {
        const tickets = await Ticket.find()
            .populate('location', 'name')
            .populate('assignedTo', 'username')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// Make sure mytickets route is also in the file
router.get('/mytickets', auth, async (req, res) => {
    try {
        // The query now finds all tickets assigned to the user, regardless of status
        const tickets = await Ticket.find({ assignedTo: req.user.id })
            .populate('location', ['name', 'ipAddress'])
            .sort({ createdAt: -1 }); // Sort by newest first
        res.json(tickets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// Route: DELETE /api/tickets/:id
// Desc: Delete a ticket
// Access: Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ msg: 'Ticket not found' });
        }
        await ticket.deleteOne(); // Use deleteOne() on the document
        res.json({ msg: 'Ticket successfully deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
module.exports = router;