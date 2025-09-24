import { describe, it, expect } from 'vitest';
import { selectTodayTaskIds } from './selectors';
import { Task, Block } from '@/types';

const TODAY_ISO = '2025-09-24';
const YESTERDAY_ISO = '2025-09-23';
const TOMORROW_ISO = '2025-09-25';

const mockTasks: Omit<Task, 'est_minutes' | 'notes' | 'project' | 'tags' | 'priority' | 'createdAt'>[] = [
    { id: '1', title: 'Scheduled', done: false, isToday: false, due: null },
    { id: '2', title: 'Pinned', done: false, isToday: true, due: null },
    { id: '3', title: 'Due today', done: false, isToday: false, due: '2025-09-24T10:00:00.000Z' },
    { id: '4', title: 'Done scheduled', done: true, isToday: false, due: null },
    { id: '5', title: 'Scheduled and Pinned', done: false, isToday: true, due: null },
    { id: '6', title: 'Due yesterday', done: false, isToday: false, due: '2025-09-23T10:00:00.000Z' },
    { id: '7', title: 'Scheduled for tomorrow', done: false, isToday: false, due: null },
    { id: '8', title: 'Done and Pinned', done: true, isToday: true, due: null },
];

const mockBlocks: Omit<Block, 'startMin' | 'lengthMin'>[] = [
    { id: 'b1', taskId: '1', dateISO: TODAY_ISO, kind: 'atomic' },
    { id: 'b2', taskId: '4', dateISO: TODAY_ISO, kind: 'atomic' },
    { id: 'b3', taskId: '5', dateISO: TODAY_ISO, kind: 'atomic' },
    { id: 'b4', taskId: '7', dateISO: TOMORROW_ISO, kind: 'atomic' },
];

describe('selectTodayTaskIds', () => {
    // Fill in default properties for mock tasks
    const fullMockTasks: Task[] = mockTasks.map(t => ({
        ...t,
        est_minutes: 30,
        notes: null,
        project: null,
        tags: [],
        priority: 2,
        createdAt: new Date().toISOString()
    }))

    const fullMockBlocks: Block[] = mockBlocks.map(b => ({
        ...b,
        startMin: 0,
        lengthMin: 30,
    }))

    it('should include scheduled, pinned, and due tasks for today', () => {
        const result = selectTodayTaskIds(fullMockTasks, fullMockBlocks, TODAY_ISO);
        // Expect '1' (scheduled), '2' (pinned), '3' (due), '5' (scheduled and pinned)
        expect(result).toEqual(['1', '2', '3', '5']); // Sorted
    });

    it('should not include done tasks', () => {
        const result = selectTodayTaskIds(fullMockTasks, fullMockBlocks, TODAY_ISO);
        expect(result).not.toContain('4'); // done scheduled
        expect(result).not.toContain('8'); // done pinned
    });

    it('should not include tasks from other days', () => {
        const result = selectTodayTaskIds(fullMockTasks, fullMockBlocks, TODAY_ISO);
        expect(result).not.toContain('6'); // due yesterday
        expect(result).not.toContain('7'); // scheduled for tomorrow
    });

    it('should return a de-duplicated and sorted list of task IDs', () => {
        const tasks: Task[] = [{ id: '1', title: 'A', done: false, isToday: true, due: TODAY_ISO, est_minutes: 30, notes: null, project: null, tags: [], priority: 2, createdAt: '' }];
        const blocks: Block[] = [{ id: 'b1', taskId: '1', dateISO: TODAY_ISO, kind: 'atomic', startMin: 0, lengthMin: 30 }];
        const result = selectTodayTaskIds(tasks, blocks, TODAY_ISO);
        expect(result).toEqual(['1']);
    });
    
    it('should return a sorted array of task IDs', () => {
        const tasks: Task[] = [
            { id: 'c', title: 'C', done: false, isToday: true, due: null, est_minutes: 30, notes: null, project: null, tags: [], priority: 2, createdAt: '' },
            { id: 'a', title: 'A', done: false, isToday: true, due: null, est_minutes: 30, notes: null, project: null, tags: [], priority: 2, createdAt: '' },
            { id: 'b', title: 'B', done: false, isToday: true, due: null, est_minutes: 30, notes: null, project: null, tags: [], priority: 2, createdAt: '' },
        ];
        const result = selectTodayTaskIds(tasks, [], TODAY_ISO);
        expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty tasks and blocks', () => {
        const result = selectTodayTaskIds([], [], TODAY_ISO);
        expect(result).toEqual([]);
    });

    it('should correctly identify tasks across day boundaries (using isSameDayISO)', () => {
        const dateAtStartOfDay = '2025-09-24T00:00:00.000Z';
        const dateAtEndOfDay = '2025-09-24T23:59:59.999Z';
        const tasks: Task[] = [{ id: '1', title: 'A', done: false, isToday: false, due: dateAtEndOfDay, est_minutes: 30, notes: null, project: null, tags: [], priority: 2, createdAt: '' }];
        
        const result = selectTodayTaskIds(tasks, [], dateAtStartOfDay);
        expect(result).toEqual(['1']);
    });
});
