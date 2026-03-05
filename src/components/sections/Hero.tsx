import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { usePreloader } from "@/context/PreloaderContext";
import { Link } from "react-router-dom";
import { cloudinaryUrl } from "@/lib/cloudinaryUrl";

const HERO_IMAGES = [
  {
    src: cloudinaryUrl(
      "/Cake%20images/p27/heavenlybakes.by.divya_1653890429_2849361901436936913_5465995859.jpg",
    ),
    alt: "Beautifully decorated multi-tiered celebration cake",
    scatter: true,
  },
  {
    src: cloudinaryUrl(
      "/Cake%20images/p35/heavenlybakes.by.divya_1644635390_2771725002020842980_5465995859.jpg",
    ),
    alt: "Elegant Black Forest cake with buttercream flowers",
    scatter: true,
  },
  {
    src: cloudinaryUrl(
      "/Cake%20images/p17/heavenlybakes.by.divya_1676042147_3035183977905671948_5465995859.jpg",
    ),
    alt: "German chocolate standing cake",
    scatter: true,
  },
  {
    src: cloudinaryUrl(
      "/Cake%20images/p45/heavenlybakes.by.divya_1633023522_2674317597390200178_5465995859.jpg",
    ),
    alt: "Avengers themed cake",
  },
  {
    src: cloudinaryUrl(
      "/Cake%20images/p62/heavenlybakes.by.divya_1624302347_2601159076356646597_5465995859.jpg",
    ),
    alt: "Pink gold bunny cake",
  },
  {
    src: cloudinaryUrl(
      "/Cake%20images/p80/heavenlybakes.by.divya_1605443337_2442958240330588473_5465995859.jpg",
    ),
    alt: "Baby's first birthday cake",
  },
];

