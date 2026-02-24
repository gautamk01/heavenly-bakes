import { useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { cloudinaryUrl } from "@/lib/cloudinaryUrl";

export default function WhyUs() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Intro text slides in from left
      gsap.from(".whyus-intro", {
        scrollTrigger: {
          trigger: ".whyus-intro",
          start: "top 85%",
        },
        x: -40,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
      });

      // Pillar circles pop in with bounce
      gsap.from(".whyus-pillar", {
        scrollTrigger: {
          trigger: ".whyus-pillar",
          start: "top 85%",
        },
        scale: 0,
        opacity: 0,
        duration: 0.5,
        stagger: 0.18,
        ease: "back.out(1.5)",
      });

      // Feature image scales in
      gsap.from(".whyus-image", {
        scrollTrigger: {
          trigger: ".whyus-image",
          start: "top 80%",
        },
        scale: 0.9,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
      });

      // "Why Choose Us" heading fades up
      gsap.from(".whyus-heading", {
        scrollTrigger: {
          trigger: ".whyus-heading",
          start: "top 85%",
        },
        y: 25,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });

      // Stats cards stagger in
      gsap.from(".stat-card", {
        scrollTrigger: {
          trigger: ".stat-card",
          start: "top 85%",
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="w-full py-20 md:py-32 bg-background-light dark:bg-background-dark overflow-hidden relative">
      {/* Bakery Doodles for Why Section */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-[0]">
        {/* Doodle: Candy / Lollipop - top right */}
        <svg
          className="bakery-doodle absolute top-[5%] right-[4%] w-[80px] md:w-[130px]"
          viewBox="0 0 60 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M30 55 L30 115 M30 55 C30 55 8 50 8 28 C8 10 18 2 30 2 C42 2 52 10 52 28 C52 50 30 55 30 55 Z M15 20 C20 12 25 18 30 12 C35 18 40 12 45 20 M12 32 C18 26 24 32 30 26 C36 32 42 26 48 32 M15 42 C20 36 25 42 30 36 C35 42 40 36 45 42"
            stroke="#D97762"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Doodle: Pie - bottom left */}
        <svg
          className="bakery-doodle absolute bottom-[8%] left-[3%] w-[80px] md:w-[130px] hidden md:block"
          viewBox="0 0 100 70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 50 C5 50 10 20 50 20 C90 20 95 50 95 50 Z M5 50 L95 50 M5 50 C5 55 10 60 15 60 L85 60 C90 60 95 55 95 50 M20 20 L30 50 M40 20 L45 50 M60 20 L55 50 M80 20 L70 50 M15 32 C25 28 35 30 45 28 C55 30 65 28 75 30 C80 31 85 33 88 36"
            stroke="#D97762"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Doodle: Star sprinkles */}
        <svg
          className="bakery-doodle absolute top-[60%] right-[6%] w-[75px] md:w-[115px] hidden md:block"
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M30 5 L33 22 L50 18 L37 28 L48 42 L32 34 L30 52 L28 34 L12 42 L23 28 L10 18 L27 22 Z"
            stroke="#D97762"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Doodle: Wheat stalk - mid left */}
        <svg
          className="bakery-doodle absolute top-[35%] left-[2%] w-[50px] md:w-[70px]"
          viewBox="0 0 40 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 110 L20 25 M20 25 L20 15 C20 10 22 8 22 8 M20 35 C12 30 8 22 12 18 M20 35 C28 30 32 22 28 18 M20 50 C12 45 8 37 12 33 M20 50 C28 45 32 37 28 33 M20 65 C12 60 8 52 12 48 M20 65 C28 60 32 52 28 48 M20 80 C12 75 8 67 12 63 M20 80 C28 75 32 67 28 63 M20 95 C14 90 10 82 14 78 M20 95 C26 90 30 82 26 78"
            stroke="#D97762"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Top Row: Intro text + Feature pillars */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-24 gap-12 lg:gap-16">
          {/* Left: Intro copy */}
          <div className="whyus-intro lg:w-1/3 space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium">
              Why Heavenly Bakes
            </p>
            <h3 className="font-display text-3xl lg:text-5xl font-bold text-black dark:text-white leading-tight">
              Baked Fresh, <br />
              <span className="italic font-light text-primary">Served with Love</span>
            </h3>
            <p className="text-text-light/70 dark:text-text-dark/70 leading-relaxed text-lg font-body">
              Every creation from Heavenly Bakes is handcrafted using the finest
              ingredients — no preservatives, no shortcuts. Just honest baking
              that melts in your mouth.
            </p>
            <a
              href="#custom"
              className="btn-oval px-8 py-3 text-base font-display italic text-primary border-primary hover:bg-primary hover:text-white inline-block cursor-pointer"
            >
              Order Now
            </a>
          </div>

          {/* Right: 3 Feature pillars with dashed wave connector */}
          <div className="lg:w-3/5 w-full relative">
            {/* Wrapper with enough height for the wave layout */}
            <div className="relative hidden md:block" style={{ height: 300 }}>
              {/* Dashed wave connecting the 3 pillar circles */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                viewBox="0 0 600 300"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M-10,80 C20,70 50,49 90,49 C170,49 200,124 300,124 C400,124 430,49 510,49 C550,49 580,70 610,80"
                  stroke="#D97762"
                  strokeWidth="2"
                  strokeDasharray="8,6"
                  opacity="0.4"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              {/* Pillar 1 (top-left) */}
              <div className="whyus-pillar absolute left-[8%] top-[5px] flex flex-col items-center max-w-[180px] text-center z-10">
                <div className="w-[88px] h-[88px] bg-primary rounded-full flex items-center justify-center text-white mb-4 shadow-xl ring-4 ring-background-light dark:ring-background-dark">
                  <span className="material-icons text-3xl">local_shipping</span>
                </div>
                <h4 className="font-display font-bold text-lg mb-1 text-black dark:text-white">
                  Personal Delivery
                </h4>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60 font-body">
                  Every cake delivered fresh to your doorstep, with care
                </p>
              </div>

              {/* Pillar 2 (center, gentle dip) */}
              <div className="whyus-pillar absolute left-1/2 -translate-x-1/2 top-[80px] flex flex-col items-center max-w-[180px] text-center z-10">
                <div className="w-[88px] h-[88px] bg-primary rounded-full flex items-center justify-center text-white mb-4 shadow-xl ring-4 ring-background-light dark:ring-background-dark">
                  <span className="material-icons text-3xl">eco</span>
                </div>
                <h4 className="font-display font-bold text-lg mb-1 text-black dark:text-white">
                  Fresh Ingredients
                </h4>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60 font-body">
                  100% natural. No preservatives, no artificial flavours
                </p>
              </div>

              {/* Pillar 3 (top-right) */}
              <div className="whyus-pillar absolute right-[8%] top-[5px] flex flex-col items-center max-w-[180px] text-center z-10">
                <div className="w-[88px] h-[88px] bg-primary rounded-full flex items-center justify-center text-white mb-4 shadow-xl ring-4 ring-background-light dark:ring-background-dark">
                  <span className="material-icons text-3xl">card_giftcard</span>
                </div>
                <h4 className="font-display font-bold text-lg mb-1 text-black dark:text-white">
                  Gift-Ready
                </h4>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60 font-body">
                  Beautifully packaged and ready to make someone smile
                </p>
              </div>
            </div>

            {/* Mobile fallback (stacked, no wave) */}
            <div className="flex flex-col items-center gap-10 text-center md:hidden">
              <div className="flex flex-col items-center max-w-[200px] reveal-section">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white mb-4 shadow-xl ring-4 ring-background-light dark:ring-background-dark">
                  <span className="material-icons text-3xl">local_shipping</span>
                </div>
                <h4 className="font-display font-bold text-lg mb-1 text-black dark:text-white">
                  Personal Delivery
                </h4>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60 font-body">
                  Every cake delivered fresh to your doorstep, with care
                </p>
              </div>
              <div className="flex flex-col items-center max-w-[200px] reveal-section">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white mb-4 shadow-xl ring-4 ring-background-light dark:ring-background-dark">
                  <span className="material-icons text-3xl">eco</span>
                </div>
                <h4 className="font-display font-bold text-lg mb-1 text-black dark:text-white">
                  Fresh Ingredients
                </h4>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60 font-body">
                  100% natural. No preservatives, no artificial flavours
                </p>
              </div>
              <div className="flex flex-col items-center max-w-[200px] reveal-section">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white mb-4 shadow-xl ring-4 ring-background-light dark:ring-background-dark">
                  <span className="material-icons text-3xl">card_giftcard</span>
                </div>
                <h4 className="font-display font-bold text-lg mb-1 text-black dark:text-white">
                  Gift-Ready
                </h4>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60 font-body">
                  Beautifully packaged and ready to make someone smile
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Image + Stats grid */}
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left: Feature image */}
          <div className="lg:w-1/2 w-full relative group reveal-section">
            {/* Background blur blobs */}
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/10 dark:bg-primary/5 rounded-full filter blur-3xl z-0"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-primary/10 dark:bg-primary/5 rounded-full filter blur-3xl z-0"></div>

            <img
              alt="Beautifully decorated celebration cake by Heavenly Bakes"
              className="whyus-image relative z-10 w-full h-auto object-cover rounded-2xl shadow-2xl transform transition-transform duration-500 group-hover:scale-[1.02]"
              src={cloudinaryUrl("/Cake%20images/p26/heavenlybakes.by.divya_1655043449_2859034135212055047_5465995859.jpg")}
              loading="lazy"
            />

            {/* Decorative leaf icons */}
            <div className="absolute top-4 left-12 text-primary/40 dark:text-primary/25 z-20">
              <span className="material-icons text-4xl transform rotate-45">eco</span>
            </div>
            <div className="absolute bottom-12 right-4 text-primary/40 dark:text-primary/25 z-20">
              <span className="material-icons text-3xl transform -rotate-12">spa</span>
            </div>
          </div>

          {/* Right: Why Choose Us + Stats */}
          <div className="lg:w-1/2 w-full">
            <div className="whyus-heading mb-10">
              <p className="font-display text-xl text-primary mb-2 font-bold italic">
                Why Choose Us
              </p>
              <h3 className="font-display text-3xl lg:text-5xl font-bold text-black dark:text-white mb-6 leading-tight">
                Heavenly Creations <br />
                For Every Occasion
              </h3>
              <p className="text-text-light/70 dark:text-text-dark/70 text-lg leading-relaxed font-body">
                From themed birthday cakes and elegant wedding centerpieces to
                everyday treats like cupcakes and brownies — every creation is
                made from scratch with premium ingredients and a whole lot of
                heart.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="stat-card bg-primary dark:bg-primary/90 p-7 rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl font-bold font-display mb-2">126+</div>
                <p className="text-white/85 text-sm mb-5 leading-snug font-body">
                  Unique cake designs: themed, tiered, and custom creations
                </p>
                <Link
                  className="inline-block border-b border-white/40 pb-0.5 hover:border-white text-sm font-medium transition-colors"
                  to="/portfolio"
                >
                  View Portfolio
                </Link>
              </div>
              <div className="stat-card bg-primary dark:bg-primary/90 p-7 rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl font-bold font-display mb-2">100%</div>
                <p className="text-white/85 text-sm mb-5 leading-snug font-body">
                  Natural ingredients. No preservatives or artificial colours
                </p>
                <a
                  className="inline-block border-b border-white/40 pb-0.5 hover:border-white text-sm font-medium transition-colors"
                  href="#about"
                >
                  Our Story
                </a>
              </div>
              <div className="stat-card bg-primary dark:bg-primary/90 p-7 rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl font-bold font-display mb-2">1500+</div>
                <p className="text-white/85 text-sm mb-5 leading-snug font-body">
                  Happy customers celebrating their special moments with us
                </p>
                <a
                  className="inline-block border-b border-white/40 pb-0.5 hover:border-white text-sm font-medium transition-colors"
                  href="#testimonials"
                >
                  Read Reviews
                </a>
              </div>
              <div className="stat-card bg-primary dark:bg-primary/90 p-7 rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl font-bold font-display mb-2">24h</div>
                <p className="text-white/85 text-sm mb-5 leading-snug font-body">
                  Freshness guaranteed. Every order baked within a day of
                  delivery
                </p>
                <a
                  className="inline-block border-b border-white/40 pb-0.5 hover:border-white text-sm font-medium transition-colors"
                  href="#custom"
                >
                  Order Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
