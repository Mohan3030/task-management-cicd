
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import app from '../src/app.js';
import pool from '../src/config/database.js';

after(async () => {
  await pool.end();
});

// Health endpoint
test('GET /api/health should return database status', async () => {
  const response = await request(app)
    .get('/api/health');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'OK');
  assert.equal(response.body.database, 'Connected');
});

// Get all tasks
test('GET /api/tasks should return all tasks', async () => {
  const response = await request(app)
    .get('/api/tasks');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data));
});

// Complete CRUD and PATCH lifecycle
test('should create, read, update status, update task and delete', async () => {
  let taskId;

  try {
    // CREATE
    const createResponse = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Integration Testing Task',
        description: 'Testing complete API operations',
        priority: 'HIGH',
      });

    assert.equal(createResponse.statusCode, 201);
    assert.equal(createResponse.body.success, true);

    taskId = createResponse.body.data.id;

    // READ
    const getResponse = await request(app)
      .get(`/api/tasks/${taskId}`);

    assert.equal(getResponse.statusCode, 200);
    assert.equal(
      getResponse.body.data.title,
      'Integration Testing Task'
    );

    // PATCH - Update only status
    const patchResponse = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .send({
        status: 'COMPLETED',
      });

    assert.equal(patchResponse.statusCode, 200);
    assert.equal(
      patchResponse.body.data.status,
      'COMPLETED'
    );

    // Confirm other fields remain unchanged
    assert.equal(
      patchResponse.body.data.title,
      'Integration Testing Task'
    );

    assert.equal(
      patchResponse.body.data.priority,
      'HIGH'
    );

    // PUT - Update entire task
    const updateResponse = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({
        title: 'Updated Integration Task',
        description: 'Testing updated task',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
      });

    assert.equal(updateResponse.statusCode, 200);
    assert.equal(
      updateResponse.body.data.title,
      'Updated Integration Task'
    );

    // DELETE
    const deleteResponse = await request(app)
      .delete(`/api/tasks/${taskId}`);

    assert.equal(deleteResponse.statusCode, 200);
    assert.equal(deleteResponse.body.success, true);

    taskId = null;
  } finally {
    if (taskId) {
      await request(app).delete(`/api/tasks/${taskId}`);
    }
  }
});

// Reject invalid PATCH status
test('PATCH should reject an invalid status', async () => {
  const response = await request(app)
    .patch('/api/tasks/1/status')
    .send({
      status: 'STARTED',
    });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Invalid task status');
});

// Reject missing PATCH status
test('PATCH should reject a missing status', async () => {
  const response = await request(app)
    .patch('/api/tasks/1/status')
    .send({});

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
});
