import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useCakeData } from "@/hooks/useCakeData";

const HEADINGS = [
  "Every creation begins with flour, butter & a little bit of magic",
  "Layered with love, frosted with care, baked to perfection",
  "From our oven to your celebration — every bite tells a story",
  "These are the moments we bake for",
];

export default function ScatterGallery() {
  const galleryRef = useRef<HTMLElement>(null);
  const introHeadingRef = useRef<HTMLHeadingElement>(null);
  const scatterHeadingRef = useRef<HTMLHeadingElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const { cakes } = useCakeData();

  useLayoutEffect(() => {
    const gallery = galleryRef.current;
    const introHeading = introHeadingRef.current;
    const galleryHeading = scatterHeadingRef.current;
    const cardsContainer = cardsContainerRef.current;
    if (!gallery || !galleryHeading || !cardsContainer || cakes.length === 0)
      return;

    const IMAGES = cakes.map((c) => ({
      src: c.src,
      alt: c.alt,
      title: c.title,
      description: c.description,
    }));

    function getResponsiveConfig() {
      const w = window.innerWidth;
      if (w <= 480) return { cardCount: 4, cardWidth: 100, cardHeight: 130 };
      if (w <= 768) return { cardCount: 6, cardWidth: 140, cardHeight: 180 };
      if (w <= 1024) return { cardCount: 10, cardWidth: 220, cardHeight: 280 };
      return { cardCount: 14, cardWidth: 260, cardHeight: 330 };
    }

    const CONFIG = {
      ...getResponsiveConfig(),
      animationDuration: 0.6,
      animationOverlap: 0.35,
      headingFadeDuration: 0.3,
    };

    const state = {
      activeCards: [] as Array<{
        element: HTMLElement;
        centerX: number;
        centerY: number;
      }>,
      currentSection: -1,
      isAnimating: false,
      introComplete: false,
    };

    function seededRandom(seed: number) {
      const x = Math.sin(seed * 9301 + 49297) * 49297;
      return x - Math.floor(x);
    }

    function getScatterPosition(index: number, setIndex: number) {
      const seed = index * 137 + setIndex * 31;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = vw / 2;
      const cy = vh / 2;
      const count = CONFIG.cardCount;

      const innerRingCount = Math.min(count, 6);
      const outerRingCount = count - innerRingCount;
      const isOuter = index >= innerRingCount;
      const ringIndex = isOuter ? index - innerRingCount : index;
      const ringTotal = isOuter ? outerRingCount : innerRingCount;

      const padX = CONFIG.cardWidth / 2 + 20;
      const padY = CONFIG.cardHeight / 2 + 20;
      const isSmall = vw <= 768;
      const innerRX = isSmall ? 0.46 : 0.42;
      const innerRY = isSmall ? 0.44 : 0.42;
      const outerRX = isSmall ? 0.5 : 0.48;
      const outerRY = isSmall ? 0.5 : 0.48;
      const innerRadiusX = Math.min((vw - padX * 2) * innerRX, vw * innerRX);
      const innerRadiusY = Math.min((vh - padY * 2) * innerRY, vh * innerRY);
      const outerRadiusX = Math.min((vw - padX * 2) * outerRX, vw * outerRX);
      const outerRadiusY = Math.min((vh - padY * 2) * outerRY, vh * outerRY);

      const radiusX = isOuter ? outerRadiusX : innerRadiusX;
      const radiusY = isOuter ? outerRadiusY : innerRadiusY;

      const angleOffset = setIndex * 0.7 + (isOuter ? Math.PI / ringTotal : 0);
      const angle = angleOffset + (ringIndex / ringTotal) * Math.PI * 2;

      const jitterX = (seededRandom(seed + 300) - 0.5) * 40;
      const jitterY = (seededRandom(seed + 400) - 0.5) * 40;

      let x = cx + Math.cos(angle) * radiusX - CONFIG.cardWidth / 2 + jitterX;
      let y = cy + Math.sin(angle) * radiusY - CONFIG.cardHeight / 2 + jitterY;

      x = Math.max(10, Math.min(x, vw - CONFIG.cardWidth - 10));
      y = Math.max(10, Math.min(y, vh - CONFIG.cardHeight - 10));

      const rotation = (seededRandom(seed + 200) - 0.5) * 24;
      return { x, y, rotation };
    }

    function getEdgePosition(cx: number, cy: number) {
      const distances = {
        left: cx,
        right: window.innerWidth - cx,
        top: cy,
        bottom: window.innerHeight - cy,
      };
      const minDistance = Math.min(...Object.values(distances));
      const offsetX = CONFIG.cardWidth / 2;
      const offsetY = CONFIG.cardHeight / 2;
      const vary = () => (Math.random() - 0.5) * 300;

      if (minDistance === distances.left)
        return { x: -CONFIG.cardWidth - Math.random() * 150, y: cy - offsetY + vary() };
      if (minDistance === distances.right)
        return { x: window.innerWidth + 50 + Math.random() * 150, y: cy - offsetY + vary() };
      if (minDistance === distances.top)
        return { x: cx - offsetX + vary(), y: -CONFIG.cardHeight - Math.random() * 150 };
      return { x: cx - offsetX + vary(), y: window.innerHeight + 50 + Math.random() * 150 };
    }

    // ---- INTRO CARDS ----
    interface IntroCard {
      element: HTMLElement;
      index: number;
      targetX: number;
      targetY: number;
      targetRotation: number;
      spreadAngle: number;
    }
    const introCards: IntroCard[] = [];
    const introCardCount = Math.min(CONFIG.cardCount, IMAGES.length);

    for (let i = 0; i < introCardCount; i++) {
      const card = document.createElement("div");
      card.classList.add("intro-card");
      card.style.width = CONFIG.cardWidth + "px";
      card.style.height = CONFIG.cardHeight + "px";

      const imgData = IMAGES[i % IMAGES.length];
      const img = document.createElement("img");
      img.src = imgData.src;
      img.alt = imgData.alt;
      img.loading = "eager";
      card.appendChild(img);

      const overlay = document.createElement("div");
      overlay.classList.add("card-overlay");
      const overlayTitle = document.createElement("h4");
      overlayTitle.classList.add("card-overlay-title");
      overlayTitle.textContent = imgData.title || imgData.alt;
      overlay.appendChild(overlayTitle);
      if (imgData.description) {
        const overlayDesc = document.createElement("p");
        overlayDesc.classList.add("card-overlay-desc");
        overlayDesc.textContent = imgData.description;
        overlay.appendChild(overlayDesc);
      }
      card.appendChild(overlay);

      cardsContainer.appendChild(card);

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const stackOffset = i * 3;
      const stackRotation = (i - introCardCount / 2) * 2;

      gsap.set(card, {
        x: cx - CONFIG.cardWidth / 2 + stackOffset,
        y: cy - CONFIG.cardHeight / 2 - stackOffset,
        rotation: stackRotation,
        scale: 1 - i * 0.015,
        zIndex: introCardCount - i,
        opacity: 1,
      });

      const target = getScatterPosition(i, 0);

      introCards.push({
        element: card,
        index: i,
        targetX: target.x,
        targetY: target.y,
        targetRotation: target.rotation,
        spreadAngle: 0,
      });
    }

    // Pre-compute spread angles
    {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const centerX = cx - CONFIG.cardWidth / 2;
      const centerY = cy - CONFIG.cardHeight / 2;

      const withAngles = introCards.map((card) => ({
        card,
        targetAngle: Math.atan2(card.targetY - centerY, card.targetX - centerX),
      }));
      withAngles.sort((a, b) => a.targetAngle - b.targetAngle);
      withAngles.forEach((item, sortedIndex) => {
        item.card.spreadAngle =
          (sortedIndex / introCardCount) * Math.PI * 2 - Math.PI / 2;
      });
    }

    gsap.set(galleryHeading, { opacity: 0 });

    // ---- SCATTER GALLERY CARDS ----
    function createCards(setIndex: number) {
      const cards: Array<{ element: HTMLElement; centerX: number; centerY: number }> = [];
      const offset = (setIndex * Math.floor(IMAGES.length / 4)) % IMAGES.length;

      for (let i = 0; i < CONFIG.cardCount; i++) {
        const card = document.createElement("div");
        card.classList.add("scatter-card");
        card.style.width = CONFIG.cardWidth + "px";
        card.style.height = CONFIG.cardHeight + "px";

        const imgData = IMAGES[(i + offset) % IMAGES.length];
        const img = document.createElement("img");
        img.src = imgData.src;
        img.loading = "lazy";
        img.alt = imgData.alt;
        card.appendChild(img);

        const overlay = document.createElement("div");
        overlay.classList.add("card-overlay");
        const overlayTitle = document.createElement("h4");
        overlayTitle.classList.add("card-overlay-title");
        overlayTitle.textContent = imgData.title || imgData.alt;
        overlay.appendChild(overlayTitle);
        if (imgData.description) {
          const overlayDesc = document.createElement("p");
          overlayDesc.classList.add("card-overlay-desc");
          overlayDesc.textContent = imgData.description;
          overlay.appendChild(overlayDesc);
        }
        card.appendChild(overlay);

        const pos = getScatterPosition(i, setIndex);
        gsap.set(card, { x: pos.x, y: pos.y, rotation: pos.rotation, force3D: true });

        gallery!.appendChild(card);
        cards.push({
          element: card,
          centerX: pos.x + CONFIG.cardWidth / 2,
          centerY: pos.y + CONFIG.cardHeight / 2,
        });
      }
      return cards;
    }

    function animateHeading(newText: string) {
      const tl = gsap.timeline();
      tl.to(galleryHeading, { opacity: 0, duration: CONFIG.headingFadeDuration, ease: "power2.inOut" })
        .call(() => { galleryHeading!.textContent = newText; })
        .to(galleryHeading, { opacity: 1, duration: CONFIG.headingFadeDuration, ease: "power2.inOut" });
      return tl;
    }

    function animateCards(
      exitingCards: typeof state.activeCards,
      enteringCards: typeof state.activeCards,
    ) {
      const tl = gsap.timeline();

      exitingCards.forEach(({ element, centerX, centerY }) => {
        gsap.killTweensOf(element);
        const edge = getEdgePosition(centerX, centerY);
        tl.to(
          element,
          {
            x: edge.x, y: edge.y,
            rotation: Math.random() * 180 - 90,
            duration: CONFIG.animationDuration,
            ease: "power2.in", force3D: true,
            onComplete: () => element.remove(),
          },
          0,
        );
      });

      enteringCards.forEach(({ element, centerX, centerY }) => {
        const edge = getEdgePosition(centerX, centerY);
        gsap.set(element, { x: edge.x, y: edge.y, rotation: Math.random() * 180 - 90, force3D: true });
        tl.to(
          element,
          {
            x: centerX - CONFIG.cardWidth / 2,
            y: centerY - CONFIG.cardHeight / 2,
            rotation: Math.random() * 40 - 20,
            duration: CONFIG.animationDuration + 0.2,
            ease: "back.out(1.2)", force3D: true,
            onComplete: () => {
              gsap.to(element, {
                y: "+=12", rotation: "+=2",
                duration: 2 + Math.random() * 2,
                repeat: -1, yoyo: true, ease: "sine.inOut",
              });
            },
          },
          CONFIG.animationOverlap,
        );
      });

      return tl;
    }

    let activeMasterTl: gsap.core.Timeline | null = null;

    function transitionToSection(targetSection: number) {
      if (state.isAnimating || targetSection === state.currentSection) return;
      state.isAnimating = true;
      const newCards = createCards(targetSection);

      if (activeMasterTl) {
        activeMasterTl.kill();
        activeMasterTl = null;
      }

      const masterTl = gsap.timeline({
        onComplete: () => {
          state.activeCards = newCards;
          state.currentSection = targetSection;
          state.isAnimating = false;
          activeMasterTl = null;
        },
      });
      activeMasterTl = masterTl;

      masterTl.add(animateCards(state.activeCards, newCards), 0);
      masterTl.add(animateHeading(HEADINGS[targetSection]), 0);
    }

    function getSectionIndex(scatterProgress: number) {
      if (scatterProgress < 0.25) return 0;
      if (scatterProgress < 0.5) return 1;
      if (scatterProgress < 0.75) return 2;
      return 3;
    }

    function lerp(start: number, end: number, t: number) {
      return start + (end - start) * t;
    }

    // ---- UNIFIED SCROLL TRIGGER ----
    const introScrollVH = 3;
    const scatterScrollVH = 5;
    const totalScrollVH = introScrollVH + scatterScrollVH;
    const introRatio = introScrollVH / totalScrollVH;

    const st = ScrollTrigger.create({
      trigger: ".scatter-gallery",
      start: "top top",
      end: () => `+=${window.innerHeight * totalScrollVH}`,
      pin: true,
      pinSpacing: true,
      onUpdate: ({ progress }) => {
        if (progress <= introRatio) {
          // INTRO PHASE
          const introProgress = progress / introRatio;

          // Heading fade
          if (introProgress < 0.35) {
            gsap.set(introHeading, { opacity: 1 });
          } else if (introProgress < 0.55) {
            const fadeP = (introProgress - 0.35) / 0.2;
            gsap.set(introHeading, { opacity: 1 - fadeP });
          } else {
            gsap.set(introHeading, { opacity: 0 });
          }

          // Cards animation
          introCards.forEach(
            ({ element, index, targetX, targetY, targetRotation, spreadAngle }) => {
              const cx = window.innerWidth / 2;
              const cy = window.innerHeight / 2;
              const stackX = cx - CONFIG.cardWidth / 2 + index * 3;
              const stackY = cy - CONFIG.cardHeight / 2 - index * 3;
              const stackRot = (index - introCardCount / 2) * 2;
              const stackScale = 1 - index * 0.015;

              if (introProgress < 0.35) {
                const breathe = Math.sin(introProgress * Math.PI * 4) * 2;
                gsap.set(element, {
                  x: stackX, y: stackY + breathe,
                  rotation: stackRot, scale: stackScale, opacity: 1,
                });
              } else if (introProgress < 0.7) {
                const spreadP = (introProgress - 0.35) / 0.35;
                const eased = 1 - Math.pow(1 - spreadP, 2);
                const spreadDist = eased * Math.min(window.innerWidth, window.innerHeight) * 0.25;
                const spreadX = cx + Math.cos(spreadAngle) * spreadDist - CONFIG.cardWidth / 2;
                const spreadY = cy + Math.sin(spreadAngle) * spreadDist - CONFIG.cardHeight / 2;
                const spreadRot = stackRot + eased * ((index % 2 === 0 ? 1 : -1) * 15);

                gsap.set(element, {
                  x: lerp(stackX, spreadX, eased),
                  y: lerp(stackY, spreadY, eased),
                  rotation: spreadRot,
                  scale: lerp(stackScale, 1, eased), opacity: 1,
                });
              } else {
                const flyP = (introProgress - 0.7) / 0.3;
                const eased = 1 - Math.pow(1 - flyP, 3);
                const spreadDist = Math.min(window.innerWidth, window.innerHeight) * 0.25;
                const spreadX = cx + Math.cos(spreadAngle) * spreadDist - CONFIG.cardWidth / 2;
                const spreadY = cy + Math.sin(spreadAngle) * spreadDist - CONFIG.cardHeight / 2;
                const spreadRot = stackRot + (index % 2 === 0 ? 1 : -1) * 15;

                gsap.set(element, {
                  x: lerp(spreadX, targetX, eased),
                  y: lerp(spreadY, targetY, eased),
                  rotation: lerp(spreadRot, targetRotation, eased),
                  scale: 1, opacity: 1,
                });
              }
            },
          );

          // Show scatter heading near end of intro
          if (introProgress > 0.9) {
            const headFade = (introProgress - 0.9) / 0.1;
            galleryHeading.textContent = HEADINGS[0];
            gsap.set(galleryHeading, { opacity: headFade });
          } else {
            gsap.set(galleryHeading, { opacity: 0 });
          }

          // Reset scatter state when scrolling back into intro
          if (state.introComplete) {
            state.introComplete = false;
            state.currentSection = -1;
            if (activeMasterTl) { activeMasterTl.kill(); activeMasterTl = null; }
            state.isAnimating = false;

            gallery.querySelectorAll(".scatter-card").forEach((el) => {
              gsap.killTweensOf(el);
              el.remove();
            });
            state.activeCards = [];
            introCards.forEach(({ element }) => {
              gsap.killTweensOf(element);
              if (!element.parentNode) cardsContainer.appendChild(element);
              gsap.set(element, { display: "block", opacity: 1 });
            });
          }
        } else {
          // SCATTER GALLERY PHASE
          const scatterProgress = (progress - introRatio) / (1 - introRatio);

          if (!state.introComplete) {
            state.introComplete = true;
            gsap.set(introHeading, { opacity: 0 });
            galleryHeading.textContent = HEADINGS[0];
            gsap.set(galleryHeading, { opacity: 1 });
            state.activeCards = introCards.map(({ element, targetX, targetY }) => ({
              element,
              centerX: targetX + CONFIG.cardWidth / 2,
              centerY: targetY + CONFIG.cardHeight / 2,
            }));
            state.currentSection = 0;
            state.isAnimating = false;
          }

          const targetSection = getSectionIndex(scatterProgress);
          transitionToSection(targetSection);
        }
      },
    });

    // Resize handler
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const responsive = getResponsiveConfig();
        CONFIG.cardCount = responsive.cardCount;
        CONFIG.cardWidth = responsive.cardWidth;
        CONFIG.cardHeight = responsive.cardHeight;

        introCards.forEach((card) => {
          card.element.style.width = CONFIG.cardWidth + "px";
          card.element.style.height = CONFIG.cardHeight + "px";
          const pos = getScatterPosition(card.index, 0);
          card.targetX = pos.x;
          card.targetY = pos.y;
          card.targetRotation = pos.rotation;
        });

        if (!state.introComplete) {
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          introCards.forEach(({ element, index: idx }) => {
            const stackOffset = idx * 3;
            const stackRotation = (idx - introCards.length / 2) * 2;
            gsap.set(element, {
              x: cx - CONFIG.cardWidth / 2 + stackOffset,
              y: cy - CONFIG.cardHeight / 2 - stackOffset,
              rotation: stackRotation,
              scale: 1 - idx * 0.015,
            });
          });
        } else {
          const introIsActive = introCards.some((ic) =>
            state.activeCards.some((ac) => ac.element === ic.element),
          );
          if (introIsActive) {
            state.activeCards = introCards.map(({ element, targetX, targetY }) => ({
              element,
              centerX: targetX + CONFIG.cardWidth / 2,
              centerY: targetY + CONFIG.cardHeight / 2,
            }));
            introCards.forEach(({ element, targetX, targetY, targetRotation }) => {
              gsap.set(element, { x: targetX, y: targetY, rotation: targetRotation });
            });
          } else {
            state.activeCards.forEach(({ element }) => element.remove());
            state.activeCards = createCards(state.currentSection);
          }
        }
        ScrollTrigger.refresh();
      }, 250);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      st.kill();
      if (activeMasterTl) activeMasterTl.kill();
      // Clean up imperatively created DOM
      gallery.querySelectorAll(".scatter-card, .intro-card").forEach((el) => {
        gsap.killTweensOf(el);
        el.remove();
      });
    };
  }, [cakes]);

  return (
    <section
      ref={galleryRef}
      id="gallery"
      className="scatter-gallery bg-background-light dark:bg-background-dark"
    >
      <h2
        ref={introHeadingRef}
        className="intro-heading font-display text-text-light dark:text-text-dark"
      >
        Where Every Bite Tells a Story
      </h2>
      <div ref={cardsContainerRef} className="stacked-cards-container" />
      <h2
        ref={scatterHeadingRef}
        className="scatter-heading font-display text-text-light dark:text-text-dark"
      />
    </section>
  );
}
