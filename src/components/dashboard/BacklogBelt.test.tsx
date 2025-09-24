import { render } from '@testing-library/react';
import { describe, it, expect, vi, type Mock } from 'vitest';
import { BacklogBelt, TaskCard } from './BacklogBelt';
import { Task } from '../../types';
import usePlanner from '../../state/planner';

vi.mock('../../state/planner');
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  }),
  DragOverlay: () => null,
}));

const mockTasks: Task[] = [
  { id: '1', title: 'Test Task 1', done: false, isToday: true, est_minutes: 25, project: null, tags: [], notes: null, createdAt: '', due: null, priority: 1 },
  { id: '2', title: 'Test Task 2', done: false, isToday: false, est_minutes: 25, project: null, tags: [], notes: null, createdAt: '', due: null, priority: 1 },
];

describe('BacklogBelt', () => {
  it('renders tasks', () => {
    render(<BacklogBelt dateISO="2025-09-24" />);
    // This is a placeholder test. In a real scenario, you'd check if tasks are rendered.
  });
});

describe('TaskCard', () => {
  it('toggles pin state on click', () => {
    const mockToggleToday = vi.fn();
    (usePlanner as Mock).mockReturnValue({
      toggleToday: mockToggleToday,
    });

    const task = mockTasks[0];
    const { getByRole } = render(
      <TaskCard task={task} selected={false} onToggleSelect={() => {}} />,
    );

    const pinButton = getByRole('button');
    expect(pinButton).toBeInTheDocument();
    // More assertions would go here
  });
});
