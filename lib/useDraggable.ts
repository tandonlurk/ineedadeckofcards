"use client";

import { useCallback, useRef, useState } from "react";

export type DragPoint = { clientX: number; clientY: number };

/**
 * Tracks a pointer drag and reports the final position as a percentage of
 * `containerRef`'s bounding rect, but only if the pointer is released inside
 * the container. While dragging, `point` holds the live viewport coordinates
 * so callers can render a ghost/preview.
 */
export function useDraggable(
  containerRef: React.RefObject<HTMLElement | null>,
  onDrop: (xPct: number, yPct: number) => void
) {
  const [dragging, setDragging] = useState(false);
  const [point, setPoint] = useState<DragPoint | null>(null);
  const [pct, setPct] = useState<{ x: number; y: number } | null>(null);
  const cleanupRef = useRef<() => void>(() => {});

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      setDragging(true);
      setPoint({ clientX: e.clientX, clientY: e.clientY });

      const computePct = (ev: PointerEvent) => {
        if (!rect) return null;
        return {
          x: Math.min(96, Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100)),
          y: Math.min(92, Math.max(0, ((ev.clientY - rect.top) / rect.height) * 100)),
        };
      };

      setPct(computePct(e as unknown as PointerEvent) ?? null);

      const move = (ev: PointerEvent) => {
        setPoint({ clientX: ev.clientX, clientY: ev.clientY });
        setPct(computePct(ev));
      };
      const up = (ev: PointerEvent) => {
        cleanupRef.current();
        setDragging(false);
        setPoint(null);
        setPct(null);
        if (
          rect &&
          ev.clientX >= rect.left &&
          ev.clientX <= rect.right &&
          ev.clientY >= rect.top &&
          ev.clientY <= rect.bottom
        ) {
          const result = computePct(ev);
          if (result) onDrop(result.x, result.y);
        }
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up, { once: true });
      cleanupRef.current = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
    },
    [containerRef, onDrop]
  );

  return { dragging, point, pct, onPointerDown };
}
