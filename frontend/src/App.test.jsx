
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import App from './App';

const sampleTask = {
  id: 1,
  title: 'Complete project',
  description: 'Finish the CI/CD project',
  priority: 'HIGH',
  status: 'PENDING',
};

const mockResponse = (data, ok = true) => ({
  ok,
  json: async () => data,
});

describe('Task Management Dashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should display tasks fetched from the API', async () => {
    fetch.mockResolvedValue(
      mockResponse({
        success: true,
        data: [sampleTask],
      })
    );

    render(<App />);

    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();

    expect(
      await screen.findByText('Complete project')
    ).toBeInTheDocument();

    expect(screen.getByText('My Tasks (1)')).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      '/api/tasks',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('should display an empty message when no tasks exist', async () => {
    fetch.mockResolvedValue(
      mockResponse({
        success: true,
        data: [],
      })
    );

    render(<App />);

    expect(
      await screen.findByText(
        'No tasks available. Create your first task!'
      )
    ).toBeInTheDocument();

    expect(screen.getByText('My Tasks (0)')).toBeInTheDocument();
  });

  it('should create a new task', async () => {
    fetch
      .mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: [],
        })
      )
      .mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: sampleTask,
        })
      );

    render(<App />);

    await screen.findByText(
      'No tasks available. Create your first task!'
    );

    fireEvent.change(screen.getByLabelText('Task Title'), {
      target: { value: 'Complete project' },
    });

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Finish the CI/CD project' },
    });

    fireEvent.change(screen.getByLabelText('Priority'), {
      target: { value: 'HIGH' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add Task' }));

    expect(
      await screen.findByText('Complete project')
    ).toBeInTheDocument();

    expect(fetch).toHaveBeenLastCalledWith(
      '/api/tasks',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'Complete project',
          description: 'Finish the CI/CD project',
          priority: 'HIGH',
        }),
      })
    );
  });

  it('should update a task status', async () => {
    const updatedTask = {
      ...sampleTask,
      status: 'COMPLETED',
    };

    fetch
      .mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: [sampleTask],
        })
      )
      .mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: updatedTask,
        })
      );

    render(<App />);

    await screen.findByText('Complete project');

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'COMPLETED' },
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        '/api/tasks/1/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'COMPLETED' }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Status').value).toBe('COMPLETED');
    });
  });

  it('should edit an existing task', async () => {
    const updatedTask = {
      ...sampleTask,
      title: 'Updated project',
      description: 'Updated description',
    };

    fetch
      .mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: [sampleTask],
        })
      )
      .mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: updatedTask,
        })
      );

    render(<App />);

    await screen.findByText('Complete project');

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit Task' })
    );

    const titleInput = screen.getByDisplayValue('Complete project');

    fireEvent.change(titleInput, {
      target: { value: 'Updated project' },
    });

    fireEvent.change(
      screen.getByDisplayValue('Finish the CI/CD project'),
      {
        target: { value: 'Updated description' },
      }
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Save Changes' })
    );

    expect(
      await screen.findByText('Updated project')
    ).toBeInTheDocument();

    expect(fetch).toHaveBeenLastCalledWith(
      '/api/tasks/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated project',
          description: 'Updated description',
          priority: 'HIGH',
          status: 'PENDING',
        }),
      })
    );
  });

  it('should delete a task after confirmation', async () => {
    fetch
      .mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: [sampleTask],
        })
      )
      .mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: sampleTask,
        })
      );

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<App />);

    await screen.findByText('Complete project');

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete Task' })
    );

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        '/api/tasks/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    expect(
      await screen.findByText(
        'No tasks available. Create your first task!'
      )
    ).toBeInTheDocument();
  });

  it('should display an error when fetching tasks fails', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Server error' }),
    });

    render(<App />);

    expect(
      await screen.findByText('Failed to fetch tasks')
    ).toBeInTheDocument();
  });

  it('should display an error when task creation fails', async () => {
    fetch
      .mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: [],
        })
      )
      .mockResolvedValueOnce(
        mockResponse(
          { message: 'Unable to create task' },
          false
        )
      );

    render(<App />);

    await screen.findByText(
      'No tasks available. Create your first task!'
    );

    fireEvent.change(screen.getByLabelText('Task Title'), {
      target: { value: 'New task' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Add Task' })
    );

    expect(
      await screen.findByText('Unable to create task')
    ).toBeInTheDocument();
  });

  it('should display an error when task editing fails', async () => {
    fetch
      .mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: [sampleTask],
        })
      )
      .mockResolvedValueOnce(
        mockResponse(
          { message: 'Unable to update task' },
          false
        )
      );

    render(<App />);

    await screen.findByText('Complete project');

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit Task' })
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Save Changes' })
    );

    expect(
      await screen.findByText('Unable to update task')
    ).toBeInTheDocument();
  });

  it('should not delete a task when deletion is cancelled', async () => {
    fetch.mockResolvedValueOnce(
      mockResponse({
        success: true,
        data: [sampleTask],
      })
    );

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<App />);

    await screen.findByText('Complete project');

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete Task' })
    );

    expect(window.confirm).toHaveBeenCalled();

    expect(fetch).toHaveBeenCalledTimes(1);

    expect(
      screen.getByText('Complete project')
    ).toBeInTheDocument();
  });
});
