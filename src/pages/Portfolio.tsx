import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCakeData } from "@/hooks/useCakeData";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import PortfolioCard from "@/components/portfolio/PortfolioCard";
import Lightbox from "@/components/portfolio/Lightbox";
import type { CakeData } from "@/types/cake";

const BATCH_SIZE = 18;

export default function Portfolio() {
  const { cakes, loading } = useCakeData();
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedCakes, setDisplayedCakes] = useState<CakeData[]>([]);
  const [lightboxCake, setLightboxCake] = useState<CakeData | null>(null);
  const [hintVisible, setHintVisible] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  const filters = [
    { key: "all", label: "All" },
    { key: "multi", label: "Multi-Photo" },
    { key: "single", label: "Single Photo" },
  ];

  const getFilteredData = useCallback(() => {
    if (activeFilter === "all") return cakes;
    if (activeFilter === "multi")
      return cakes.filter((c) => c.images.length > 1);
    return cakes.filter((c) => c.images.length === 1);
  }, [cakes, activeFilter]);

  useEffect(() => {
    if (cakes.length === 0) return;
    const filtered = getFilteredData();
    const batch = filtered.slice(0, BATCH_SIZE);
    setDisplayedCakes(batch);
    setCurrentIndex(batch.length);
  }, [cakes, activeFilter, getFilteredData]);

  const loadMore = () => {
    const filtered = getFilteredData();
    const nextBatch = filtered.slice(currentIndex, currentIndex + BATCH_SIZE);
    setDisplayedCakes((prev) => [...prev, ...nextBatch]);
    setCurrentIndex((prev) => prev + nextBatch.length);
  };

  // Entrance animation
  useEffect(() => {
    if (!gridRef.current || displayedCakes.length === 0) return;

    const ctx = gsap.context(() => {
      const cards = gridRef.current!.querySelectorAll(".card-container");
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 60, opacity: 0, scale: 0.96 },
          {
            scrollTrigger: {
              trigger: card,
              start: "top 92%",
              toggleActions: "play none none none",
            },
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            delay: (i % 3) * 0.08,
            ease: "power3.out",
          },
        );
      });
    }, gridRef);

    return () => ctx.revert();
  }, [displayedCakes]);

  const handleGridMouseEnter = () => {
    if (hintVisible) setHintVisible(false);
  };

  const filtered = getFilteredData();
  const hasMore = currentIndex < filtered.length;

  return (
    <div className="portfolio-page">
      {/* Portfolio-specific Nav (matches p5 reference) */}
      <nav>
        <Link to="/" className="nav-logo">
          Heavenly Bakes <span className="nav-logo-sub">by divya</span>
        </Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <a href="/#menu">Menu</a>
          <a href="/#gallery">Gallery</a>
          <a href="/#contact">Contact</a>
        </div>
      </nav>

      {/* Header */}
      <header className="portfolio-header">
        <span className="header-tag">Portfolio</span>
        <h1>Our Creations</h1>
        <p>
          Each piece is handcrafted with love, precision, and a touch of magic
        </p>
      </header>

      {/* Filter Bar */}
      <div className="filter-bar">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`filter-btn${activeFilter === f.key ? " active" : ""}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Hover Hint */}
      {hintVisible && (
        <div className="hover-hint">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6.8 12.2l5.2 5.1 5.2-5.1M12 3v14.3" />
            <path d="M6 19.8h12" opacity="0.4" />
          </svg>
          <span>Hover over images to discover each creation</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            color: "#8a7a6e",
          }}
        >
          Loading creations...
        </div>
      )}

      {/* Portfolio Grid */}
      <section
        ref={gridRef}
        className="portfolio-grid"
        id="portfolio-grid"
        onMouseEnter={handleGridMouseEnter}
      >
        {displayedCakes.map((cake, i) => (
          <PortfolioCard
            key={`${cake.id}-${activeFilter}`}
            cake={cake}
            index={i}
            onOpenLightbox={setLightboxCake}
          />
        ))}
      </section>

      {/* Load More */}
      {hasMore && !loading && (
        <div className="load-more-wrap">
          <button className="load-more-btn" onClick={loadMore}>
            Load More Creations
          </button>
          <p className="load-count">
            Showing {currentIndex} of {filtered.length}
          </p>
        </div>
      )}

      {/* Lightbox */}
      <Lightbox cake={lightboxCake} onClose={() => setLightboxCake(null)} />

      {/* Portfolio-specific Footer (matches p5 reference) */}
      <footer>
        <div className="footer-content">
          <h1>Heavenly Bakes</h1>
          <p className="footer-tagline">by divya</p>
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
