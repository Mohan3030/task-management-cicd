
import test from 'node:test';
import assert from 'node:assert/strict';

import { validateTask } from '../src/utils/taskValidator.js';

test('should accept a valid task', () => {
  const task = {
    title: 'Learn CI/CD',
    priority: 'HIGH',
  };

  const errors = validateTask(task);

  assert.deepEqual(errors, []);
});

test('should reject a task with an empty title', () => {
  const task = {
    title: '',
    priority: 'HIGH',
  };

  const errors = validateTask(task);

  assert.ok(errors.includes('Task title is required'));
});

test('should reject an invalid priority', () => {
  const task = {
    title: 'Learn CI/CD',
    priority: 'URGENT',
  };

  const errors = validateTask(task);

  assert.ok(
    errors.includes('Priority must be LOW, MEDIUM, or HIGH')
  );
});
