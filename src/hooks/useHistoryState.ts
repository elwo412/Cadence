import { useState, useCallback } from 'react';

export function useHistoryState<T>(initialState: T) {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const setState = useCallback((newState: T | ((prevState: T) => T)) => {
        setHistory(currentHistory => {
            const newHistory = currentHistory.slice(0, currentIndex + 1);
            const currentState = newHistory[currentIndex];
            const resolvedState = typeof newState === 'function' 
                ? (newState as (prevState: T) => T)(currentState) 
                : newState;

            if (JSON.stringify(resolvedState) === JSON.stringify(currentState)) {
                return currentHistory;
            }

            newHistory.push(resolvedState);
            setCurrentIndex(newHistory.length - 1);
            return newHistory;
        });
    }, [currentIndex]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prevIndex => prevIndex - 1);
        }
    }, [currentIndex]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(prevIndex => prevIndex + 1);
        }
    }, [currentIndex, history.length]);

    return [history[currentIndex], setState, undo, redo, currentIndex > 0, currentIndex < history.length - 1] as const;
}
