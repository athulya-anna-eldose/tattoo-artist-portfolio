import { useEffect, useRef } from "react";

/**
 * Keeps the browser history in step with how many "layers" are open
 * (category, View all, lightbox...).
 *  - A layer opens  -> one history entry is added.
 *  - Browser Back   -> onBack() closes the top layer.
 *  - A layer closes from the UI (X, Done, arrow) -> its entry is removed.
 */
export function useBackStack(depth: number, onBack: () => void) {
  const pushed = useRef(0);
  const ignorePop = useRef(false);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    const onPop = () => {
      if (ignorePop.current) {
        ignorePop.current = false;
        return;
      }
      if (pushed.current > 0) {
        pushed.current -= 1;
        onBackRef.current();
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (depth > pushed.current) {
      while (pushed.current < depth) {
        window.history.pushState({ ...window.history.state, layer: true }, "");
        pushed.current += 1;
      }
    } else if (depth < pushed.current) {
      const extra = pushed.current - depth;
      pushed.current = depth;
      ignorePop.current = true;
      window.history.go(-extra);
    }
  }, [depth]);
}