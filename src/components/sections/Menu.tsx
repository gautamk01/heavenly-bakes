import { useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { cloudinaryUrl } from "@/lib/cloudinaryUrl";

const MENU_ITEMS = [
  {
    title: "Signature Cakes",
    description: "Layered perfection with buttercream, ganache, and seasonal flavours baked fresh for every occasion.",
    image: cloudinaryUrl("/Cake%20images/p17/heavenlybakes.by.divya_1676042147_3035183977905671948_5465995859.jpg"),
    alt: "Signature cake with elegant decoration",
  },
  {
    title: "Cookies & Macarons",
    description: "Crisp on the outside, chewy within. Our cookies and French macarons come in rotating seasonal flavours.",
    image: cloudinaryUrl("/Cake%20images/p15/heavenlybakes.by.divya_1677317331_3045880994187926698_5465995859.jpg"),
    alt: "Assorted cookies and macarons",
  },
  {
    title: "Artisan Bread",
    description: "Slow-fermented sourdough and rustic loaves made with organic flour and old-world techniques.",
    image: cloudinaryUrl("/Cake%20images/p100/heavenlybakes.by.divya_1594823711_2353874355811088797_5465995859.jpg"),
    alt: "Freshly baked artisan bread",
  },
  {
    title: "Pastries",
    description: "Flaky croissants, Danish twists, and buttery puff pastry treats — baked golden every morning.",
    image: cloudinaryUrl("/Cake%20images/p53/heavenlybakes.by.divya_1628314420_2634814783928814669_5465995859.jpg"),
    alt: "Assorted freshly baked pastries",
  },
  {
    title: "Custom Celebration Cakes",
    description: "From birthdays to weddings — tell us your vision and we'll sculpt it in sponge, cream, and fondant.",
    image: cloudinaryUrl("/Cake%20images/p27/heavenlybakes.by.divya_1653890429_2849361901436936913_5465995859.jpg"),
    alt: "Custom multi-tiered celebration cake",
    wide: true,
  },
];

export default function Menu() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Menu cards stagger in
      gsap.from(".menu-item", {
        scrollTrigger: {
          trigger: ".menu-item",
          start: "top 85%",
        },
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power3.out",
      });

      // Underline grows
      gsap.from(".menu-line", {
        scrollTrigger: {
          trigger: ".menu-line",
          start: "top 90%",
        },
        scaleX: 0,
        duration: 0.8,
        ease: "power2.out",
      });

      // CTA button slides up
      gsap.from(".menu-cta-wrap", {
        scrollTrigger: {
          trigger: ".menu-cta-wrap",
          start: "top 90%",
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="menu" className="relative overflow-hidden py-20 md:py-28 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
      {/* Background gradient */}
      <div className="menu-bg-gradient absolute inset-0 opacity-30" />

      {/* Bakery doodle SVGs */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-[1] overflow-hidden">
        {/* Donut - top-left */}
        <svg className="absolute top-[5%] left-[3%] w-[70px] md:w-[110px] opacity-20" viewBox="0 0 100 100" fill="none">
          <path
            d="M50 10 C72 10 90 28 90 50 C90 72 72 90 50 90 C28 90 10 72 10 50 C10 28 28 10 50 10 Z M50 32 C40 32 32 40 32 50 C32 60 40 68 50 68 C60 68 68 60 68 50 C68 40 60 32 50 32 Z"
            stroke="#D97762"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 38 C24 34 27 31 30 28 M70 28 C73 31 76 35 78 38 M78 62 C76 66 73 69 70 72 M30 72 C27 69 24 66 22 62"
            stroke="#D97762"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>

        {/* Birthday cake - bottom-right */}
        <svg className="absolute bottom-[5%] right-[3%] w-[80px] md:w-[120px] opacity-20" viewBox="0 0 100 120" fill="none">
          <path
            d="M20 100 L80 100 L80 70 C80 65 75 60 70 60 L30 60 C25 60 20 65 20 70 Z M25 60 L25 50 C25 45 30 40 35 40 L65 40 C70 40 75 45 75 50 L75 60 M35 40 L35 30 M50 40 L50 25 M65 40 L65 30 M35 30 C35 25 37 20 35 18 C33 14 35 10 37 10 C39 10 38 15 40 18 M50 25 C50 20 52 15 50 13 C48 9 50 5 52 5 C54 5 53 10 55 13 M65 30 C65 25 67 20 65 18 C63 14 65 10 67 10 C69 10 68 15 70 18 M20 100 L80 100 L82 110 L18 110 Z"
            stroke="#D97762"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Candy cane - top-right */}
        <svg className="absolute top-[8%] right-[5%] w-[40px] md:w-[65px] opacity-20 rotate-[15deg]" viewBox="0 0 40 100" fill="none">
          <path
            d="M28 15 C28 8 24 3 18 3 C12 3 8 8 8 15 L8 90 M28 15 L28 90 M12 25 L24 30 M12 40 L24 45 M12 55 L24 60 M12 70 L24 75"
            stroke="#D97762"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Cherry - bottom-left */}
        <svg className="absolute bottom-[8%] left-[5%] w-[50px] md:w-[80px] opacity-20" viewBox="0 0 80 80" fill="none">
          <path
            d="M30 50 C30 40 22 32 15 35 C8 38 5 48 10 55 C15 62 28 62 30 50 Z M50 50 C50 40 58 32 65 35 C72 38 75 48 70 55 C65 62 52 62 50 50 Z M30 45 C30 30 35 15 40 10 M50 45 C50 30 45 15 40 10 M40 10 C42 8 48 5 52 8 M40 10 C38 8 32 5 28 8"
            stroke="#D97762"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Menu Header */}
      <div className="reveal-section relative z-10 text-center mb-14 md:mb-20">
        <p className="font-body text-primary/70 text-sm md:text-base tracking-widest uppercase mb-3">What We Bake</p>
        <h2 className="font-display text-3xl md:text-5xl lg:text-6xl text-primary leading-tight">
          <span className="menu-title-text">Our Menu</span>
        </h2>
        <div className="menu-line w-16 h-[2px] bg-primary/40 mx-auto mt-4" />
      </div>

      {/* Menu Grid */}
      <div className="reveal-section relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {MENU_ITEMS.map((item, index) => (
          <div
            key={item.title}
            className={`group menu-item cursor-pointer relative${item.wide ? " sm:col-span-2 lg:col-span-2" : ""}`}
            data-menu-index={index}
          >
            <div className={`menu-img-wrap relative overflow-hidden rounded-xl ${item.wide ? "h-64 md:h-80" : "h-48 md:h-64"}`}>
              <div className="menu-img-overlay absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 z-10" />
              <img
                src={item.image}
                alt={item.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="menu-text mt-4">
              <h3 className="font-display text-lg md:text-xl text-primary mb-1">{item.title}</h3>
              <p className="font-body text-sm md:text-base text-text-light/70 dark:text-text-dark/70 leading-relaxed mb-2">
                {item.description}
              </p>
              <p className="font-body text-xs md:text-sm text-primary/60 italic">
                DM for pricing <span className="inline-block group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio CTA */}
      <div className="menu-cta-wrap reveal-section relative z-10 text-center mt-14 md:mt-20">
        <Link to="/portfolio">
          <button className="menu-cta relative px-10 py-4 font-display italic text-primary border-2 border-primary rounded-full overflow-hidden group cursor-pointer transition-colors hover:text-white">
            <span className="absolute inset-0 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            <span className="relative z-10 inline-flex items-center gap-2">
              <span className="material-icons text-lg">collections</span>
              View Full Portfolio
            </span>
          </button>
        </Link>
      </div>
    </section>
  );
}
