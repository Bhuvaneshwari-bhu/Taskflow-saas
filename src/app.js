const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes  = require('./routes/commentRoutes');
const activityRoutes = require('./routes/activityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const orgRoutes            = require('./routes/orgRoutes');
const activityLogRoutes    = require('./routes/activityLogRoutes');

const app = express();

// Allow the frontend origin (comma-separated list in CLIENT_URL for multiple).
// credentials:true is required so the httpOnly refresh-token cookie is accepted.
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments',  commentRoutes);
app.use('/api/projects', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/org',           orgRoutes);
app.use('/api/activity',      activityLogRoutes);

module.exports = app;
