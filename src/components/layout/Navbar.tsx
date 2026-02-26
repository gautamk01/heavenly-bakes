import { useRef, useLayoutEffect, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useDarkMode } from "@/hooks/useDarkMode";
import MobileNav from "./MobileNav";

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toggle: toggleDark } = useDarkMode();

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const st = ScrollTrigger.create({
      start: "top -50",
      end: "max",
      onUpdate: (self) => {
        if (self.scroll() > 50) {
          nav.classList.add("nav-scrolled");
        } else {
          nav.classList.remove("nav-scrolled");
        }
      },
    });

    return () => st.kill();
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        id="main-nav"
        className="w-full px-4 md:px-8 py-4 md:py-6 flex justify-between items-center bg-transparent z-50 fixed top-0 left-0 text-black dark:text-white transition-colors duration-300"
      >
        {/* Desktop left links */}
        <div className="hidden md:flex gap-8 text-[0.8rem] uppercase tracking-widest font-semibold items-center">
          <a className="nav-link" href="#about">
            About
          </a>
          <a className="nav-link" href="#menu">
            Menu
          </a>
          <a className="nav-link" href="#gallery">
            Gallery
          </a>
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center leading-none -space-y-1 md:-space-y-2">
          <a
            href="#"
            style={{ fontFamily: "'Great Vibes', cursive" }}
            className="text-2xl md:text-4xl font-normal text-black dark:text-white whitespace-nowrap"
          >
            Heavenly Bakes
          </a>
          <span
            style={{ fontFamily: "'Great Vibes', cursive" }}
            className="text-sm md:text-base font-normal text-primary/70 dark:text-primary/60 self-end"
          >
            by divya
          </span>
        </div>

        {/* Right links + actions */}
        <div className="flex items-center gap-5 md:gap-6 text-[0.8rem] uppercase tracking-widest font-semibold">
          <a className="hidden md:block nav-link" href="#custom">
            Custom
          </a>
          <a
            className="hidden lg:flex bg-primary text-white px-6 py-2.5 rounded-full hover:bg-primary-dark transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer items-center justify-center"
            href="#contact"
          >
            Order Now
          </a>
          <a
            className="hidden md:flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
            href="https://www.instagram.com/heavenlybakes.by.divya/"
            target="_blank"
            rel="noopener"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
          <button
            aria-label="Toggle Dark Mode"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            onClick={toggleDark}
          >
            <span className="material-icons text-xl align-middle">
              brightness_4
            </span>
          </button>
          <button
            className="md:hidden p-2 cursor-pointer"
            aria-label="Open Menu"
            onClick={() => setMobileOpen(true)}
          >
            <span className="material-icons">menu</span>
          </button>
        </div>
      </nav>

      {/* Nav spacer */}
      <div className="h-16 md:h-20" />

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
