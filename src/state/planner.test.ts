import { describe, it, expect, vi, beforeEach } from 'vitest';
import usePlanner from './planner'; // Assuming usePlanner is the default export
import { Task } from '../types';

// Mock Tauri's invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const initialState = usePlanner.getState();

const mockTasks: Task[] = [
  { id: '1', title: 'Task 1', done: false, isToday: false, est_minutes: 30, notes: null, project: null, tags: [], priority: 2, createdAt: '', due: null },
  { id: '2', title: 'Task 2', done: false, isToday: true, est_minutes: 60, notes: null, project: null, tags: [], priority: 1, createdAt: '', due: null },
];

describe('planner store: toggleToday', () => {
  beforeEach(() => {
    // Reset store and mocks before each test
    usePlanner.setState({ ...initialState, tasks: mockTasks });
    vi.clearAllMocks();
  });

  it('should toggle isToday from false to true', () => {
    const { toggleToday } = usePlanner.getState();
    toggleToday('1');

    const updatedTask = usePlanner.getState().tasks.find(t => t.id === '1');
    expect(updatedTask?.isToday).toBe(true);
  });

  it('should toggle isToday from true to false', () => {
    const { toggleToday } = usePlanner.getState();
    toggleToday('2');

    const updatedTask = usePlanner.getState().tasks.find(t => t.id === '2');
    expect(updatedTask?.isToday).toBe(false);
  });

  it('should optimistically update state and call the update action', () => {
    const updateTaskSpy = vi.spyOn(usePlanner.getState(), 'updateTask');
    
    // Action
    usePlanner.getState().toggleToday('1');
    
    // Check for optimistic update in UI state
    const taskInState = usePlanner.getState().tasks.find(t => t.id === '1');
    expect(taskInState?.isToday).toBe(true);
    
    // Check that the backend update function was called
    expect(updateTaskSpy).toHaveBeenCalledWith('1', { isToday: true });
  });
});
