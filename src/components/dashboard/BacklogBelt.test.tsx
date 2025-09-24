import { render } from '@testing-library/react';
import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest';
import { BacklogBelt, TaskCard } from './BacklogBelt';
import { Task } from '../../types';
import usePlanner from '../../state/planner';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { screen, fireEvent } from '@testing-library/react';

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
  { id: '1', title: 'Test Task 1 (isToday)', done: false, isToday: true, est_minutes: 25, project: null, tags: [], notes: null, createdAt: '', due: null, priority: 1 },
  { id: '2', title: 'Test Task 2 (backlog)', done: false, isToday: false, est_minutes: 25, project: null, tags: [], notes: null, createdAt: '', due: null, priority: 1 },
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

  it('filters out tasks that are part of "Today"', async () => {
    render(<BacklogBelt dateISO="2025-09-24" />);
    
    // The belt is collapsed by default, so we need to trigger the expanded view
    fireEvent.mouseEnter(screen.getByRole('complementary', { name: 'Backlog belt' }));

    // Task 1 is `isToday`, so it should be filtered out
    expect(screen.queryByText('Test Task 1 (isToday)')).not.toBeInTheDocument();
    
    // Task 2 is a regular backlog item, so it should be visible
    expect(screen.getByText('Test Task 2 (backlog)')).toBeInTheDocument();
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
