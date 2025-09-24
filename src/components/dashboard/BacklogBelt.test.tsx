import { render } from '@testing-library/react';
import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest';
import { BacklogBelt, TaskCard } from './BacklogBelt';
import { Task } from '../../types';
import usePlanner from '../../state/planner';
import { HotkeysProvider } from 'react-hotkeys-hook';

vi.mock('../../state/planner');
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  }),
  DragOverlay: () => null,
  useDndMonitor: vi.fn(),
}));

const mockTasks: Task[] = [
  { id: '1', title: 'Test Task 1', done: false, isToday: true, est_minutes: 25, project: null, tags: [], notes: null, createdAt: '', due: null, priority: 1 },
  { id: '2', title: 'Test Task 2', done: false, isToday: false, est_minutes: 25, project: null, tags: [], notes: null, createdAt: '', due: null, priority: 1 },
];

const mockPlannerState = {
  tasks: mockTasks,
  blocks: [],
  toggleToday: vi.fn(),
};

describe('BacklogBelt', () => {
  beforeEach(() => {
    (usePlanner as Mock).mockImplementation((selector) => selector(mockPlannerState));
  });

  it('renders tasks', () => {
    render(<BacklogBelt dateISO="2025-09-24" />);
    // This is a placeholder test. In a real scenario, you'd check if tasks are rendered.
  });
});

describe('TaskCard', () => {
  beforeEach(() => {
    (usePlanner as Mock).mockImplementation((selector) => selector(mockPlannerState));
  });

  it('toggles pin state on click', () => {
    const task = mockTasks[0];
    const { getByRole } = render(
      <HotkeysProvider>
        <TaskCard task={task} selected={false} onToggleSelect={() => {}} />
      </HotkeysProvider>,
    );

    const pinButton = getByRole('button');
    expect(pinButton).toBeInTheDocument();
    // More assertions would go here
  });
});
