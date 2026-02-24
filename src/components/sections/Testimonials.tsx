import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

const TESTIMONIALS = [
  {
    initials: "PS",
    username: "priya.sharma",
    timeAgo: "2 weeks ago",
    gradient: "from-primary to-primary-dark",
    comment:
      "The chocolate cake was absolutely divine! Every bite was pure bliss. The ganache was so rich and smooth, and the layers were perfectly moist. Will definitely order again for every celebration! \ud83c\udf6b\u2728",
    likes: 142,
  },
  {
    initials: "RM",
    username: "rahul.meena",
    timeAgo: "1 month ago",
    gradient: "from-amber-400 to-orange-500",
    comment:
      "We ordered a custom 3-tier cake for our anniversary and it was a showstopper! The attention to detail was incredible, and it tasted even better than it looked. Thank you Heavenly Bakes!",
    likes: 203,
  },
  {
    initials: "AV",
    username: "ankit_verma",
    timeAgo: "3 days ago",
    gradient: "from-green-400 to-emerald-600",
    comment:
      "The sourdough bread is unreal! Perfectly crusty on the outside and soft on the inside. I\u2019ve tried bakeries all over the city and nothing compares. \ud83c\udf5e\ud83d\ude0d",
    likes: 89,
  },
  {
    initials: "NK",
    username: "neha.kapoor",
    timeAgo: "5 days ago",
    gradient: "from-pink-400 to-rose-500",
    comment:
      "Best macarons in town! The flavors are so unique and every single one is a work of art. My favorites are the rose pistachio and salted caramel. \ud83c\udf08",
    likes: 167,
  },
  {
    initials: "SM",
    username: "sanjay_malhotra",
    timeAgo: "1 week ago",
    gradient: "from-purple-400 to-indigo-600",
    comment:
      "Ordered croissants for a brunch party and they were gone in minutes! Flaky, buttery, and absolutely perfect. Everyone kept asking where I got them from.",
    likes: 124,
  },
  {
    initials: "TA",
    username: "tara.ahuja",
    timeAgo: "2 days ago",
    gradient: "from-cyan-400 to-blue-600",
    comment:
      "Red velvet cake for my wedding was absolutely stunning! The cream cheese frosting was perfectly balanced \u2014 not too sweet. Our guests are still raving about it!",
    likes: 256,
  },
  {
    initials: "VK",
    username: "vikram.kohli",
    timeAgo: "4 days ago",
    gradient: "from-yellow-400 to-amber-500",
    comment:
      "Butterscotch cake was a huge hit at my son\u2019s birthday! The caramel layers were heavenly and the presentation was top-notch. Kids and adults both loved it!",
    likes: 178,
  },
  {
    initials: "MS",
    username: "maya.singh",
    timeAgo: "6 days ago",
    gradient: "from-teal-400 to-cyan-600",
    comment:
      "The custom birthday cake design exceeded all expectations! From the initial consultation to the final delivery, the experience was seamless. Truly talented bakers!",
    likes: 195,
  },
];

function VerifiedBadge() {
  return (
    <svg
      className="w-4 h-4 text-blue-500 inline-block ml-1"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.707 8.707a1 1 0 00-1.414-1.414L10 14.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l6-6z"
      />
    </svg>
  );
}

function TestimonialCard({
  initials,
  username,
  timeAgo,
  gradient,
  comment,
  likes,
}: (typeof TESTIMONIALS)[number]) {
  return (
    <div className="testimonial-card flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mx-3 select-none">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              @{username}
            </span>
            <VerifiedBadge />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {timeAgo}
          </span>
        </div>
      </div>
      {/* Comment */}
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        {comment}
      </p>
      {/* Likes */}
      <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span>{likes}</span>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Header fades down into view
      gsap.from(".testimonials-header", {
        scrollTrigger: {
          trigger: ".testimonials-header",
          start: "top 85%",
        },
        y: -30,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Clone all children for seamless loop
    const children = Array.from(track.children);
    children.forEach((child) => {
      track.appendChild(child.cloneNode(true));
    });

    const totalWidth = track.scrollWidth / 2;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: -totalWidth,
        duration: totalWidth / 50, // speed
        ease: "none",
        repeat: -1,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="relative py-20 bg-white dark:bg-gray-900 overflow-hidden"
    >
      {/* Bakery Doodle SVGs */}
      {/* Cupcake with cherry - top left */}
      <svg
        className="absolute top-8 left-8 w-20 h-20 opacity-20"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#D97762"
        strokeWidth="2"
      >
        <path d="M50 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z" />
        <path d="M50 25v5" />
        <path d="M30 45c0-11 9-20 20-20s20 9 20 20" />
        <path d="M25 45h50l-5 40H30l-5-40z" />
        <path d="M30 55c5-5 10 5 15 0s10 5 15 0s10 5 15 0" />
      </svg>

      {/* Candle flame - right */}
      <svg
        className="absolute top-16 right-10 w-16 h-16 opacity-20"
        viewBox="0 0 60 100"
        fill="none"
        stroke="#D97762"
        strokeWidth="2"
      >
        <path d="M30 10c-5 8-10 15-5 20s15 0 10-10c-2-4-3-7-5-10z" />
        <rect x="27" y="30" width="6" height="50" rx="2" />
        <rect x="20" y="80" width="20" height="10" rx="3" />
      </svg>

      {/* Pretzel - bottom left */}
      <svg
        className="absolute bottom-12 left-10 w-20 h-20 opacity-20"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#D97762"
        strokeWidth="2"
      >
        <path d="M50 90c-5-10-25-20-25-40a25 25 0 0150 0c0 20-20 30-25 40z" />
        <circle cx="35" cy="45" r="12" />
        <circle cx="65" cy="45" r="12" />
        <path d="M42 38c5 10 11 10 16 0" />
      </svg>

      {/* Scattered stars - bottom right */}
      <svg
        className="absolute bottom-10 right-8 w-24 h-24 opacity-20"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#D97762"
        strokeWidth="2"
      >
        <path d="M20 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        <path d="M60 15l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path d="M75 55l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <path d="M35 70l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />
        <path d="M85 85l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
      </svg>

      {/* Header */}
      <div className="testimonials-header text-center mb-12 px-4">
        <span className="text-sm font-medium tracking-widest uppercase text-primary">
          Happy Customers
        </span>
        <h2 className="text-4xl md:text-5xl font-bold mt-2 text-gray-900 dark:text-white">
          What They Say
        </h2>
        <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Real reviews from our Instagram family
        </p>
      </div>

      {/* 360 Infinite Scroll Container */}
      <div className="testimonials-360-container relative">
        {/* Left gradient overlay */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-white dark:from-gray-900 to-transparent" />
        {/* Right gradient overlay */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-white dark:from-gray-900 to-transparent" />

        <div className="testimonials-infinite-wrapper overflow-hidden">
          <div
            ref={trackRef}
            className="testimonials-infinite-track flex py-4"
          >
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
