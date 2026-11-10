
import pool from '../config/database.js';

// Create a task
export const createTask = async (task) => {
  const { title, description, priority } = task;

  const query = `
    INSERT INTO tasks (title, description, priority)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [
    title,
    description || null,
    priority || 'MEDIUM',
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get all tasks
export const getAllTasks = async () => {
  const query = `
    SELECT *
    FROM tasks
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(query);
  return result.rows;
};

// Get task by ID
export const getTaskById = async (id) => {
  const query = `
    SELECT *
    FROM tasks
    WHERE id = $1;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

// Update entire task
export const updateTask = async (id, task) => {
  const { title, description, status, priority } = task;

  const query = `
    UPDATE tasks
    SET
      title = $1,
      description = $2,
      status = $3,
      priority = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *;
  `;

  const values = [
    title,
    description ?? null,
    status,
    priority,
    id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

// Update only task status
export const updateTaskStatus = async (id, status) => {
  const query = `
    UPDATE tasks
    SET
      status = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `;

  const result = await pool.query(query, [status, id]);

  return result.rows[0] || null;
};

// Delete task
export const deleteTask = async (id) => {
  const query = `
    DELETE FROM tasks
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};
