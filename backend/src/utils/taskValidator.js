
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export function validateTask(task) {
  const errors = [];

  if (!task.title || task.title.trim() === '') {
    errors.push('Task title is required');
  }

  if (
    task.priority &&
    !VALID_PRIORITIES.includes(task.priority)
  ) {
    errors.push('Priority must be LOW, MEDIUM, or HIGH');
  }

  return errors;
}
