const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const VALID_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
];

export function validateTask(task) {
  const errors = [];

  // Check whether request body is a valid object
  if (!task || typeof task !== 'object' || Array.isArray(task)) {
    return ['Request body must be a valid JSON object'];
  }

  // Validate title
  if (typeof task.title !== 'string' || !task.title.trim()) {
    errors.push('Task title is required');
  } else if (task.title.trim().length > 150) {
    errors.push('Task title cannot exceed 150 characters');
  }

  // Validate description
  if (
    task.description !== undefined &&
    task.description !== null &&
    typeof task.description !== 'string'
  ) {
    errors.push('Task description must be a string');
  }

  // Validate priority
  if (
    task.priority !== undefined &&
    !VALID_PRIORITIES.includes(task.priority)
  ) {
    errors.push('Priority must be LOW, MEDIUM, or HIGH');
  }

  // Validate status when provided
  if (
    task.status !== undefined &&
    !VALID_STATUSES.includes(task.status)
  ) {
    errors.push(
      'Status must be PENDING, IN_PROGRESS, or COMPLETED'
    );
  }

  return errors;
}