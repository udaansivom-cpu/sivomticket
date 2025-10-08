const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ticket = require('../models/ticket.model');
const mongoose = require('mongoose');

// Route: GET /api/reports/user-stats
// Desc: Get statistics for the logged-in user
// Access: Private
router.get('/user-stats', auth, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = await Ticket.aggregate([
            { $match: { assignedTo: userId } },
            {
                $group: {
                    _id: null,
                    totalPending: {
                        $sum: { $cond: [{ $in: ['$status', ['Assigned', 'Escalated']] }, 1, 0] }
                    },
                    totalResolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
                    },
                    resolvedToday: {
                        $sum: { $cond: [{ $and: [
                            { $eq: ['$status', 'Resolved'] },
                            { $gte: ['$resolvedAt', today] }
                        ]}, 1, 0]}
                    }
                }
            }
        ]);
        res.json(stats[0] || { totalPending: 0, totalResolved: 0, resolvedToday: 0 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Route: GET /api/reports/admin-summary
// Desc: Get system-wide statistics for the admin
// Access: Private (Admin only)
router.get('/admin-summary', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    try {
        const ticketsPerUser = await Ticket.aggregate([
            { $match: { status: 'Resolved', assignedTo: { $ne: null } } },
            { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { username: '$user.username', count: 1, _id: 0 } }
        ]);

        const statusBreakdown = await Ticket.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $project: { name: '$_id', value: '$count', _id: 0 } }
        ]);

        res.json({ ticketsPerUser, statusBreakdown });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// Add this new route inside reports.routes.js
router.get('/admin-kpis', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    try {
        const openTickets = await Ticket.countDocuments({ status: 'Open' });
        const escalatedTickets = await Ticket.countDocuments({ status: 'Escalated' });
        const assignedTickets = await Ticket.countDocuments({ status: 'Assigned' });
        const resolvedToday = await Ticket.countDocuments({
            status: 'Resolved',
            resolvedAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
        });

        res.json({ openTickets, escalatedTickets, assignedTickets, resolvedToday });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// In reports.routes.js, replace the existing /sidebar-stats route
router.get('/sidebar-stats', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (req.user.role === 'admin') {
            const totalTickets = await Ticket.countDocuments({});
            const createdToday = await Ticket.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } });
            const resolvedToday = await Ticket.countDocuments({ status: 'Resolved', resolvedAt: { $gte: today, $lt: tomorrow } });
            const pending = await Ticket.countDocuments({ status: { $in: ['Assigned', 'Escalated'] } });
            const needsAssignment = await Ticket.countDocuments({ status: 'Open' });

            return res.json({ totalTickets, createdToday, resolvedToday, pending, needsAssignment });
        } else {
            // Stats for a regular user
            const userId = new mongoose.Types.ObjectId(req.user.id);
            const totalAssigned = await Ticket.countDocuments({ assignedTo: userId });
            const createdToday = await Ticket.countDocuments({ assignedTo: userId, createdAt: { $gte: today, $lt: tomorrow } });
            const resolved = await Ticket.countDocuments({ assignedTo: userId, status: 'Resolved' });
            const pending = await Ticket.countDocuments({ assignedTo: userId, status: { $in: ['Assigned', 'Escalated'] } });

            return res.json({ totalAssigned, createdToday, resolved, pending });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;