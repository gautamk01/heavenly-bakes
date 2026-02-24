import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { usePreloader } from "@/context/PreloaderContext";
import { Link } from "react-router-dom";
import { cloudinaryUrl } from "@/lib/cloudinaryUrl";

const HERO_IMAGES = [
  {
    src: cloudinaryUrl("/Cake%20images/p27/heavenlybakes.by.divya_1653890429_2849361901436936913_5465995859.jpg"),
    alt: "Beautifully decorated multi-tiered celebration cake",
    scatter: true,
  },
  {
    src: cloudinaryUrl("/Cake%20images/p35/heavenlybakes.by.divya_1644635390_2771725002020842980_5465995859.jpg"),
    alt: "Elegant Black Forest cake with buttercream flowers",
    scatter: true,
  },
  {
    src: cloudinaryUrl("/Cake%20images/p17/heavenlybakes.by.divya_1676042147_3035183977905671948_5465995859.jpg"),
    alt: "German chocolate standing cake",
    scatter: true,
  },
  {
    src: cloudinaryUrl("/Cake%20images/p45/heavenlybakes.by.divya_1633023522_2674317597390200178_5465995859.jpg"),
    alt: "Avengers themed cake",
  },
  {
    src: cloudinaryUrl("/Cake%20images/p62/heavenlybakes.by.divya_1624302347_2601159076356646597_5465995859.jpg"),
    alt: "Pink gold bunny cake",
  },
  {
    src: cloudinaryUrl("/Cake%20images/p80/heavenlybakes.by.divya_1605443337_2442958240330588473_5465995859.jpg"),
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
      const headlineEl = sectionRef.current?.querySelector("main h2");
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

        onPreloaderComplete(() => {
          const isDesktop = !isMobile;

          // Show main + sections
          gsap.to("main, section, footer", {
            autoAlpha: 1,
            duration: 0.4,
            ease: "power2.out",
          });

          // Carousel images reveal
          gsap.set(".hero-carousel-img.scatter-img", { opacity: 0 });
          gsap.to(".hero-carousel-img.scatter-img", {
            opacity: isDesktop ? 1 : 0.3,
            duration: isDesktop ? 1 : 0.8,
            ease: "power2.out",
            stagger: isDesktop ? 0.3 : 0.15,
            delay: isDesktop ? 0 : 0.1,
          });

          // SVG line-art stroke draw-in
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
            gsap.to(".hero-line-art", {
              opacity: isDesktop ? 0.18 : 0.12,
              duration: 1,
              ease: "power2.out",
              stagger: 0.15,
            });
            gsap.to(heroLinePaths, {
              strokeDashoffset: 0,
              duration: isDesktop ? 2.5 : 1.8,
              ease: "power2.inOut",
              stagger: isDesktop ? 0.3 : 0.2,
            });
          }

          // Hero text
          gsap.to(".hero-text-content", {
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
          });

          // Headline chars
          if (headlineSplit) {
            gsap.to(headlineSplit.chars, {
              y: 0,
              stagger: isDesktop ? 0.03 : 0.02,
              duration: isDesktop ? 1 : 0.8,
              ease: "power4.out",
              delay: 0.2,
              onComplete: () => {
                document.querySelectorAll("main h2 .char").forEach((el) => {
                  if (el.parentElement)
                    el.parentElement.style.overflow = "visible";
                });
              },
            });
          }

          // Subtext
          if (subtextSplit) {
            gsap.to(subtextSplit.lines, {
              y: 0,
              stagger: 0.1,
              duration: isDesktop ? 1 : 0.8,
              ease: "power4.out",
              delay: 0.4,
            });
          }

          // Button
          gsap.to(".btn-oval", {
            scale: 1,
            opacity: 1,
            duration: isDesktop ? 1 : 0.8,
            ease: "power4.out",
            delay: 0.5,
          });

          // Start carousel after reveal
          gsap.delayedCall(2, startCarousel);
        });
      } else {
        // Return visit: content already visible
        gsap.set(".hero-text-content", { opacity: 1 });
        gsap.delayedCall(0.1, () => {
          document.querySelectorAll("main h2 .char").forEach((el) => {
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
      <main className="flex-grow relative w-full max-w-7xl mx-auto px-4 py-12 md:px-8 lg:px-12 md:py-20 lg:py-28 min-h-[85vh] md:min-h-[90vh] flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-20 overflow-hidden">
      {/* SVG Line-Art Decorations */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-[1] overflow-hidden">
        {/* Cupcake outline - top-left */}
        <svg
          className="hero-line-art absolute top-[8%] left-[3%] w-[80px] md:w-[120px]"
          viewBox="0 0 100 120"
          fill="none"
        >
          <path
            className="hero-line-path"
            d="M50 8 C50 8 42 5 40 12 C38 19 44 22 50 22 C56 22 62 19 60 12 C58 5 50 8 50 8 Z M35 28 C28 28 22 34 25 42 C28 50 35 52 50 52 C65 52 72 50 75 42 C78 34 72 28 65 28 C60 28 55 30 50 30 C45 30 40 28 35 28 Z M28 56 L72 56 C72 56 74 58 74 60 L68 100 C68 104 64 108 60 108 L40 108 C36 108 32 104 32 100 L26 60 C26 58 28 56 28 56 Z M40 72 L60 72 M38 88 L62 88"
            stroke="#D97762"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Whisk - top-right */}
        <svg
          className="hero-line-art absolute top-[6%] right-[3%] w-[40px] md:w-[65px] rotate-[25deg]"
          viewBox="0 0 50 150"
          fill="none"
        >
          <path
            className="hero-line-path"
            d="M25 0 L25 55 M18 8 L32 8 M20 3 L30 3 M25 55 C12 62 5 80 8 100 C11 120 20 135 25 145 M25 55 C38 62 45 80 42 100 C39 120 30 135 25 145 M25 55 C18 65 15 82 18 100 C21 115 23 130 25 145 M25 55 C32 65 35 82 32 100 C29 115 27 130 25 145"
            stroke="#D97762"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Decorative swirl - bottom-left (desktop) */}
        <svg
          className="hero-line-art absolute bottom-[10%] left-[5%] w-[60px] md:w-[100px] hidden md:block"
          viewBox="0 0 100 60"
          fill="none"
        >
          <path
            className="hero-line-path"
            d="M5 30 C5 30 15 10 30 10 C45 10 50 25 50 30 C50 35 45 45 35 45 C25 45 20 35 25 30 C30 25 40 25 45 30 C55 40 70 45 85 35 C95 28 95 15 85 10 C75 5 65 15 70 25 C75 35 90 40 95 30"
            stroke="#D97762"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Cake slice - mid-right */}
        <svg
          className="hero-line-art bakery-doodle absolute top-[40%] right-[2%] w-[70px] md:w-[110px]"
          viewBox="0 0 80 90"
          fill="none"
        >
          <path
            className="hero-line-path"
            d="M10 75 L40 10 L70 75 Z M10 75 L70 75 M15 65 L65 65 M20 55 L60 55 M25 40 C30 35 35 37 40 35 C45 37 50 35 55 40 M38 10 C38 5 42 5 42 10"
            stroke="#D97762"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Cookie - bottom-right (desktop) */}
        <svg
          className="hero-line-art bakery-doodle absolute bottom-[15%] right-[8%] w-[65px] md:w-[100px] hidden md:block"
          viewBox="0 0 80 80"
          fill="none"
        >
          <path
            className="hero-line-path"
            d="M40 8 C55 8 68 15 72 28 C76 41 72 55 62 64 C52 73 38 76 25 72 C12 68 4 55 4 40 C4 25 15 12 28 8 C32 7 36 7 40 8 Z"
            stroke="#D97762"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <circle cx="25" cy="30" r="4" stroke="#D97762" strokeWidth="1.2" />
          <circle cx="45" cy="25" r="3.5" stroke="#D97762" strokeWidth="1.2" />
          <circle cx="55" cy="45" r="4" stroke="#D97762" strokeWidth="1.2" />
          <circle cx="30" cy="55" r="3" stroke="#D97762" strokeWidth="1.2" />
          <circle cx="42" cy="48" r="2.5" stroke="#D97762" strokeWidth="1.2" />
          <circle cx="20" cy="42" r="2" stroke="#D97762" strokeWidth="1.2" />
        </svg>
        {/* Birthday candle - top-center-left (desktop) */}
        <svg
          className="hero-line-art bakery-doodle absolute top-[15%] left-[25%] w-[40px] md:w-[65px] hidden md:block"
          viewBox="0 0 40 100"
          fill="none"
        >
          <path
            className="hero-line-path"
            d="M20 30 L20 90 M14 90 L26 90 M12 30 L28 30 M20 30 L20 18 M16 18 C16 10 20 5 20 5 C20 5 24 10 24 18 C24 22 22 24 20 24 C18 24 16 22 16 18 Z M15 50 L25 50 M15 70 L25 70"
            stroke="#D97762"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Croissant - bottom center (desktop) */}
        <svg
          className="hero-line-art bakery-doodle absolute bottom-[5%] left-[40%] w-[80px] md:w-[130px] hidden md:block"
          viewBox="0 0 100 60"
          fill="none"
        >
          <path
            className="hero-line-path"
            d="M10 45 C10 45 15 20 30 15 C40 12 45 18 50 25 C55 18 60 12 70 15 C85 20 90 45 90 45 M10 45 C25 50 40 52 50 50 C60 52 75 50 90 45 M25 30 C30 25 35 28 40 32 M60 32 C65 28 70 25 75 30 M35 42 C40 38 45 38 50 40 C55 38 60 38 65 42"
            stroke="#D97762"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Rolling pin - mid-left */}
        <svg
          className="hero-line-art bakery-doodle absolute top-[55%] left-[2%] w-[40px] md:w-[65px] rotate-[-30deg]"
          viewBox="0 0 40 120"
          fill="none"
        >
          <path
            className="hero-line-path"
            d="M20 5 L20 15 M15 15 C12 15 10 18 10 22 L10 98 C10 102 12 105 15 105 L25 105 C28 105 30 102 30 98 L30 22 C30 18 28 15 25 15 Z M20 105 L20 115 M14 10 L26 10 M14 110 L26 110"
            stroke="#D97762"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

        {/* Left Column: Text + CTAs */}
        <div
          className="hero-text-content relative z-20 w-full md:w-[45%] text-center md:text-left flex-shrink-0 pt-8 md:pt-0"
          style={{ opacity: 0 }}
        >
          <h2 className="font-display text-[clamp(1.75rem,5.5vw,2.75rem)] md:text-5xl lg:text-6xl xl:text-7xl leading-[1.15] md:leading-[1.1] text-primary mb-6 md:mb-8">
            They are baked <br className="hidden md:inline" />
            <span className="italic font-light text-black dark:text-white">
              especially
            </span>
            <span className="whitespace-nowrap"> for you</span>
          </h2>
          <p className="font-body text-base md:text-lg lg:text-xl text-text-light/80 dark:text-text-dark/80 max-w-md mb-8 md:mb-10 mx-auto md:mx-0 leading-relaxed">
            Handcrafted daily with organic flour and patience. Experience the
            crunch that tells a story of tradition.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button
              className="btn-oval open-booking-btn px-8 py-3 md:px-10 md:py-4 text-base md:text-lg font-display italic bg-primary text-white border-primary hover:bg-primary-dark inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
              onClick={onBookClick}
            >
              <span className="material-icons text-xl">cake</span>
              Book a Cake
            </button>
            <Link
              to="/portfolio"
              className="btn-oval px-8 py-3 md:px-10 md:py-4 text-base md:text-lg font-display italic text-primary border-primary hover:bg-primary hover:text-white inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-icons text-xl">collections</span>
              View Portfolio
            </Link>
          </div>
        </div>

        {/* Right Column: Image Collage */}
        <div className="relative z-10 w-full md:w-[55%] flex items-center justify-center md:justify-end">
          <div
            className="hero-collage relative w-[85%] sm:w-[75%] md:w-full max-w-[540px]"
            style={{ aspectRatio: "4/5" }}
          >
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
