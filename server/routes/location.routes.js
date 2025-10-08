const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import the auth middleware
const Location = require('../models/location.model');
const User = require('../models/user.model');

// Route: POST /api/locations
// Desc: Create a new location
// Access: Private (Admin only)
router.post('/', auth, async (req, res) => {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }

    try {
        const { name, ipAddress } = req.body;
        const newLocation = new Location({ name, ipAddress });
        const location = await newLocation.save();
        res.json(location);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Route: GET /api/locations
// Desc: Get all locations
// Access: Private (Admin only)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }

    try {
        const locations = await Location.find().sort({ name: 1 });
        res.json(locations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Route: PUT /api/locations/:id
// Desc: Update (rename) a location
// Access: Private (Admin only)
router.put('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    try {
        const { name, ipAddress } = req.body;
        const updatedLocation = await Location.findByIdAndUpdate(
            req.params.id,
            { name, ipAddress },
            { new: true }
        );
        if (!updatedLocation) {
            return res.status(404).json({ msg: 'Location not found' });
        }
        res.json(updatedLocation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Route: DELETE /api/locations/:id
// Desc: Delete a location and all its associated tickets
// Access: Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    try {
        // Important: First, delete all tickets associated with this location
        await Ticket.deleteMany({ location: req.params.id });

        // Then, delete the location itself
        const deletedLocation = await Location.findByIdAndDelete(req.params.id);
        if (!deletedLocation) {
            return res.status(404).json({ msg: 'Location not found' });
        }

        res.json({ msg: 'Location and all associated tickets have been deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// Add this new route to location.routes.js
router.post('/import', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    try {
        const { locations } = req.body; // Expect an array of location objects
        if (!locations || !Array.isArray(locations)) {
            return res.status(400).json({ msg: 'Invalid data format.' });
        }

        // Use insertMany for efficient bulk database insertion
        const result = await Location.insertMany(locations, { ordered: false });

        res.status(201).json({ msg: `${result.length} locations imported successfully.` });
    } catch (err) {
        // This handles potential duplicate errors without stopping the whole import
        if (err.writeErrors) {
            const successfulCount = err.result.nInserted;
            return res.status(201).json({ msg: `${successfulCount} locations imported successfully. Some duplicates were ignored.` });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;