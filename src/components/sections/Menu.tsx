import {
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useCakeData } from "@/hooks/useCakeData";
import { cloudinaryTransformUrl } from "@/lib/cloudinaryUrl";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum images shown (no load more) */
const MAX_DISPLAY = 8;

/** Curated keyword chips shown below the search bar */
const FEATURED_KEYWORDS = [
  "Wedding",
  "Car Theme",
  "Floral",
  "Birthday",
  "Forest",
  "Gold",
  "Princess",
  "Fondant",
  "Chocolate",
  "Pastel",
];

/** Optimised thumbnail – 600px wide, auto format & quality */
function thumbUrl(fullUrl: string) {
  return cloudinaryTransformUrl(fullUrl, "w_600,q_auto,f_auto");
}

/** Full-size lightbox image – 1400px wide */
function lightboxUrl(fullUrl: string) {
  return cloudinaryTransformUrl(fullUrl, "w_1400,q_auto,f_auto");
}

/** Seed-based Fisher–Yates shuffle so random order is stable per session */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Stable seed per browser session so layout doesn't jump on re-render
const SESSION_SEED = Math.floor(Math.random() * 1e6);

// ─── Sub-components ───────────────────────────────────────────────────────────

interface LightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

function Lightbox({ src, alt, onClose }: LightboxProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors cursor-pointer"
        aria-label="Close"
      >
        <span className="material-icons text-3xl">close</span>
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[70vh] max-w-[min(500px,85vw)] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Menu() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { cakes, loading } = useCakeData();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(
    null,
  );

  // After cakes load, refresh ScrollTrigger so ScatterGallery pin position
  // recalculates correctly (Menu's lazy images change page height after mount).
  useEffect(() => {
    if (!loading && cakes.length > 0) {
      // Small delay lets images render and layout settle first
      const t = setTimeout(() => ScrollTrigger.refresh(), 400);
      return () => clearTimeout(t);
    }
  }, [loading, cakes.length]);

  // ── Debounce 300 ms ─────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch(search.trim().toLowerCase()),
      300,
    );
    return () => clearTimeout(t);
  }, [search]);

  // ── Keyword chip click → set search ────────────────────────────────────
  const handleChip = useCallback((kw: string) => {
    const lower = kw.toLowerCase();
    setSearch((prev) => (prev.toLowerCase() === lower ? "" : kw));
  }, []);

  // ── Randomly shuffled cakes (stable per session) ─────────────────────
  const shuffledCakes = useMemo(
    () => seededShuffle(cakes, SESSION_SEED),
    [cakes],
  );

  // ── Filter against search query ─────────────────────────────────────────
  const filteredCakes = useMemo(() => {
    if (!debouncedSearch) return shuffledCakes;
    const q = debouncedSearch;
    return shuffledCakes.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [shuffledCakes, debouncedSearch]);

  const displayedCakes = filteredCakes.slice(0, MAX_DISPLAY);
  const isFiltered = !!debouncedSearch;

  // ── GSAP section reveal ─────────────────────────────────────────────────
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".menu-hero-search", {
        scrollTrigger: { trigger: ".menu-hero-search", start: "top 88%" },
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
      });
      gsap.from(".menu-chips", {
        scrollTrigger: { trigger: ".menu-chips", start: "top 90%" },
        y: 20,
        opacity: 0,
        duration: 0.7,
        delay: 0.15,
        ease: "power2.out",
      });
      gsap.from(".menu-cta-wrap", {
        scrollTrigger: { trigger: ".menu-cta-wrap", start: "top 92%" },
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // ── Animate cards on change ─────────────────────────────────────────────
  useEffect(() => {
    if (!gridRef.current || displayedCakes.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".menu-cake-card",
        { y: 28, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.45,
          stagger: 0.05,
          ease: "power3.out",
        },
      );
    }, gridRef);
    return () => ctx.revert();
  }, [displayedCakes]);

  return (
    <section
      ref={sectionRef}
      id="menu"
      className="relative isolate overflow-hidden py-16 md:py-24 bg-white dark:bg-zinc-950"
    >
      {/* Subtle bakery doodles — desktop only */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden sm:block">
        <svg
          className="absolute top-[4%] left-[2%] w-[90px] opacity-[0.07]"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M50 10 C72 10 90 28 90 50 C90 72 72 90 50 90 C28 90 10 72 10 50 C10 28 28 10 50 10 Z M50 32 C40 32 32 40 32 50 C32 60 40 68 50 68 C60 68 68 60 68 50 C68 40 60 32 50 32 Z"
            stroke="#D97762"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          className="absolute bottom-[6%] right-[3%] w-[100px] opacity-[0.07]"
          viewBox="0 0 100 120"
          fill="none"
        >
          <path
            d="M20 100 L80 100 L80 70 C80 65 75 60 70 60 L30 60 C25 60 20 65 20 70 Z M25 60 L25 50 C25 45 30 40 35 40 L65 40 C70 40 75 45 75 50 L75 60 M50 40 L50 25 M50 25 C50 20 52 15 50 13 C48 9 50 5 52 5 C54 5 53 10 55 13 M20 100 L80 100 L82 110 L18 110 Z"
            stroke="#D97762"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 lg:px-12">
        {/* ── Section label ─────────────────────────────────────────────── */}
        <p className="text-center font-body text-primary/60 text-xs md:text-sm tracking-[0.3em] uppercase mb-3">
          Browse Our Creations
        </p>

        {/* ── Hero Search ─────────────────────────────────────────────────── */}
        <div className="menu-hero-search max-w-2xl mx-auto mb-6 md:mb-8">
          <h2 className="font-display text-3xl md:text-5xl text-primary text-center leading-tight mb-6">
            Find Your{" "}
            <span className="italic font-light text-black dark:text-white">
              perfect cake
            </span>
          </h2>

          {/* Search input */}
          <div className="relative">
            <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 text-xl select-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try &ldquo;wedding&rdquo;, &ldquo;car theme&rdquo;, &ldquo;gold&rdquo;…"
              className="w-full pl-12 pr-12 py-4 md:py-5 rounded-2xl border-2 border-primary/20 bg-white dark:bg-zinc-800 font-body text-base md:text-lg text-primary placeholder:text-primary/35 focus:outline-none focus:border-primary/60 shadow-lg shadow-primary/5 transition-all duration-200"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <span className="material-icons text-xl">close</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Keyword Chips ───────────────────────────────────────────────── */}
        <div className="menu-chips flex flex-wrap justify-center gap-2 md:gap-2.5 mb-10 md:mb-14">
          {FEATURED_KEYWORDS.map((kw) => {
            const active = search.toLowerCase() === kw.toLowerCase();
            return (
              <button
                key={kw}
                onClick={() => handleChip(kw)}
                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm md:text-base font-body capitalize transition-all duration-200 cursor-pointer border ${
                  active
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105"
                    : "bg-white dark:bg-zinc-800 text-primary/70 border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {kw}
              </button>
            );
          })}
        </div>

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* ── No Results ──────────────────────────────────────────────────── */}
        {!loading && filteredCakes.length === 0 && (
          <div className="text-center py-20">
            <span className="material-icons text-5xl text-primary/20 mb-4 block">
              search_off
            </span>
            <p className="font-body text-primary/50 text-base">
              No cakes match{" "}
              <span className="font-semibold text-primary/70">
                "{debouncedSearch}"
              </span>
              .
              <br />
              Try a different keyword or clear the search.
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-4 px-6 py-2 rounded-full border border-primary/30 text-primary text-sm font-body hover:bg-primary/5 transition-colors cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}

        {/* ── Image Grid ──────────────────────────────────────────────────── */}
        {!loading && displayedCakes.length > 0 && (
          <>
            {/* Results count when filtered */}
            {isFiltered && (
              <p className="text-center font-body text-xs text-primary/40 mb-5">
                {filteredCakes.length}{" "}
                {filteredCakes.length === 1 ? "result" : "results"} for &ldquo;
                {debouncedSearch}&rdquo;
              </p>
            )}

            <div
              ref={gridRef}
              className="columns-2 sm:columns-3 lg:columns-4 gap-3 md:gap-4 [column-fill:balance]"
            >
              {displayedCakes.map((cake) => (
                <div
                  key={cake.id}
                  className="menu-cake-card break-inside-avoid mb-3 md:mb-4 group cursor-pointer"
                  onClick={() =>
                    setLightbox({ src: lightboxUrl(cake.src), alt: cake.alt })
                  }
                >
                  <div className="relative overflow-hidden rounded-xl">
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                    <img
                      src={thumbUrl(cake.src)}
                      alt={cake.alt}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Expand icon on hover */}
                    <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <span className="material-icons text-white text-2xl">
                          zoom_in
                        </span>
                      </div>
                    </div>

                    {/* Tags pill at bottom on hover */}
                    {cake.tags && cake.tags.length > 0 && (
                      <div className="absolute bottom-2 left-2 right-2 z-20 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {cake.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-white/90 rounded-full text-[10px] font-body text-primary/80 capitalize"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Portfolio CTA ───────────────────────────────────────────────── */}
        {!loading && (
          <div className="menu-cta-wrap text-center mt-12 md:mt-20">
            <Link to="/portfolio">
              <button className="hidden sm:inline-flex relative px-10 py-4 font-display italic text-primary border-2 border-primary rounded-full overflow-hidden group cursor-pointer transition-colors hover:text-white">
                <span className="absolute inset-0 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <span className="relative z-10 inline-flex items-center gap-2">
                  <span className="material-icons text-lg">collections</span>
                  View All Creations
                </span>
              </button>
              <button className="sm:hidden w-full py-3.5 bg-primary text-white font-display text-sm rounded-full inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] transition-transform">
                <span className="material-icons text-base">collections</span>
                View All Creations
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}
