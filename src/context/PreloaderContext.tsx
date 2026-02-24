import {
  createContext,
  useContext,
  useRef,
  type RefObject,
  type ReactNode,
} from "react";

interface PreloaderContextValue {
  t1Ref: RefObject<gsap.core.Timeline | null>;
  hasSeenPreloader: boolean;
  registerTimeline: (tl: gsap.core.Timeline) => void;
  onPreloaderComplete: (cb: () => void) => void;
}

const PreloaderContext = createContext<PreloaderContextValue | null>(null);

export function PreloaderProvider({ children }: { children: ReactNode }) {
  const t1Ref = useRef<gsap.core.Timeline | null>(null);
  const callbackQueue = useRef<Array<() => void>>([]);
  const hasSeenPreloader =
    sessionStorage.getItem("preloaderShown") === "true";

  function registerTimeline(tl: gsap.core.Timeline) {
    t1Ref.current = tl;
    // Drain any callbacks that registered before timeline was ready
    callbackQueue.current.forEach((cb) => tl.call(cb));
    callbackQueue.current = [];
  }

  function onPreloaderComplete(cb: () => void) {
    if (t1Ref.current) {
      t1Ref.current.call(cb);
    } else {
      callbackQueue.current.push(cb);
    }
  }

  return (
    <PreloaderContext.Provider
      value={{ t1Ref, hasSeenPreloader, registerTimeline, onPreloaderComplete }}
    >
      {children}
    </PreloaderContext.Provider>
  );
}

export function usePreloader() {
  const ctx = useContext(PreloaderContext);
  if (!ctx) throw new Error("usePreloader must be used within PreloaderProvider");
  return ctx;
}
