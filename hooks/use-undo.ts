import { useRef, useState, useCallback } from 'react';

type UndoFn = () => Promise<void>;

const MAX_STACK = 50;

export function useUndo() {
  const stack = useRef<UndoFn[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const push = useCallback((fn: UndoFn) => {
    stack.current = [fn, ...stack.current].slice(0, MAX_STACK);
    setCanUndo(true);
  }, []);

  const undo = useCallback(async () => {
    const fn = stack.current.shift();
    if (!fn) return;
    await fn();
    setCanUndo(stack.current.length > 0);
  }, []);

  const clear = useCallback(() => {
    stack.current = [];
    setCanUndo(false);
  }, []);

  return { push, undo, canUndo, clear };
}