export default function Hero({ onBookClick }: { onBookClick?: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { hasSeenPreloader, onPreloaderComplete } = usePreloader();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      // --- Content SplitTexts ---
      const headlineEl = sectionRef.current?.querySelector("main h1");
      const subtextEl = sectionRef.current?.querySelector("main p");

      const headlineSplit = headlineEl
        ? SplitText.create(headlineEl, {
            type: "chars",
            mask: "chars",
            charsClass: "char",
          })
        : null;
      const subtextSplit = subtextEl
        ? SplitText.create(subtextEl, {
            type: "lines",
            mask: "lines",
            linesClass: "line",
          })
        : null;

      if (!hasSeenPreloader) {
        // First visit: hide content, chain onto preloader
        if (headlineSplit) gsap.set(headlineSplit.chars, { y: "100%" });
        if (subtextSplit) gsap.set(subtextSplit.lines, { y: "100%" });
        gsap.set(".btn-oval", { scale: 0, opacity: 0 });
        gsap.set(".hero-line-art", { opacity: 0 });
        gsap.set(".hero-carousel-img", { opacity: 0, scale: 0.5 });
        gsap.set(".hero-text-content", { opacity: 0 });

        onPreloaderComplete(() => {
          const isDesktop = !isMobile;
          const tl = gsap.timeline();

          // Phase 1: Images fly in
          tl.to(".hero-carousel-img.scatter-img", {
            opacity: isDesktop ? 1 : 0.3,
            scale: 1,
            duration: 0.8,
            ease: "back.out(1.4)",
            stagger: 0.2,
          });

          // Phase 2: SVG line-art draws in (overlapping with images)
          const heroLinePaths =
            gsap.utils.toArray<SVGPathElement>(".hero-line-path");
          if (heroLinePaths.length > 0) {
            heroLinePaths.forEach((path) => {
              const length = path.getTotalLength();
              gsap.set(path, {
                strokeDasharray: length,
                strokeDashoffset: length,
              });
            });
            tl.to(
              ".hero-line-art",
              {
                opacity: isDesktop ? 0.18 : 0.12,
                duration: 1,
                ease: "power2.out",
                stagger: 0.15,
              },
              0.3,
            );
            tl.to(
              heroLinePaths,
              {
                strokeDashoffset: 0,
                duration: isDesktop ? 2.5 : 1.8,
                ease: "power2.inOut",
                stagger: isDesktop ? 0.3 : 0.2,
              },
              0.3,
            );
          }

          // Phase 3: Text content appears
          tl.to(
            ".hero-text-content",
            { opacity: 1, duration: 0.4, ease: "power2.out" },
            0.6,
          );

          if (headlineSplit) {
            tl.to(
              headlineSplit.chars,
              {
                y: 0,
                stagger: isDesktop ? 0.03 : 0.02,
                duration: isDesktop ? 1 : 0.8,
                ease: "power4.out",
                onComplete: () => {
                  document.querySelectorAll("main h1 .char").forEach((el) => {
                    if (el.parentElement)
                      el.parentElement.style.overflow = "visible";
                  });
                },
              },
              0.7,
            );
          }

          if (subtextSplit) {
            tl.to(
              subtextSplit.lines,
              {
                y: 0,
                stagger: 0.1,
                duration: isDesktop ? 1 : 0.8,
                ease: "power4.out",
              },
              0.9,
            );
          }

          // Phase 4: Buttons pop in
          tl.to(
            ".btn-oval",
            {
              scale: 1,
              opacity: 1,
              duration: 0.8,
              ease: "back.out(1.7)",
              stagger: 0.15,
            },
            1.2,
          );

          // Phase 5: Start carousel after reveal settles
          tl.call(() => {
            gsap.delayedCall(2, startCarousel);
          });
        });
      } else {
        // Return visit: content already visible
        gsap.set(".hero-text-content", { opacity: 1 });
        gsap.delayedCall(0.1, () => {
          document.querySelectorAll("main h1 .char").forEach((el) => {
            if (el.parentElement) el.parentElement.style.overflow = "visible";
          });
        });
        gsap.delayedCall(1.5, startCarousel);
      }

      // --- Scroll-triggered section reveals ---
      gsap.utils.toArray<HTMLElement>(".reveal-section").forEach((el) => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        });
      });

      // --- HERO CAROUSEL ---
      function startCarousel() {
        const allImgs =
          gsap.utils.toArray<HTMLImageElement>(".hero-carousel-img");
        if (allImgs.length < 4) return;

        const TOTAL_IMAGES = allImgs.length;
        const CYCLE_INTERVAL = 5;
        const TRANSITION_DURATION = 1;
        const EASING = "power2.inOut";

        const slots = {
          main: {
            top: "5%",
            left: "25%",
            width: "75%",
            height: "70%",
            rotation: 3,
            opacity: 1,
            zIndex: 20,
            borderRadius: "1rem",
            boxShadow:
              "0 25px 50px -12px rgba(0,0,0,0.3), 0 8px 20px -5px rgba(0,0,0,0.15)",
          },
          bottom: {
            top: "48%",
            left: "0%",
            width: "55%",
            height: "50%",
            rotation: -4,
            opacity: 1,
            zIndex: 30,
            borderRadius: "1rem",
            boxShadow:
              "0 20px 40px -10px rgba(0,0,0,0.25), 0 5px 15px -5px rgba(0,0,0,0.1)",
          },
          smallTop: {
            top: "0%",
            left: "5%",
            width: "38%",
            height: "32%",
            rotation: -6,
            opacity: 1,
            zIndex: 10,
            borderRadius: "0.75rem",
            boxShadow:
              "0 15px 35px -5px rgba(0,0,0,0.2), 0 5px 15px -5px rgba(0,0,0,0.1)",
          },
          offscreen: {
            top: "50%",
            left: "50%",
            width: "20%",
            height: "20%",
            rotation: 0,
            opacity: 0,
            zIndex: 0,
            borderRadius: "1rem",
            boxShadow: "0 0 0 0 rgba(0,0,0,0)",
          },
        };

        let slotAssignments = { main: 0, bottom: 1, smallTop: 2 };
        let nextImageIndex = 3;

        function setInitialPositions() {
          allImgs.forEach((img, i) => {
            const clearProps = { scale: 1 };
            if (i === slotAssignments.main)
              gsap.set(img, { ...slots.main, ...clearProps });
            else if (i === slotAssignments.bottom)
              gsap.set(img, { ...slots.bottom, ...clearProps });
            else if (i === slotAssignments.smallTop)
              gsap.set(img, { ...slots.smallTop, ...clearProps });
            else gsap.set(img, { ...slots.offscreen, ...clearProps });
          });
        }

        function rotateCycle() {
          const smallTopImg = allImgs[slotAssignments.smallTop];
          const mainImg = allImgs[slotAssignments.main];
          const bottomImg = allImgs[slotAssignments.bottom];
          const newImg = allImgs[nextImageIndex];

          const tl = gsap.timeline();
          tl.to(
            smallTopImg,
            { ...slots.main, duration: TRANSITION_DURATION, ease: EASING },
            0,
          );
          tl.to(
            mainImg,
            { ...slots.bottom, duration: TRANSITION_DURATION, ease: EASING },
            0,
          );
          tl.to(
            bottomImg,
            { ...slots.offscreen, duration: TRANSITION_DURATION, ease: EASING },
            0,
          );
          gsap.set(newImg, {
            top: "-10%",
            left: "0%",
            width: "30%",
            height: "25%",
            rotation: -10,
            opacity: 0,
            zIndex: 10,
          });
          tl.to(
            newImg,
            { ...slots.smallTop, duration: TRANSITION_DURATION, ease: EASING },
            0.1,
          );

          tl.call(() => {
            slotAssignments = {
              main: slotAssignments.smallTop,
              bottom: slotAssignments.main,
              smallTop: nextImageIndex,
            };
            nextImageIndex = (nextImageIndex + 1) % TOTAL_IMAGES;
          });
        }

        setInitialPositions();
        function tick() {
          rotateCycle();
          gsap.delayedCall(CYCLE_INTERVAL, tick);
        }
        gsap.delayedCall(CYCLE_INTERVAL, tick);
      }

      return () => {
        if (headlineSplit) headlineSplit.revert();
        if (subtextSplit) subtextSplit.revert();
      };
    }, sectionRef);

    return () => ctx.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-background-light dark:bg-background-dark"
    >
      <main className="flex-grow relative w-full max-w-7xl mx-auto px-4 pt-16 pb-8 md:px-8 lg:px-12 md:py-20 lg:py-28 min-h-[100dvh] md:min-h-[90vh] flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 lg:gap-20 overflow-hidden">
        {/* SVG Line-Art Decorations */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-[1] overflow-hidden">
          {/* Cupcake - top-left */}
          <svg
            className="hero-line-art absolute top-[6%] left-[2%] w-[70px] md:w-[110px]"
            viewBox="0 0 100 130"
            fill="none"
          >
            <path
              className="hero-line-path"
              d="M50 10 C50 4 46 2 43 5 C40 8 42 14 46 16 C48 17 50 16 50 14 M30 30 C22 30 16 38 18 48 C20 56 30 62 50 62 C70 62 80 56 82 48 C84 38 78 30 70 30 C64 30 58 34 50 34 C42 34 36 30 30 30 Z M32 66 C32 66 34 68 34 70 L38 104 C38 108 42 112 46 112 L54 112 C58 112 62 108 62 104 L66 70 C66 68 68 66 68 66 M32 66 L68 66 M36 82 L64 82"
              stroke="#D97762"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Whisk - top-right */}
          <svg
            className="hero-line-art absolute top-[5%] right-[3%] w-[36px] md:w-[56px] rotate-[20deg]"
            viewBox="0 0 40 140"
            fill="none"
          >
            <path
              className="hero-line-path"
              d="M17 2 L23 2 M16 6 L24 6 M20 6 L20 50 M20 50 Q8 65 6 85 Q4 108 20 132 M20 50 Q32 65 34 85 Q36 108 20 132 M20 50 Q13 68 12 88 Q11 110 20 132 M20 50 Q27 68 28 88 Q29 110 20 132"
              stroke="#D97762"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Cake slice - mid-right */}
          <svg
            className="hero-line-art absolute top-[42%] right-[1%] w-[60px] md:w-[100px]"
            viewBox="0 0 90 100"
            fill="none"
          >
            <path
              className="hero-line-path"
              d="M45 12 Q42 6 45 4 Q48 6 45 12 M20 82 L45 18 L70 82 Q58 88 45 88 Q32 88 20 82 Z M24 72 L66 72 M28 62 L62 62 M32 48 Q38 44 45 46 Q52 44 58 48"
              stroke="#D97762"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Rolling pin - mid-left */}
          <svg
            className="hero-line-art absolute top-[52%] left-[1%] w-[36px] md:w-[55px] rotate-[-25deg]"
            viewBox="0 0 40 130"
            fill="none"
          >
            <path
              className="hero-line-path"
              d="M20 4 L20 16 M15 4 Q20 0 25 4 M14 16 Q10 16 10 22 L10 100 Q10 106 14 106 L26 106 Q30 106 30 100 L30 22 Q30 16 26 16 Z M20 106 L20 118 M15 118 Q20 122 25 118"
              stroke="#D97762"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Decorative flour swirl - bottom-left (desktop) */}
          <svg
            className="hero-line-art absolute bottom-[12%] left-[4%] w-[60px] md:w-[90px] hidden md:block"
            viewBox="0 0 100 60"
            fill="none"
          >
            <path
              className="hero-line-path"
              d="M8 30 Q8 12 28 12 Q48 12 48 30 Q48 46 32 46 Q20 46 22 34 Q24 24 36 26 Q46 28 44 38 M56 22 Q66 14 78 20 Q92 28 82 42 Q74 52 62 46 Q54 42 60 34 Q64 28 72 32"
              stroke="#D97762"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Cookie - bottom-right (desktop) */}
          <svg
            className="hero-line-art absolute bottom-[14%] right-[6%] w-[55px] md:w-[90px] hidden md:block"
            viewBox="0 0 80 80"
            fill="none"
          >
            <path
              className="hero-line-path"
              d="M40 6 Q58 4 70 18 Q82 34 74 54 Q66 72 46 76 Q24 78 12 62 Q2 48 8 30 Q14 12 34 6 Q36 5 40 6 Z"
              stroke="#D97762"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <circle
              cx="26"
              cy="28"
              r="4.5"
              stroke="#D97762"
              strokeWidth="1"
              fill="none"
            />
            <circle
              cx="48"
              cy="22"
              r="3.5"
              stroke="#D97762"
              strokeWidth="1"
              fill="none"
            />
            <circle
              cx="58"
              cy="44"
              r="4"
              stroke="#D97762"
              strokeWidth="1"
              fill="none"
            />
            <circle
              cx="32"
              cy="56"
              r="3.5"
              stroke="#D97762"
              strokeWidth="1"
              fill="none"
            />
            <circle
              cx="44"
              cy="50"
              r="2.5"
              stroke="#D97762"
              strokeWidth="1"
              fill="none"
            />
          </svg>

          {/* Birthday candle - top-center-left (desktop) */}
          <svg
            className="hero-line-art absolute top-[14%] left-[28%] w-[30px] md:w-[50px] hidden md:block"
            viewBox="0 0 40 110"
            fill="none"
          >
            <path
              className="hero-line-path"
              d="M20 22 Q16 14 20 6 Q24 14 20 22 Z M14 28 Q14 22 20 22 Q26 22 26 28 L26 92 Q26 98 20 98 Q14 98 14 92 Z M17 46 L23 46 M17 64 L23 64 M17 80 L23 80"
              stroke="#D97762"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Croissant - bottom center (desktop) */}
          <svg
            className="hero-line-art absolute bottom-[4%] left-[38%] w-[70px] md:w-[115px] hidden md:block"
            viewBox="0 0 100 55"
            fill="none"
          >
            <path
              className="hero-line-path"
              d="M8 40 Q12 18 30 14 Q42 11 50 24 Q58 11 70 14 Q88 18 92 40 Q70 48 50 46 Q30 48 8 40 Z M30 28 Q38 22 44 30 M56 30 Q62 22 70 28 M36 40 Q44 36 50 38 Q56 36 64 40"
              stroke="#D97762"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Left Column: Text + CTAs */}
        <div
          className="hero-text-content relative z-20 w-full md:w-[45%] text-center md:text-left flex-shrink-0 pt-2 md:pt-0"
          style={{ opacity: 0 }}
        >
          <h1 className="font-display text-[clamp(1.8rem,6vw,2.75rem)] md:text-5xl lg:text-6xl xl:text-7xl leading-[1.15] md:leading-[1.1] text-primary mb-4 md:mb-8">
            They are baked <br className="hidden md:inline" />
            <span className="italic font-light text-black dark:text-white">
              especially
            </span>{" "}
            <span className="whitespace-nowrap">for you</span>
          </h1>
          <p className="font-body text-base md:text-lg lg:text-xl text-text-light/80 dark:text-text-dark/80 max-w-md mb-5 md:mb-10 mx-auto md:mx-0 leading-relaxed">
            Handcrafted daily with organic flour and patience. Experience the
            crunch that tells a story of tradition.
          </p>
          <div className="flex flex-row gap-2.5 md:gap-4 justify-center md:justify-start">
            <button
              className="btn-oval open-booking-btn px-5 py-2.5 md:px-10 md:py-4 text-sm md:text-lg font-display italic bg-primary text-white border-primary hover:bg-primary-dark inline-flex items-center justify-center gap-1.5 md:gap-2 cursor-pointer transition-colors"
              onClick={onBookClick}
            >
              <span className="material-icons text-lg md:text-xl">cake</span>
              Book a Cake
            </button>
            <Link
              to="/portfolio"
              className="btn-oval px-5 py-2.5 md:px-10 md:py-4 text-sm md:text-lg font-display italic text-primary border-primary hover:bg-primary hover:text-white inline-flex items-center justify-center gap-1.5 md:gap-2 cursor-pointer"
            >
              <span className="material-icons text-lg md:text-xl">
                collections
              </span>
              Portfolio
            </Link>
          </div>
        </div>

        {/* Right Column: Image Collage */}
        <div className="relative z-10 w-full md:w-[55%] flex-1 flex items-center justify-center md:justify-end">
          <div className="hero-collage relative w-[85%] sm:w-[75%] md:w-full max-w-[540px] aspect-[6/5] md:aspect-[4/5]">
            {/* Decorative blur blobs */}
            <div className="absolute -top-8 -right-8 w-48 h-48 md:w-72 md:h-72 bg-primary/10 rounded-full blur-3xl z-0" />
            <div className="absolute -bottom-6 -left-6 w-40 h-40 md:w-56 md:h-56 bg-primary/8 rounded-full blur-3xl z-0" />

            {/* Hero Carousel Images */}
            {HERO_IMAGES.map((img, i) => (
              <img
                key={i}
                className={`hero-carousel-img${img.scatter ? " scatter-img" : ""}`}
                data-hero-index={i}
                alt={img.alt}
                src={img.src}
                loading={i < 3 ? "eager" : "lazy"}
              />
            ))}

            {/* Floating badge */}
            <div className="absolute bottom-[18%] right-[-8%] md:right-[-5%] z-40 bg-white dark:bg-zinc-800 px-4 py-2 rounded-full shadow-lg border border-black/5 dark:border-white/10">
              <p className="font-display italic text-sm text-primary whitespace-nowrap">
                126+ creations
              </p>
            </div>
          </div>
        </div>
      </main>
    </section>
  );
}
