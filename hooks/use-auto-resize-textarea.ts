"use client";

import * as React from "react";

/* Auto-resizing textarea hook (kept from the v0-ai-chat reference —
   BRIEF §5.4 says this one is correct). Grows with content between
   minHeight and maxHeight. */
export function useAutoResizeTextarea({
  minHeight = 60,
  maxHeight = 200,
}: {
  minHeight?: number;
  maxHeight?: number;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = React.useCallback(
    (reset = false) => {
      const el = textareaRef.current;
      if (!el) return;
      if (reset) {
        el.style.height = `${minHeight}px`;
        return;
      }
      el.style.height = `${minHeight}px`;
      el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`;
    },
    [minHeight, maxHeight]
  );

  React.useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}
