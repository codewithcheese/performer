import { useRef } from "react";

/**
 * Hook to count renders
 */
export function useRenderCount() {
  const count = useRef(0);
  count.current++;
  return count.current;
}
