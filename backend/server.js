const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
const db = require('./database/db');

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
const smtpRoutes = require('./routes/smtp');
const settingsRoutes = require('./routes/settings');
const emailRoutes = require('./routes/emails');
const sendRoutes = require('./routes/send');
const emailListsRoutes = require('./routes/email-lists');
const smtpProfilesRoutes = require('./routes/smtp-profiles');
const campaignsRoutes = require('./routes/campaigns');

// Use routes
app.use('/api/smtp', smtpRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/send', sendRoutes);
app.use('/api/email-lists', emailListsRoutes);
app.use('/api/smtp-profiles', smtpProfilesRoutes);
app.use('/api/campaigns', campaignsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email Sender API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
