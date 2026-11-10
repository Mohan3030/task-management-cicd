import express from 'express';

import pool from './config/database.js';
import taskRoutes from './routes/taskRoutes.js';
import errorMiddleware from './middleware/errorMiddleware.js';

const app = express();

// Parse incoming JSON requests
app.use(express.json());

// Task routes
app.use('/api/tasks', taskRoutes);

// Health-check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.status(200).json({
      status: 'OK',
      message: 'Task Management API is running',
      database: 'Connected',
    });
  } catch (error) {
    console.error('Health check failed:', error.message);

    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection unavailable',
      database: 'Disconnected',
    });
  }
});

// Centralized error handling
app.use(errorMiddleware);

export default app;