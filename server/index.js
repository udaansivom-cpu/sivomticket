const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors
require('dotenv').config();


const app = express();
const PORT = 5000;

// --- Middleware ---
app.use(cors({
  origin: 'https://your-frontend-url.com' // We will get this URL in the frontend deployment step
})); // Use cors
app.use(express.json()); // To parse JSON bodies
// ------------------

// --- Routes ---
// Any request to /api/users will be handled by the user.routes.js file
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/locations', require('./routes/location.routes')); // Add this line
app.use('/api/tickets', require('./routes/ticket.routes')); // Add this line
app.use('/api/reports', require('./routes/reports.routes'));
// --------------

app.get('/', (req, res) => {
    res.send('Ticketing Tool API is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch(err => console.error('Connection error', err));

app.get('/', (req, res) => {
    res.send('Ticketing Tool API is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});