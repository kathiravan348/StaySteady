import { useEffect, useState } from 'react';

// Current time that re-renders on an interval, so ages such as "12 s ago" keep counting.
export function useNow(intervalMs = 5_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, intervalMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [intervalMs]);
  return now;
}
