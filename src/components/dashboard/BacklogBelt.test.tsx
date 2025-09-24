import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { TaskCard } from './BacklogBelt';
import { Task } from '@/types';

// Mock the usePlanner hook
const mockToggleToday = vi.fn();
vi.mock('@/state/planner', () => ({
  usePlanner: (selector: (state: any) => any) => {
    return mockToggleToday;
  },
}));

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  done: false,
  isToday: false,
  est_minutes: 30,
  notes: null,
  project: null,
  tags: [],
  priority: 2,
  createdAt: '',
  due: null,
};

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<HotkeysProvider>{ui}</HotkeysProvider>);
};

describe('TaskCard Component', () => {
  it('should call toggleToday when the pin button is clicked', () => {
    renderWithProvider(<TaskCard task={mockTask} selected={false} onToggleSelect={() => {}} />);
    const pinButton = screen.getByTitle('Add to Today');
    fireEvent.click(pinButton);
    expect(mockToggleToday).toHaveBeenCalledWith('1');
  });

  it('should call toggleToday when the "." key is pressed on a focused card', () => {
    const { container } = renderWithProvider(<TaskCard task={mockTask} selected={false} onToggleSelect={() => {}} />);
    const card = container.firstChild as HTMLElement;
    
    card.focus();
    fireEvent.keyDown(card, { key: '.', code: 'Period' });

    expect(mockToggleToday).toHaveBeenCalledWith('1');
  });

  it('should display the correct tooltip when not pinned', () => {
    renderWithProvider(<TaskCard task={mockTask} selected={false} onToggleSelect={() => {}} />);
    expect(screen.getByTitle('Add to Today')).toBeInTheDocument();
  });

  it('should display the correct tooltip when pinned', () => {
    const pinnedTask = { ...mockTask, isToday: true };
    renderWithProvider(<TaskCard task={pinnedTask} selected={false} onToggleSelect={() => {}} />);
    expect(screen.getByTitle('Remove from Today')).toBeInTheDocument();
  });
});
