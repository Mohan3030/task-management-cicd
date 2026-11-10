
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editStatus, setEditStatus] = useState('PENDING');

  // Fetch tasks when the component loads.
  useEffect(() => {
    const controller = new AbortController();

    const loadTasks = async () => {
      try {
        const response = await fetch('/api/tasks', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const result = await response.json();
        setTasks(result.data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadTasks();

    return () => controller.abort();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details?.join(', ') || result.message);
      }

      setTasks((previousTasks) => [result.data, ...previousTasks]);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setError('');

    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details?.join(', ') || result.message);
      }

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task.id === taskId ? result.data : task
        )
      );
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async (taskId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this task?'
    );

    if (!confirmed) return;

    setError('');

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      setTasks((previousTasks) =>
        previousTasks.filter((task) => task.id !== taskId)
      );
    } catch (error) {
      setError(error.message);
    }
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
    setEditStatus(task.status);
  };

  const handleEdit = async (event, taskId) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          priority: editPriority,
          status: editStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details?.join(', ') || result.message);
      }

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task.id === taskId ? result.data : task
        )
      );

      setEditingTaskId(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-container">
      <header>
        <h1>Task Management System</h1>
        <p>Organize your work. Track your progress. Get things done.</p>
      </header>

      <section className="task-form">
        <h2>Create New Task</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Task Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter task title"
              maxLength={150}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Enter task description"
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Add Task'}
          </button>
        </form>
      </section>

      {error && <p className="error-message">{error}</p>}

      <section>
        <h2>My Tasks ({tasks.length})</h2>

        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="empty-message">
            No tasks available. Create your first task!
          </p>
        ) : (
          <div className="task-grid">
            {tasks.map((task) => (
              <article className="task-card" key={task.id}>
                {editingTaskId === task.id ? (
                  <form onSubmit={(event) => handleEdit(event, task.id)}>
                    <h3>Edit Task</h3>

                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        maxLength={150}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(event.target.value)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        value={editPriority}
                        onChange={(event) =>
                          setEditPriority(event.target.value)
                        }
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={editStatus}
                        onChange={(event) => setEditStatus(event.target.value)}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>

                    <button type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>

                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setEditingTaskId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="task-header">
                      <h3>{task.title}</h3>
                      <span className="priority-label">
                        {task.priority}
                      </span>
                    </div>

                    <p className="task-description">
                      {task.description || 'No description provided'}
                    </p>

                    <div className="task-meta">
                      <label>
                        Status
                        <select
                          value={task.status}
                          onChange={(event) =>
                            handleStatusChange(task.id, event.target.value)
                          }
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </label>
                    </div>

                    <div className="task-actions">
                      <button onClick={() => startEditing(task)}>
                        Edit Task
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(task.id)}
                      >
                        Delete Task
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
