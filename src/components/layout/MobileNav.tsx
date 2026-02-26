import { useEffect, useRef } from "react";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNav({ open, onClose }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "#about", label: "About" },
    { href: "#menu", label: "Menu" },
    { href: "#gallery", label: "Gallery" },
    { href: "#custom", label: "Custom Orders" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        open
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`absolute top-0 right-0 w-72 h-full bg-white dark:bg-zinc-900 shadow-2xl p-8 flex flex-col gap-6 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          className="self-end p-2 cursor-pointer"
          aria-label="Close Menu"
          onClick={onClose}
        >
          <span className="material-icons text-2xl">close</span>
        </button>

        {links.map((link) => (
          <a
            key={link.href}
            className="text-lg uppercase tracking-widest font-medium hover:text-primary transition-colors"
            href={link.href}
            onClick={onClose}
          >
            {link.label}
          </a>
        ))}

        <hr className="border-black/10 dark:border-white/10" />

        <a
          className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
          href="https://www.instagram.com/heavenlybakes.by.divya/"
          target="_blank"
          rel="noopener"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          Instagram
        </a>
      </div>
    </div>
  );
}
