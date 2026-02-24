import { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import type { CakeData } from "@/types/cake";

// SVG paths for stroke animation
const SVG_PATH_1 =
  "M227.549 1818.76C227.549 1818.76 406.016 2207.75 569.049 2130.26C843.431 1999.85 -264.104 1002.3 227.549 876.262C552.918 792.849 773.647 2456.11 1342.05 2130.26C1885.43 1818.76 14.9644 455.772 760.548 137.262C1342.05 -111.152 1663.5 2266.35 2209.55 1972.76C2755.6 1679.18 1536.63 384.467 1826.55 137.262C2013.5 -22.1463 2209.55 381.262 2209.55 381.262";
const SVG_PATH_2 =
  "M1661.28 2255.51C1661.28 2255.51 2311.09 1960.37 2111.78 1817.01C1944.47 1696.67 718.456 2870.17 499.781 2255.51C308.969 1719.17 2457.51 1613.83 2111.78 963.512C1766.05 313.198 427.949 2195.17 132.281 1455.51C-155.219 736.292 2014.78 891.514 1708.78 252.012C1437.81 -314.29 369.471 909.169 132.281 566.512C18.1772 401.672 244.781 193.012 244.781 193.012";

const STROKE_COLORS = [
  "#d97762",
  "#c4856e",
  "#b89272",
  "#a6856b",
  "#d4856d",
  "#c49074",
  "#c78b5e",
  "#b8937a",
];

interface PortfolioCardProps {
  cake: CakeData;
  index: number;
  onOpenLightbox: (cake: CakeData) => void;
}

export default function PortfolioCard({
  cake,
  index,
  onOpenLightbox,
}: PortfolioCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [sliderIndex, setSliderIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const hasSlider = cake.images.length > 1;
  const color = STROKE_COLORS[index % STROKE_COLORS.length];

  // Setup GSAP hover animation
  useEffect(() => {
    const card = cardRef.current;
    const preview = previewRef.current;
    if (!card || !preview) return;

    const paths = card.querySelectorAll<SVGPathElement>(".svg-stroke path");
    const titleEl = card.querySelector<HTMLHeadingElement>(".preview-info h3");
    const tagEl = card.querySelector<HTMLSpanElement>(".card-tag");
    const descEl = card.querySelector<HTMLParagraphElement>(".card-desc");

    // Word-reveal setup
    if (titleEl) {
      const words = titleEl.textContent?.split(/\s+/) || [];
      titleEl.innerHTML = "";
      words.forEach((w) => {
        const span = document.createElement("span");
        span.className = "word-wrap";
        const inner = document.createElement("span");
        inner.className = "word";
        inner.textContent = w;
        span.appendChild(inner);
        titleEl.appendChild(span);
        titleEl.appendChild(document.createTextNode(" "));
      });
    }

    const wordEls = titleEl ? titleEl.querySelectorAll(".word") : [];
    gsap.set(wordEls, { yPercent: 100 });

    paths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
        attr: { "stroke-width": 200 },
      });
    });

    gsap.set(preview, { opacity: 0 });
    gsap.set([tagEl, descEl].filter(Boolean), { y: 12, opacity: 0 });

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.out" },
    });

    paths.forEach((path) => {
      tl.to(
        path,
        {
          strokeDashoffset: 0,
          attr: { "stroke-width": 700 },
          duration: 0.8,
          ease: "power2.inOut",
        },
        0,
      );
    });

    tl.to(preview, { opacity: 1, duration: 0.8, ease: "power2.inOut" }, 0);
    tl.to(tagEl, { opacity: 1, y: 0, duration: 0.5 }, 0.5);
    tl.to(wordEls, { yPercent: 0, duration: 0.6, stagger: 0.05 }, 0.55);
    if (descEl) tl.to(descEl, { opacity: 1, y: 0, duration: 0.5 }, 0.7);

    tlRef.current = tl;

    const onEnter = () => tl.timeScale(1).play();
    const onLeave = () => tl.timeScale(1.2).reverse();

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);

    return () => {
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
      tl.kill();
    };
  }, []);

  // Slider navigation
  const goTo = useCallback(
    (idx: number) => {
      const total = cake.images.length;
      const next = ((idx % total) + total) % total;
      setSliderIndex(next);
      if (trackRef.current) {
        gsap.to(trackRef.current, {
          xPercent: -next * 100,
          duration: 0.5,
          ease: "power2.inOut",
        });
      }
    },
    [cake.images.length],
  );

  // Touch/swipe support
  const touchStartX = useRef(0);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".preview-arrow") || target.closest(".preview-dot"))
      return;
    onOpenLightbox(cake);
  };

  return (
    <div ref={cardRef} className="card-container" onClick={handleCardClick}>
      {/* Main card image */}
      <div className="card-img">
        <img src={cake.src} alt={cake.alt} loading="lazy" draggable={false} />
      </div>

      {/* SVG strokes */}
      <div className="svg-stroke svg-stroke-1">
        <svg width="2453" height="2273" viewBox="0 0 2453 2273" fill="none">
          <path
            d={SVG_PATH_1}
            stroke={color}
            strokeWidth="200"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="svg-stroke svg-stroke-2">
        <svg width="2250" height="2535" viewBox="0 0 2250 2535" fill="none">
          <path
            d={SVG_PATH_2}
            stroke="#e8ddd4"
            strokeWidth="200"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Hover preview */}
      <div ref={previewRef} className="card-preview">
        {/* Preview image area */}
        <div
          className={`preview-img${hasSlider ? " preview-slider" : ""}`}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40)
              goTo(diff > 0 ? sliderIndex + 1 : sliderIndex - 1);
          }}
        >
          {hasSlider ? (
            <>
              <div ref={trackRef} className="preview-track">
                {cake.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={cake.alt}
                    loading="lazy"
                    draggable={false}
                  />
                ))}
              </div>
              <div className="preview-dots">
                {cake.images.map((_, i) => (
                  <button
                    key={i}
                    className={`preview-dot${i === sliderIndex ? " active" : ""}`}
                    aria-label={`Image ${i + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo(i);
                    }}
                  />
                ))}
              </div>
              <button
                className="preview-arrow preview-prev"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(sliderIndex - 1);
                }}
              >
                ‹
              </button>
              <button
                className="preview-arrow preview-next"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(sliderIndex + 1);
                }}
              >
                ›
              </button>
            </>
          ) : (
            <img
              src={cake.src}
              alt={cake.alt}
              loading="lazy"
              draggable={false}
            />
          )}
        </div>

        {/* Preview info text */}
        <div className="preview-info">
          <span className="card-tag">
            {cake.images.length > 1
              ? `${cake.images.length} Photos`
              : "Creation"}
          </span>
          <h3>{cake.title}</h3>
          {cake.description && <p className="card-desc">{cake.description}</p>}
        </div>
      </div>
    </div>
  );
}
