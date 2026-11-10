import test from 'node:test';
import assert from 'node:assert/strict';

import { validateTask } from '../src/utils/taskValidator.js';

test('should accept a valid task', () => {
  const errors = validateTask({
    title: 'Learn CI/CD',
    priority: 'HIGH',
  });

  assert.deepEqual(errors, []);
});

test('should reject an empty title', () => {
  const errors = validateTask({
    title: '',
    priority: 'HIGH',
  });

  assert.ok(errors.includes('Task title is required'));
});

test('should reject an invalid priority', () => {
  const errors = validateTask({
    title: 'Learn CI/CD',
    priority: 'URGENT',
  });

  assert.ok(
    errors.includes('Priority must be LOW, MEDIUM, or HIGH')
  );
});

test('should reject a title longer than 150 characters', () => {
  const errors = validateTask({
    title: 'A'.repeat(151),
  });

  assert.ok(
    errors.includes('Task title cannot exceed 150 characters')
  );
});

test('should reject a non-string description', () => {
  const errors = validateTask({
    title: 'Learn CI/CD',
    description: 123,
  });

  assert.ok(
    errors.includes('Task description must be a string')
  );
});

test('should reject an invalid status', () => {
  const errors = validateTask({
    title: 'Learn CI/CD',
    status: 'STARTED',
  });

  assert.ok(
    errors.includes(
      'Status must be PENDING, IN_PROGRESS, or COMPLETED'
    )
  );
});

test('should reject an invalid request body', () => {
  const errors = validateTask(null);

  assert.deepEqual(errors, [
    'Request body must be a valid JSON object',
  ]);
});