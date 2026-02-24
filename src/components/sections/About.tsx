import { cloudinaryUrl } from "@/lib/cloudinaryUrl";

export default function About() {
  return (
    <section
      id="about"
      className="w-full py-20 md:py-32 bg-white dark:bg-zinc-900/50 relative overflow-hidden"
    >
      {/* Bakery Doodles for About Section */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-[1]">
        {/* Doodle: Mixing bowl with spoon */}
        <svg
          className="bakery-doodle absolute top-[8%] right-[5%] w-[80px] md:w-[130px]"
          viewBox="0 0 100 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 40 C15 60 30 78 50 78 C70 78 85 60 85 40 L85 38 L15 38 Z M15 38 C15 35 18 32 22 32 L78 32 C82 32 85 35 85 38 M75 30 L90 8 M88 10 L92 6"
            stroke="#D97762"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Doodle: Layered cake */}
        <svg
          className="bakery-doodle absolute bottom-[10%] left-[3%] w-[75px] md:w-[120px] hidden md:block"
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 110 L80 110 L80 85 L20 85 Z M15 85 L85 85 L85 60 L15 60 Z M25 60 L75 60 L75 40 L25 40 Z M35 40 C35 30 42 25 50 25 C58 25 65 30 65 40 M50 25 L50 15 M45 15 C45 8 50 4 50 4 C50 4 55 8 55 15 C55 18 53 20 50 20 C47 20 45 18 45 15 Z M20 97 C25 93 30 95 35 93 C40 95 45 93 50 95 C55 93 60 95 65 93 C70 95 75 93 80 97 M15 72 C20 68 25 70 30 68 C35 70 40 68 45 70 C50 68 55 70 60 68 C65 70 70 68 75 70 C80 68 85 72 85 72"
            stroke="#D97762"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Doodle: Scattered hearts */}
        <svg
          className="bakery-doodle absolute top-[50%] left-[8%] w-[50px] md:w-[70px]"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M25 45 C25 45 5 30 5 18 C5 10 12 5 20 8 C23 9 25 12 25 12 C25 12 27 9 30 8 C38 5 45 10 45 18 C45 30 25 45 25 45 Z"
            stroke="#D97762"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div className="reveal-section order-2 md:order-1">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-4">
            Our Story
          </p>
          <h3 className="font-display text-3xl md:text-5xl leading-tight text-black dark:text-white mb-6">
            From a small kitchen, <br />
            <span className="italic font-light text-primary">
              with big love
            </span>
          </h3>
          <p className="font-body text-text-light/70 dark:text-text-dark/70 leading-relaxed mb-6">
            What started as a passion for baking in a home kitchen has grown
            into something truly special. Every loaf of bread, every layer of
            cake, every cookie that comes out of our oven carries the warmth of
            a home and the precision of a craft honed over years.
          </p>
          <p className="font-body text-text-light/70 dark:text-text-dark/70 leading-relaxed">
            Divya believes that the best baked goods come from the best
            ingredients — organic flour, farm-fresh eggs, real butter, and most
            importantly, patience. No shortcuts, no preservatives. Just honest,
            heavenly baking delivered to your doorstep.
          </p>
        </div>

        <div className="reveal-section order-1 md:order-2">
          <div className="relative">
            <img
              src={cloudinaryUrl("/Cake%20images/p35/heavenlybakes.by.divya_1644635390_2771725002020842980_5465995859.jpg")}
              alt="Elegant Black Forest cake with buttercream piped flowers"
              className="w-full h-auto rounded-2xl shadow-xl object-cover"
              loading="lazy"
            />
            <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-primary text-white px-5 py-3 rounded-xl font-display italic text-sm md:text-base shadow-lg">
              Baking since 2019
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
