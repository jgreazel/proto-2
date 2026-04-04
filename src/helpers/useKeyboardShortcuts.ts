import { useEffect, useCallback } from "react";

type Shortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  /** When true, fires even if an input/textarea is focused */
  global?: boolean;
};

/**
 * Registers keyboard shortcuts. Shortcuts are ignored when
 * an input, textarea, or select is focused (unless `global` is set).
 */
export default function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      for (const s of shortcuts) {
        if (isInput && !s.global) continue;
        if (e.key.toLowerCase() !== s.key.toLowerCase()) continue;
        if (!!s.ctrl !== (e.ctrlKey || e.metaKey)) continue;
        if (!!s.shift !== e.shiftKey) continue;
        if (!!s.alt !== e.altKey) continue;

        e.preventDefault();
        s.handler();
        return;
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);
}
