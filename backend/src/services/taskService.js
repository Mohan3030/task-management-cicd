
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../models/taskModel.js';

import { validateTask } from '../utils/taskValidator.js';

const VALID_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
];

const VALID_PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
];

// Create task
export const createTaskService = async (taskData) => {
  const errors = validateTask(taskData);

  if (errors.length > 0) {
    const error = new Error('Task validation failed');
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  return await createTask(taskData);
};

// Get all tasks
export const getAllTasksService = async () => {
  return await getAllTasks();
};

// Get task by ID
export const getTaskByIdService = async (id) => {
  return await getTaskById(id);
};

// Update entire task
export const updateTaskService = async (id, taskData) => {
  const errors = validateTask(taskData);

  if (
    !taskData.status ||
    !VALID_STATUSES.includes(taskData.status)
  ) {
    errors.push('Invalid task status');
  }

  if (
    !taskData.priority ||
    !VALID_PRIORITIES.includes(taskData.priority)
  ) {
    errors.push('Invalid task priority');
  }

  if (errors.length > 0) {
    const error = new Error('Task validation failed');
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  return await updateTask(id, taskData);
};

// Update only task status
export const updateTaskStatusService = async (id, status) => {
  if (!VALID_STATUSES.includes(status)) {
    const error = new Error('Invalid task status');
    error.statusCode = 400;
    error.details = [
      'Status must be PENDING, IN_PROGRESS, or COMPLETED',
    ];

    throw error;
  }

  return await updateTaskStatus(id, status);
};

// Delete task
export const deleteTaskService = async (id) => {
  return await deleteTask(id);
};
