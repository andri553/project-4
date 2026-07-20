import { useEffect, useRef } from 'react';

/**
 * A hook for smart polling that pauses execution when the document is not visible
 * @param callback The function to execute on interval
 * @param delay The interval delay in milliseconds. If null, polling is paused.
 */
export function useSmartPolling(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    if (delay === null) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      // Only execute if the tab is visible
      if (document.visibilityState === 'visible') {
        savedCallback.current();
      }
    };

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(tick, delay);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Optionally run immediately when returning to the tab
        tick();
      }
    };

    // Start polling
    startPolling();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [delay]);
}
