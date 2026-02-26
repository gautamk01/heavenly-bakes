import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const LenisContext = createContext<Lenis | null>(null);

export function LenisProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const tickerFnRef = useRef<((time: number) => void) | null>(null);

  useLayoutEffect(() => {
    const instance = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
    });

    instance.on("scroll", ScrollTrigger.update);

    const tickerFn = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(500, 33);
    tickerFnRef.current = tickerFn;

    setLenis(instance);

    return () => {
      if (tickerFnRef.current) {
        gsap.ticker.remove(tickerFnRef.current);
      }
      instance.destroy();
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}

export function useLenis() {
  return useContext(LenisContext);
}
