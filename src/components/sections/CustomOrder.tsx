import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { cloudinaryUrl } from "@/lib/cloudinaryUrl";

interface CustomOrderProps {
  onBookClick?: () => void;
}

const STEPS = [
  {
    icon: "chat",
    title: "Tell Us",
    description: "Share your vision — flavour, theme, size, and date. We'll listen to every detail.",
  },
  {
    icon: "palette",
    title: "We Design",
    description: "Our bakers craft a custom concept with sketches and tasting options just for you.",
  },
  {
    icon: "local_shipping",
    title: "We Deliver",
    description: "Freshly baked and delivered on time — ready to steal the show at your celebration.",
  },
];

export default function CustomOrder({ onBookClick }: CustomOrderProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Step icons scale in one by one
      gsap.from(".step-icon", {
        scrollTrigger: {
          trigger: ".step-icon",
          start: "top 85%",
        },
        scale: 0,
        opacity: 0,
        duration: 0.5,
        stagger: 0.2,
        ease: "back.out(1.5)",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="custom" className="relative bg-black text-white py-20 md:py-28 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage:
            `url('${cloudinaryUrl("/Cake%20images/p110/heavenlybakes.by.divya_1589970338_2313161313964287556_5465995859.jpg")}')`,
        }}
      />

      {/* Bakery doodle SVGs */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-[1] overflow-hidden">
        {/* Tiered wedding cake - left */}
        <svg className="absolute top-[10%] left-[3%] w-[80px] md:w-[120px] opacity-15" viewBox="0 0 100 140" fill="none">
          <path
            d="M35 130 L65 130 L65 110 L70 110 L70 85 L75 85 L75 55 L78 55 L78 35 C78 30 70 25 50 25 C30 25 22 30 22 35 L22 55 L25 55 L25 85 L30 85 L30 110 L35 110 Z M22 55 L78 55 M25 85 L75 85 M30 110 L70 110 M50 25 L50 15 M46 15 C46 10 48 5 50 5 C52 5 54 10 54 15 Z M35 70 L65 70 M38 98 L62 98"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Sparkle candles - right */}
        <svg className="absolute top-[15%] right-[4%] w-[60px] md:w-[90px] opacity-15" viewBox="0 0 80 100" fill="none">
          <path
            d="M20 40 L20 85 M15 85 L25 85 M20 40 L20 32 M16 32 C16 26 18 20 20 18 C22 20 24 26 24 32 Z M50 35 L50 85 M45 85 L55 85 M50 35 L50 27 M46 27 C46 21 48 15 50 13 C52 15 54 21 54 27 Z M10 20 L14 18 M10 20 L14 22 M10 20 L6 20 M60 15 L64 13 M60 15 L64 17 M60 15 L56 15 M68 30 L72 28 M68 30 L72 32 M35 12 L37 8 M35 12 L33 8 M35 12 L39 12 M35 12 L31 12"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Gift box - bottom-right */}
        <svg className="absolute bottom-[8%] right-[5%] w-[60px] md:w-[90px] opacity-15" viewBox="0 0 80 80" fill="none">
          <path
            d="M10 30 L70 30 L70 72 L10 72 Z M10 30 L70 30 L70 40 L10 40 Z M40 30 L40 72 M40 30 C40 30 35 20 28 20 C21 20 18 25 20 28 C22 31 30 30 40 30 M40 30 C40 30 45 20 52 20 C59 20 62 25 60 28 C58 31 50 30 40 30"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Header */}
        <div className="reveal-section text-center mb-14 md:mb-20">
          <p className="font-body text-white/50 text-sm md:text-base tracking-widest uppercase mb-3">Special Occasions</p>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl leading-tight mb-6">
            Dream it. <span className="italic font-light text-primary">We'll bake it.</span>
          </h2>
          <p className="font-body text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Whether it's a towering wedding centrepiece, a whimsical birthday creation, or an intimate anniversary treat — every custom cake begins with your story. Let us bring your sweetest ideas to life.
          </p>
        </div>

        {/* 3-step process */}
        <div className="reveal-section grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-14 md:mb-20">
          {STEPS.map((step, index) => (
            <div key={step.title} className="text-center">
              <div className="step-icon w-16 h-16 mx-auto mb-4 rounded-full border border-white/20 flex items-center justify-center">
                <span className="material-icons text-2xl text-primary">{step.icon}</span>
              </div>
              <p className="font-body text-xs text-white/40 uppercase tracking-widest mb-2">Step {index + 1}</p>
              <h3 className="font-display text-xl md:text-2xl mb-2">{step.title}</h3>
              <p className="font-body text-sm md:text-base text-white/50 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="reveal-section flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onBookClick}
            className="px-10 py-4 font-display italic bg-primary text-white rounded-full inline-flex items-center gap-2 cursor-pointer hover:bg-primary-dark transition-colors"
          >
            <span className="material-icons text-lg">cake</span>
            Book a Cake
          </button>
          <a
            href="https://www.instagram.com/heavenlybakes.by.divya/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-10 py-4 font-display italic border-2 border-white/30 text-white rounded-full inline-flex items-center gap-2 cursor-pointer hover:border-white/60 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            DM on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
