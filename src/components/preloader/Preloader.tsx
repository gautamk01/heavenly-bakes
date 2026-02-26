import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { usePreloader } from "@/context/PreloaderContext";
import { loadCakeData } from "@/lib/cakeLoader";
import { preloadImages } from "@/lib/imagePreloader";
import { optimizedUrl, lqipUrl } from "@/lib/cloudinaryUrl";

const PRELOADER_SVG_ICONS = [
  `<svg viewBox="0 0 40 48" fill="none"><path d="M12 22C9 22 7 19 9 16C11 13 16 11 20 11C24 11 29 13 31 16C33 19 31 22 28 22Z M11 24L29 24C29 24 30 25 30 26L27 42C27 43 26 44 25 44L15 44C14 44 13 43 13 42L10 26C10 25 11 24 11 24Z M20 8C20 6 20 4 20 3" stroke="#D97762" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 40 44" fill="none"><path d="M6 28L34 28L34 40C34 42 32 44 30 44L10 44C8 44 6 42 6 40Z M6 28C6 24 10 20 20 20C30 20 34 24 34 28 M14 20L14 14M20 20L20 12M26 20L26 14 M14 14C14 12 14 10 14 10C15 8 13 8 14 10M20 12C20 10 20 8 20 8C21 6 19 6 20 8M26 14C26 12 26 10 26 10C27 8 25 8 26 10 M6 34L34 34" stroke="#D97762" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 40 40" fill="none"><path d="M8 32L32 32L32 38C32 39 31 40 30 40L10 40C9 40 8 39 8 38Z M6 22L34 22L34 32L6 32Z M10 14L30 14L30 22L10 22Z M6 22L6 22C4 22 4 20 6 18L10 14M34 22C36 22 36 20 34 18L30 14 M14 14L14 10C14 8 16 6 20 6C24 6 26 8 26 10L26 14 M6 27L34 27" stroke="#D97762" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 40 30" fill="none"><path d="M8 22C4 20 2 16 4 12C6 8 10 6 14 8L20 15L26 8C30 6 34 8 36 12C38 16 36 20 32 22 M14 8L10 2M26 8L30 2 M8 22C12 24 16 26 20 26C24 26 28 24 32 22 M12 18C16 20 20 21 20 21C20 21 24 20 28 18" stroke="#D97762" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 44 32" fill="none"><path d="M6 18L6 28C6 30 8 32 10 32L34 32C36 32 38 30 38 28L38 18 M6 18C6 12 10 6 22 6C34 6 38 12 38 18C38 20 36 22 34 22L10 22C8 22 6 20 6 18Z M14 22L14 32M22 22L22 32M30 22L30 32 M12 12C16 10 20 9 22 9C24 9 28 10 32 12" stroke="#D97762" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 36 40" fill="none"><path d="M8 20L28 20L26 36C26 38 24 40 22 40L14 40C12 40 10 38 10 36Z M8 20C8 20 4 18 4 14C4 10 8 8 10 10C10 6 14 4 18 4C22 4 26 6 26 10C28 8 32 10 32 14C32 18 28 20 28 20 M14 20L14 36M22 20L22 36" stroke="#D97762" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 28 44" fill="none"><path d="M8 4L20 4L22 6L18 34L16 42L14 42L12 34L6 6Z M8 4C8 2 10 1 14 1C18 1 20 2 20 4 M10 12L20 12 M12 34L18 34 M14 42L14 44" stroke="#D97762" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 20 48" fill="none"><path d="M10 48L10 22 M6 22L14 22L14 6C14 3 12 1 10 1C8 1 6 3 6 6Z M6 10L14 10" stroke="#D97762" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 40 28" fill="none"><path d="M4 8L36 8C36 8 38 14 36 20C34 24 28 28 20 28C12 28 6 24 4 20C2 14 4 8 4 8Z M2 8L38 8 M12 8L12 2M20 8L20 4M28 8L28 2 M10 16C14 18 18 20 20 20C22 20 26 18 30 16" stroke="#D97762" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 40 28" fill="none"><path d="M4 16L36 16L36 22C36 25 32 28 20 28C8 28 4 25 4 22Z M4 16C4 10 10 4 20 4C30 4 36 10 36 16 M10 16C10 12 14 8 20 8C26 8 30 12 30 16 M20 4L20 16 M12 6L28 16M28 6L12 16" stroke="#D97762" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 32 32" fill="none"><path d="M16 2C8.3 2 2 8.3 2 16C2 23.7 8.3 30 16 30C23.7 30 30 23.7 30 16C30 8.3 23.7 2 16 2Z M10 12C10.5 12 11 11.5 11 11C11 10.5 10.5 10 10 10C9.5 10 9 10.5 9 11C9 11.5 9.5 12 10 12Z M18 10C18.5 10 19 9.5 19 9C19 8.5 18.5 8 18 8C17.5 8 17 8.5 17 9C17 9.5 17.5 10 18 10Z M14 18C14.5 18 15 17.5 15 17C15 16.5 14.5 16 14 16C13.5 16 13 16.5 13 17C13 17.5 13.5 18 14 18Z M22 16C22.5 16 23 15.5 23 15C23 14.5 22.5 14 22 14C21.5 14 21 14.5 21 15C21 15.5 21.5 16 22 16Z M12 24C12.5 24 13 23.5 13 23C13 22.5 12.5 22 12 22C11.5 22 11 22.5 11 23C11 23.5 11.5 24 12 24Z M20 22C20.5 22 21 21.5 21 21C21 20.5 20.5 20 20 20C19.5 20 19 20.5 19 21C19 21.5 19.5 22 20 22Z" stroke="#D97762" stroke-width="1" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 16 40" fill="none"><path d="M5 16L11 16L11 38C11 39 10 40 9 40L7 40C6 40 5 39 5 38Z M8 16L8 10 M8 10C8 10 10 7 10 5C10 3 8 1 8 1C8 1 6 3 6 5C6 7 8 10 8 10Z M5 24L11 24M5 32L11 32" stroke="#D97762" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 24 48" fill="none"><path d="M12 2L12 18M12 18C7 21 4 28 5 36C6 42 10 46 12 48M12 18C17 21 20 28 19 36C18 42 14 46 12 48M12 18C9 22 8 30 9 36C10 40 11 44 12 48M12 18C15 22 16 30 15 36C14 40 13 44 12 48" stroke="#D97762" stroke-width="1" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 48 20" fill="none"><path d="M2 10L10 10M10 4C10 2 12 1 14 1L34 1C36 1 38 2 38 4L38 16C38 18 36 19 34 19L14 19C12 19 10 18 10 16ZM38 10L46 10" stroke="#D97762" stroke-width="1" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 28 28" fill="none"><path d="M14 4C14 4 18 2 20 1M14 4C14 4 10 2 8 1M14 4L14 12M10 16C10 13 7 10 4 12C1 14 3 19 6 19C9 19 10 16 10 16ZM18 16C18 13 21 10 24 12C27 14 25 19 22 19C19 19 18 16 18 16ZM10 16L18 16" stroke="#D97762" stroke-width="1" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 24 22" fill="none"><path d="M12 20C12 20 2 14 2 7C2 3 5 1 8 1C10 1 12 3 12 5C12 3 14 1 16 1C19 1 22 3 22 7C22 14 12 20 12 20Z" stroke="#D97762" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 28 28" fill="none"><path d="M14 2C7.4 2 2 7.4 2 14C2 20.6 7.4 26 14 26C20.6 26 26 20.6 26 14C26 7.4 20.6 2 14 2ZM14 10C11.8 10 10 11.8 10 14C10 16.2 11.8 18 14 18C16.2 18 18 16.2 18 14C18 11.8 16.2 10 14 10Z" stroke="#D97762" stroke-width="1" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 32 32" fill="none"><path d="M16 30C16 30 8 26 4 20C1 16 1 10 4 7C7 4 11 4 14 7L16 10L18 7C21 4 25 4 28 7C31 10 31 16 28 20C24 26 16 30 16 30Z M14 7C14 7 10 14 10 18M18 7C18 7 22 14 22 18 M10 18L22 18" stroke="#D97762" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 40 36" fill="none"><path d="M4 24L20 6L36 24ZM4 24L4 30C4 32 6 34 8 34L32 34C34 34 36 32 36 30L36 24M4 24L36 24M20 6L20 24" stroke="#D97762" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L14 9L21 9L15 14L17 21L12 17L7 21L9 14L3 9L10 9Z" stroke="#D97762" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
];

export default function Preloader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);
  const { hasSeenPreloader, registerTimeline } = usePreloader();

  useLayoutEffect(() => {
    if (hasSeenPreloader) {
      // Skip preloader — hide it, show page content
      gsap.set(".preloader-progress, .preloader-mask, .preloader-content", {
        display: "none",
        autoAlpha: 0,
      });
      gsap.set("nav, main, section, footer", { autoAlpha: 1 });

      // SVG line-art at rest state
      gsap.set(".hero-line-path", (_i: number, target: SVGPathElement) => {
        const len = target.getTotalLength();
        return { strokeDasharray: len, strokeDashoffset: 0 };
      });
      gsap.set(".hero-line-art", { opacity: 0.15 });

      // Background preload for cache freshness on return visits
      loadCakeData().then((cakes) => {
        const fullUrls = cakes.map((c) => optimizedUrl(c.src));
        preloadImages(fullUrls);
      });

      // Register empty timeline so downstream components can chain
      registerTimeline(gsap.timeline());
      return;
    }

    // Lock scroll during preloader
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    // Mark as shown for this session
    sessionStorage.setItem("preloaderShown", "true");

    // Kick off image preloading in parallel with preloader animation
    loadCakeData().then((cakes) => {
      // Preload LQIP first (tiny, loads fast)
      const lqipUrls = cakes.map((c) => lqipUrl(c.src));
      preloadImages(lqipUrls);
      // Then preload optimized full-quality images
      const fullUrls = cakes.map((c) => optimizedUrl(c.src));
      preloadImages(fullUrls);
    });

    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    // --- SplitText setup ---
    const logoEl = containerRef.current?.querySelector(".preloader-logo h1");
    const footerEl = containerRef.current?.querySelector(".preloader-footer p");

    const logoSplit = logoEl
      ? SplitText.create(logoEl, {
          type: "chars",
          mask: "chars",
          charsClass: "char",
        })
      : null;

    const footerSplit = footerEl
      ? SplitText.create(footerEl, {
          type: "lines",
          mask: "lines",
          linesClass: "line",
        })
      : null;

    if (footerSplit) gsap.set(footerSplit.lines, { y: "100%" });

    // Hide page content during preloader
    gsap.set("nav, main, section, footer", { autoAlpha: 0 });

    // --- Icon spawning ---
    const iconsContainer = iconsRef.current!;
    let spawnedIcons = 0;
    const maxIcons = isMobile ? 50 : 90;

    function spawnIcon() {
      if (spawnedIcons >= maxIcons) return;
      const svgStr =
        PRELOADER_SVG_ICONS[spawnedIcons % PRELOADER_SVG_ICONS.length];
      const el = document.createElement("div");
      el.className = "preloader-icon";
      el.innerHTML = svgStr;
      const size = isMobile
        ? gsap.utils.random(18, 36)
        : gsap.utils.random(24, 52);
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.left = gsap.utils.random(2, 98) + "%";
      el.style.top = gsap.utils.random(2, 98) + "%";
      iconsContainer.appendChild(el);
      spawnedIcons++;

      gsap.fromTo(
        el,
        { opacity: 0, scale: 0, rotation: gsap.utils.random(-45, 45) },
        {
          opacity: gsap.utils.random(0.25, 0.55),
          scale: 1,
          rotation: gsap.utils.random(-15, 15),
          duration: gsap.utils.random(0.3, 0.6),
          ease: "back.out(1.7)",
        },
      );
    }

    function spawnBatch(count: number) {
      for (let i = 0; i < count; i++) {
        gsap.delayedCall(i * 0.04, spawnIcon);
      }
    }

    // Spawn initial batch
    spawnBatch(Math.ceil(maxIcons * 0.4));

    // --- Progress bar animation ---
    function animateProgress(duration = 4) {
      const tl = gsap.timeline();
      const counterSteps = 5;
      let currentProgress = 0;

      for (let i = 0; i < counterSteps; i++) {
        const finalStep = i === counterSteps - 1;
        const targetProgress = finalStep
          ? 1
          : Math.min(currentProgress + Math.random() * 0.3 + 0.1, 0.9);
        currentProgress = targetProgress;
        const iconsToSpawn = finalStep
          ? Math.ceil(maxIcons * 0.2)
          : Math.ceil(maxIcons * 0.1);
        tl.to(".preloader-progress-bar", {
          scaleX: targetProgress,
          duration: duration / counterSteps,
          ease: "power2.out",
          onStart: () => spawnBatch(iconsToSpawn),
        });
      }
      return tl;
    }

    // === MASTER TIMELINE ===
    const t1 = gsap.timeline({ delay: 0.5 });

    if (logoSplit) {
      t1.to(logoSplit.chars, {
        x: "0%",
        stagger: 0.05,
        duration: 1,
        ease: "power4.inOut",
      });
    }

    if (footerSplit) {
      t1.to(
        footerSplit.lines,
        { y: "0%", stagger: 0.1, duration: 1, ease: "power4.inOut" },
        "0.25",
      );
    }

    t1.add(animateProgress(), "<").set(".preloader-progress", {
      backgroundColor: "#f5f5f5",
    });

    if (logoSplit) {
      t1.to(
        logoSplit.chars,
        { x: "-100%", stagger: 0.05, duration: 1, ease: "power4.inOut" },
        "-=0.5",
      );
    }

    if (footerSplit) {
      t1.to(
        footerSplit.lines,
        { y: "-100%", stagger: 0.1, duration: 1, ease: "power4.inOut" },
        "<",
      );
    }

    // Icons fade out
    t1.to(
      ".preloader-icon",
      {
        opacity: 0,
        scale: 0.5,
        duration: 0.6,
        ease: "power2.in",
        stagger: { each: 0.02, from: "random" },
      },
      "<",
    );

    // === EXIT ===
    if (isMobile) {
      t1.to(
        ".preloader-progress",
        { autoAlpha: 0, duration: 0.6, ease: "power2.inOut" },
        "-=0.25",
      )
        .to(
          ".preloader-mask",
          { autoAlpha: 0, duration: 0.8, ease: "power2.inOut" },
          "<",
        )
        .to(
          ".preloader-content",
          { autoAlpha: 0, duration: 0.4, ease: "power2.inOut" },
          "<",
        )
        .set(".preloader-progress, .preloader-mask, .preloader-content", {
          display: "none",
        });
    } else {
      t1.to(
        ".preloader-progress",
        { opacity: 0, duration: 0.5, ease: "power3.out" },
        "-=0.25",
      )
        .to(
          ".preloader-mask",
          { scale: 5, duration: 2.5, ease: "power3.out" },
          "<",
        )
        .set(".preloader-progress, .preloader-mask, .preloader-content", {
          autoAlpha: 0,
          display: "none",
        });
    }

    // Reveal all page content
    t1.to(
      "nav, main, section, footer",
      { autoAlpha: 1, duration: 0.6, ease: "power2.out" },
      isMobile ? "-=0.3" : "-=1.5",
    );

    // Unlock scroll after preloader finishes
    t1.call(() => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    });

    // Wire master timeline into context so other components can chain onto it
    registerTimeline(t1);

    return () => {
      t1.kill();
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      // Clean up spawned icons
      if (iconsRef.current) iconsRef.current.innerHTML = "";
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (hasSeenPreloader) return null;

  return (
    <div ref={containerRef}>
      <div className="preloader-progress">
        <div className="preloader-progress-bar" />
        <div className="preloader-logo">
          <h1>Heavenly Bakes</h1>
        </div>
        <div className="preloader-icons" ref={iconsRef} />
      </div>

      <div className="preloader-mask" />
      <div className="preloader-content">
        <div className="preloader-footer">
          <p>
            Handcrafted with love, baked with patience — something sweet is on
            its way
          </p>
        </div>
      </div>
    </div>
  );
}
