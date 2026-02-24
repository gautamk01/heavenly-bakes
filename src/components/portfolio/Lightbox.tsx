import { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import type { CakeData } from "@/types/cake";

interface LightboxProps {
  cake: CakeData | null;
  onClose: () => void;
}

export default function Lightbox({ cake, onClose }: LightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const touchStartX = useRef(0);

  const totalSlides = cake?.images.length ?? 0;

  // Slider navigation
  const goTo = useCallback(
    (index: number) => {
      if (totalSlides <= 1) return;
      const next = ((index % totalSlides) + totalSlides) % totalSlides;
      setCurrentSlide(next);
      if (trackRef.current) {
        gsap.to(trackRef.current, {
          xPercent: -next * 100,
          duration: 0.45,
          ease: "power2.inOut",
        });
      }
    },
    [totalSlides],
  );

  // Open animation
  useEffect(() => {
    if (!cake) return;
    setCurrentSlide(0);
    setIsOpen(true);

    const overlay = overlayRef.current;
    const backdrop = backdropRef.current;
    const content = contentRef.current;
    const closeBtn = closeBtnRef.current;
    const info = infoRef.current;

    if (!overlay || !backdrop || !content || !closeBtn || !info) return;

    document.body.style.overflow = "hidden";

    gsap.fromTo(
      backdrop,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out" },
    );
    gsap.fromTo(
      content,
      { scale: 0.92, y: 30, opacity: 0 },
      {
        scale: 1,
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "power3.out",
        delay: 0.1,
      },
    );
    gsap.fromTo(
      closeBtn,
      { opacity: 0, scale: 0.5 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: "back.out(1.7)",
        delay: 0.25,
      },
    );
    gsap.fromTo(
      info.children,
      { y: 15, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        stagger: 0.08,
        ease: "power2.out",
        delay: 0.35,
      },
    );

    // Reset slider track position
    if (trackRef.current) {
      gsap.set(trackRef.current, { xPercent: 0 });
    }
  }, [cake]);

  // Close animation
  const handleClose = useCallback(() => {
    const content = contentRef.current;
    const closeBtn = closeBtnRef.current;
    const backdrop = backdropRef.current;

    if (!content || !closeBtn || !backdrop) return;

    gsap.to(content, {
      scale: 0.92,
      y: 20,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
    });
    gsap.to(closeBtn, { opacity: 0, duration: 0.2 });
    gsap.to(backdrop, {
      opacity: 0,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        setIsOpen(false);
        document.body.style.overflow = "";
        onClose();
      },
    });
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") goTo(currentSlide - 1);
      if (e.key === "ArrowRight") goTo(currentSlide + 1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, currentSlide, handleClose, goTo]);

  if (!cake) return null;

  return (
    <div
      ref={overlayRef}
      className={`lightbox-overlay${isOpen ? " active" : ""}`}
    >
      <div
        ref={backdropRef}
        className="lightbox-backdrop"
        onClick={handleClose}
      />
      <button
        ref={closeBtnRef}
        className="lightbox-close"
        aria-label="Close lightbox"
        onClick={handleClose}
      >
        ✕
      </button>
      <div ref={contentRef} className="lightbox-content">
        {/* Image area */}
        <div
          className="lightbox-img-wrap"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40)
              goTo(diff > 0 ? currentSlide + 1 : currentSlide - 1);
          }}
        >
          {totalSlides > 1 ? (
            <>
              <div ref={trackRef} className="lightbox-slider-track">
                {cake.images.map((src, i) => (
                  <img key={i} src={src} alt={cake.alt} draggable={false} />
                ))}
              </div>
              <button
                className="lightbox-arrow lightbox-arrow-prev"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(currentSlide - 1);
                }}
              >
                ‹
              </button>
              <button
                className="lightbox-arrow lightbox-arrow-next"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(currentSlide + 1);
                }}
              >
                ›
              </button>
              <div className="lightbox-dots">
                {cake.images.map((_, i) => (
                  <button
                    key={i}
                    className={`lightbox-dot${i === currentSlide ? " active" : ""}`}
                    aria-label={`Image ${i + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo(i);
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <img src={cake.src} alt={cake.alt} draggable={false} />
          )}
        </div>

        {/* Info area */}
        <div ref={infoRef} className="lightbox-info">
          <span className="lightbox-tag">
            {totalSlides > 1 ? `${totalSlides} Photos` : "Creation"}
          </span>
          <h3 className="lightbox-title">{cake.title}</h3>
          {cake.description && (
            <p className="lightbox-desc">{cake.description}</p>
          )}
          {totalSlides > 1 && (
            <span className="lightbox-counter">
              {currentSlide + 1} / {totalSlides}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
