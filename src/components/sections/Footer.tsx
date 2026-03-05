import { useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

const QUICK_LINKS = [
  { label: "Menu", href: "#menu" },
  { label: "Custom Orders", href: "#custom" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Track Order", to: "/track" },
  { label: "Book a Cake", href: "#book" },
];

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".footer-col", {
        scrollTrigger: {
          trigger: ".footer-col",
          start: "top 90%",
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} id="contact" className="bg-zinc-900 text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand Info */}
          <div className="footer-col">
            <h2 className="font-display text-2xl md:text-3xl text-primary mb-4">
              Heavenly Bakes
            </h2>
            <p className="font-body text-sm md:text-base text-white/50 leading-relaxed max-w-sm">
              Handcrafted with love by Divya. Every crumb tells a story of
              passion, patience, and the finest ingredients — baked fresh for
              you.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h3 className="font-display text-lg mb-4 text-white/80">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link
                      to={link.to}
                      className="font-body text-sm text-white/50 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="font-body text-sm text-white/50 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Get in Touch */}
          <div className="footer-col">
            <h3 className="font-display text-lg mb-4 text-white/80">
              Get in Touch
            </h3>
            <p className="font-body text-sm text-white/50 leading-relaxed mb-4">
              Have a question or want to place an order? Reach out on Instagram
              — we'd love to hear from you.
            </p>
            <a
              href="https://www.instagram.com/heavenlybakes.by.divya/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-body text-sm text-primary hover:text-primary-dark transition-colors"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              @heavenlybakes.by.divya
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-white/30">
            &copy; {new Date().getFullYear()} Heavenly Bakes by Divya. All
            rights reserved.
          </p>
          <p className="font-body text-xs text-white/20 italic">
            Baked with love, delivered with joy.
          </p>
          <Link
            to="/admin"
            className="font-body text-xs text-white/20 hover:text-white/40 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
