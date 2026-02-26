import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useCakeData } from "@/hooks/useCakeData";
import { lqipUrl, optimizedUrl } from "@/lib/cloudinaryUrl";
import { isPreloaded, preloadImage } from "@/lib/imagePreloader";

const HEADINGS = [
  "Every creation begins with flour, butter & a little bit of magic",
  "Layered with love, frosted with care, baked to perfection",
  "From our oven to your celebration — every bite tells a story",
  "These are the moments we bake for",
];

// --- Shared helper: create a card DOM element with LQIP ---
function createCardElement(
  imgData: { src: string; alt: string; title: string; description: string },
  width: number,
  height: number,
  className: string,
) {
  const card = document.createElement("div");
  card.classList.add(className);
  card.style.cssText = `width:${width}px;height:${height}px;`;

  const fullSrc = optimizedUrl(imgData.src);
  const img = document.createElement("img");
  img.alt = imgData.alt;
  img.decoding = "async";

  if (isPreloaded(fullSrc)) {
    img.src = fullSrc;
  } else {
    img.src = lqipUrl(imgData.src);
    img.classList.add("lqip-blur");
    preloadImage(fullSrc).then(() => {
      img.src = fullSrc;
      requestAnimationFrame(() => {
        img.classList.remove("lqip-blur");
      });
    });
  }
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

  return card;
}

export default function ScatterGallery() {
  const galleryRef = useRef<HTMLElement>(null);
  const introHeadingRef = useRef<HTMLHeadingElement>(null);
  const scatterHeadingRef = useRef<HTMLHeadingElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
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

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    const isMobileLayout = vw <= 768;

    // ============================================================
    // MOBILE: Simple Horizontal Scroll Gallery
    // ============================================================
    if (isMobileLayout) {
      const NUM_CARDS = 6;
      const CARD_W =
        vw <= 400
          ? Math.round(vw * 0.68)
          : vw <= 480
            ? Math.round(vw * 0.65)
            : Math.round(vw * 0.55);
      const CARD_H = Math.round(CARD_W * 1.25);
      const GAP = vw <= 480 ? 14 : 16;
      const SCROLL_VH = 3;

      // Title area takes ~18% from top, cards centered in remaining space
      const titleAreaHeight = vh * 0.18;
      const remainingHeight = vh - titleAreaHeight;
      const stripTop = titleAreaHeight + (remainingHeight - CARD_H) / 2 - 20;

      // Create a horizontal strip container
      const strip = document.createElement("div");
      strip.className = "mobile-scroll-strip";
      strip.style.cssText = `
        display: flex;
        gap: ${GAP}px;
        position: absolute;
        top: ${stripTop}px;
        left: ${(vw - CARD_W) / 2}px;
        will-change: transform;
      `;
      cardsContainer!.appendChild(strip);

      // Use images from the second half of the array for variety
      const imageOffset = Math.floor(IMAGES.length / 2);
      for (let i = 0; i < NUM_CARDS; i++) {
        const imgData = IMAGES[(i + imageOffset) % IMAGES.length];
        const card = createCardElement(
          imgData,
          CARD_W,
          CARD_H,
          "mobile-slider-card",
        );
        // Override absolute positioning for flex layout
        card.style.position = "relative";
        card.style.flexShrink = "0";
        strip.appendChild(card);
      }

      // Show intro heading as the section title at top
      if (introHeading) {
        introHeading.style.zIndex = "20";
        gsap.set(introHeading, { opacity: 1 });
      }
      // Show the scatter heading at bottom (updates during scroll)
      galleryHeading.textContent = HEADINGS[0];
      gsap.set(galleryHeading, { opacity: 1 });

      // --- Progress line below cards ---
      const progressBarTop = stripTop + CARD_H + 20;
      const progressTrack = document.createElement("div");
      progressTrack.className = "mobile-progress-track";
      progressTrack.style.cssText = `
        position: absolute;
        top: ${progressBarTop}px;
        left: 50%;
        transform: translateX(-50%);
        width: ${CARD_W}px;
        height: 3px;
        background: rgba(0, 0, 0, 0.08);
        border-radius: 2px;
        z-index: 15;
        overflow: hidden;
      `;

      const progressFill = document.createElement("div");
      progressFill.style.cssText = `
        width: 0%;
        height: 100%;
        border-radius: 2px;
        background: linear-gradient(90deg, #d97762, #e8a87c, #d97762);
        transition: width 0.1s ease-out;
      `;
      progressTrack.appendChild(progressFill);
      cardsContainer!.appendChild(progressTrack);

      // --- Scroll indicator below progress bar ---
      const scrollIndicator = document.createElement("div");
      scrollIndicator.className = "mobile-scroll-indicator";
      scrollIndicator.style.cssText = `
        position: absolute;
        top: ${progressBarTop + 18}px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        z-index: 15;
        opacity: 0.6;
      `;
      scrollIndicator.innerHTML = `
        <span style="font-size: 0.65rem; color: var(--color-text-light); letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--font-body);">Scroll</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary); animation: scrollChevron 1.5s ease-in-out infinite;">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      `;
      cardsContainer!.appendChild(scrollIndicator);

      // Calculate how far to scroll horizontally
      const totalStripWidth = NUM_CARDS * CARD_W + (NUM_CARDS - 1) * GAP;
      const scrollDistance = totalStripWidth - CARD_W; // scroll until last card is centered

      // Animate the strip horizontally on scroll
      const tween = gsap.to(strip, {
        x: -scrollDistance,
        ease: "none",
      });

      const st = ScrollTrigger.create({
        trigger: ".scatter-gallery",
        start: "top top",
        end: () => `+=${vh * SCROLL_VH}`,
        pin: true,
        pinSpacing: true,
        animation: tween,
        scrub: 1.5,
        fastScrollEnd: true,
        onUpdate: ({ progress }) => {
          // Update progress bar fill
          progressFill.style.width = `${progress * 100}%`;

          // Hide scroll indicator after scrolling starts
          if (progress > 0.02) {
            gsap.to(scrollIndicator, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out",
              overwrite: true,
            });
          }

          // Hide scroll hint
          if (scrollHintRef.current && progress > 0.02) {
            gsap.to(scrollHintRef.current, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out",
              overwrite: true,
            });
          }

          // Update bottom heading text based on scroll progress
          const headingIndex = Math.min(
            Math.floor(progress * HEADINGS.length),
            HEADINGS.length - 1,
          );
          if (galleryHeading.textContent !== HEADINGS[headingIndex]) {
            galleryHeading.textContent = HEADINGS[headingIndex];
          }
        },
      });

      // Resize handler
      let resizeTimer: ReturnType<typeof setTimeout>;
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          vw = window.innerWidth;
          vh = window.innerHeight;
          ScrollTrigger.refresh();
        }, 250);
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        clearTimeout(resizeTimer);
        st.kill();
        tween.kill();
        strip.remove();
        progressTrack.remove();
        scrollIndicator.remove();
        gallery
          .querySelectorAll(".scatter-card, .intro-card, .mobile-slider-card")
          .forEach((el) => {
            gsap.killTweensOf(el);
            el.remove();
          });
      };
    }

    // ============================================================
    // DESKTOP: Original Scatter Gallery (unchanged)
    // ============================================================
    function getResponsiveConfig() {
      const w = window.innerWidth;
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
      hintHidden: false,
    };

    function seededRandom(seed: number) {
      const x = Math.sin(seed * 9301 + 49297) * 49297;
      return x - Math.floor(x);
    }

    function getScatterPosition(index: number, setIndex: number) {
      const seed = index * 137 + setIndex * 31;
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
      const innerRX = 0.42;
      const innerRY = 0.42;
      const outerRX = 0.48;
      const outerRY = 0.48;
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
        right: vw - cx,
        top: cy,
        bottom: vh - cy,
      };
      const minDistance = Math.min(...Object.values(distances));
      const offsetX = CONFIG.cardWidth / 2;
      const offsetY = CONFIG.cardHeight / 2;
      const vary = () => (Math.random() - 0.5) * 300;

      if (minDistance === distances.left)
        return {
          x: -CONFIG.cardWidth - Math.random() * 150,
          y: cy - offsetY + vary(),
        };
      if (minDistance === distances.right)
        return { x: vw + 50 + Math.random() * 150, y: cy - offsetY + vary() };
      if (minDistance === distances.top)
        return {
          x: cx - offsetX + vary(),
          y: -CONFIG.cardHeight - Math.random() * 150,
        };
      return { x: cx - offsetX + vary(), y: vh + 50 + Math.random() * 150 };
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
      const imgData = IMAGES[i % IMAGES.length];
      const card = createCardElement(
        imgData,
        CONFIG.cardWidth,
        CONFIG.cardHeight,
        "intro-card",
      );
      cardsContainer.appendChild(card);

      const cx = vw / 2;
      const cy = vh / 2;
      const stackOffset = i * 3;
      const stackRotation = (i - introCardCount / 2) * 2;

      gsap.set(card, {
        x: cx - CONFIG.cardWidth / 2 + stackOffset,
        y: cy - CONFIG.cardHeight / 2 - stackOffset,
        rotation: stackRotation,
        scale: 1 - i * 0.015,
        zIndex: introCardCount - i,
        opacity: 1,
        force3D: true,
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
      const cx = vw / 2;
      const cy = vh / 2;
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

    // Pre-compute per-card static values for the intro phase
    const introStatics = introCards.map(({ index, spreadAngle }) => {
      const cx = vw / 2;
      const cy = vh / 2;
      return {
        stackX: cx - CONFIG.cardWidth / 2 + index * 3,
        stackY: cy - CONFIG.cardHeight / 2 - index * 3,
        stackRot: (index - introCardCount / 2) * 2,
        stackScale: 1 - index * 0.015,
        spreadAngle,
        cosAngle: Math.cos(spreadAngle),
        sinAngle: Math.sin(spreadAngle),
        isEven: index % 2 === 0,
      };
    });

    gsap.set(galleryHeading, { opacity: 0 });

    // ---- SCATTER GALLERY CARDS ----
    function createCards(setIndex: number) {
      const cards: Array<{
        element: HTMLElement;
        centerX: number;
        centerY: number;
      }> = [];
      const offset = (setIndex * Math.floor(IMAGES.length / 4)) % IMAGES.length;

      for (let i = 0; i < CONFIG.cardCount; i++) {
        const imgData = IMAGES[(i + offset) % IMAGES.length];
        const card = createCardElement(
          imgData,
          CONFIG.cardWidth,
          CONFIG.cardHeight,
          "scatter-card",
        );

        const pos = getScatterPosition(i, setIndex);
        gsap.set(card, {
          x: pos.x,
          y: pos.y,
          rotation: pos.rotation,
          force3D: true,
        });

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
      tl.to(galleryHeading, {
        opacity: 0,
        duration: CONFIG.headingFadeDuration,
        ease: "power2.inOut",
      })
        .call(() => {
          galleryHeading!.textContent = newText;
        })
        .to(galleryHeading, {
          opacity: 1,
          duration: CONFIG.headingFadeDuration,
          ease: "power2.inOut",
        });
      return tl;
    }

    // Track all idle floating tweens so we can kill them properly
    const idleTweens: gsap.core.Tween[] = [];

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
            x: edge.x,
            y: edge.y,
            rotation: Math.random() * 180 - 90,
            duration: CONFIG.animationDuration,
            ease: "power2.in",
            force3D: true,
            onComplete: () => element.remove(),
          },
          0,
        );
      });

      enteringCards.forEach(({ element, centerX, centerY }) => {
        const edge = getEdgePosition(centerX, centerY);
        gsap.set(element, {
          x: edge.x,
          y: edge.y,
          rotation: Math.random() * 180 - 90,
          force3D: true,
        });
        const finalX = centerX - CONFIG.cardWidth / 2;
        const finalY = centerY - CONFIG.cardHeight / 2;
        tl.to(
          element,
          {
            x: finalX,
            y: finalY,
            rotation: Math.random() * 40 - 20,
            duration: CONFIG.animationDuration + 0.2,
            ease: "back.out(1.2)",
            force3D: true,
            onComplete: () => {
              const idle = gsap.to(element, {
                y: finalY + 12,
                rotation: "+=2",
                duration: 2 + Math.random() * 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                force3D: true,
              });
              idleTweens.push(idle);
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

      // Kill idle floating tweens before transition
      idleTweens.forEach((t) => t.kill());
      idleTweens.length = 0;

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

    // Use quickSetter for high-frequency scroll updates
    const introSetters = introCards.map(({ element }) => ({
      x: gsap.quickSetter(element, "x", "px"),
      y: gsap.quickSetter(element, "y", "px"),
      rotation: gsap.quickSetter(element, "rotation", "deg"),
      scale: gsap.quickSetter(element, "scale"),
      opacity: gsap.quickSetter(element, "opacity"),
    }));
    const headingOpacitySetter = gsap.quickSetter(introHeading!, "opacity");
    const galleryHeadingOpacitySetter = gsap.quickSetter(
      galleryHeading,
      "opacity",
    );

    const st = ScrollTrigger.create({
      trigger: ".scatter-gallery",
      start: "top top",
      end: () => `+=${vh * totalScrollVH}`,
      pin: true,
      pinSpacing: true,
      fastScrollEnd: true,
      onUpdate: ({ progress }) => {
        // Fade out scroll hint
        if (!state.hintHidden && scrollHintRef.current && progress > 0.02) {
          state.hintHidden = true;
          gsap.to(scrollHintRef.current, {
            opacity: 0,
            duration: 0.4,
            ease: "power2.out",
          });
        }

        if (progress <= introRatio) {
          // INTRO PHASE
          const introProgress = progress / introRatio;

          // Heading fade
          if (introProgress < 0.35) {
            headingOpacitySetter(1);
          } else if (introProgress < 0.55) {
            headingOpacitySetter(1 - (introProgress - 0.35) / 0.2);
          } else {
            headingOpacitySetter(0);
          }

          // Cards animation
          const cx = vw / 2;
          const cy = vh / 2;
          const spreadDistMax = Math.min(vw, vh) * 0.25;

          for (let i = 0; i < introCards.length; i++) {
            const card = introCards[i];
            const s = introStatics[i];
            const setter = introSetters[i];

            if (introProgress < 0.35) {
              const breathe = Math.sin(introProgress * Math.PI * 4) * 2;
              setter.x(s.stackX);
              setter.y(s.stackY + breathe);
              setter.rotation(s.stackRot);
              setter.scale(s.stackScale);
              setter.opacity(1);
            } else if (introProgress < 0.7) {
              const spreadP = (introProgress - 0.35) / 0.35;
              const eased = 1 - (1 - spreadP) * (1 - spreadP);
              const spreadDist = eased * spreadDistMax;
              const spreadX =
                cx + s.cosAngle * spreadDist - CONFIG.cardWidth / 2;
              const spreadY =
                cy + s.sinAngle * spreadDist - CONFIG.cardHeight / 2;
              const spreadRot = s.stackRot + eased * ((s.isEven ? 1 : -1) * 15);

              setter.x(lerp(s.stackX, spreadX, eased));
              setter.y(lerp(s.stackY, spreadY, eased));
              setter.rotation(spreadRot);
              setter.scale(lerp(s.stackScale, 1, eased));
              setter.opacity(1);
            } else {
              const flyP = (introProgress - 0.7) / 0.3;
              const eased = 1 - (1 - flyP) * (1 - flyP) * (1 - flyP);
              const spreadX =
                cx + s.cosAngle * spreadDistMax - CONFIG.cardWidth / 2;
              const spreadY =
                cy + s.sinAngle * spreadDistMax - CONFIG.cardHeight / 2;
              const spreadRot = s.stackRot + (s.isEven ? 1 : -1) * 15;

              setter.x(lerp(spreadX, card.targetX, eased));
              setter.y(lerp(spreadY, card.targetY, eased));
              setter.rotation(lerp(spreadRot, card.targetRotation, eased));
              setter.scale(1);
              setter.opacity(1);
            }
          }

          // Show scatter heading near end of intro
          if (introProgress > 0.9) {
            galleryHeading.textContent = HEADINGS[0];
            galleryHeadingOpacitySetter((introProgress - 0.9) / 0.1);
          } else {
            galleryHeadingOpacitySetter(0);
          }

          // Reset scatter state when scrolling back into intro
          if (state.introComplete) {
            state.introComplete = false;
            state.currentSection = -1;
            if (activeMasterTl) {
              activeMasterTl.kill();
              activeMasterTl = null;
            }
            state.isAnimating = false;

            idleTweens.forEach((t) => t.kill());
            idleTweens.length = 0;

            gallery.querySelectorAll(".scatter-card").forEach((el) => {
              gsap.killTweensOf(el);
              el.remove();
            });
            state.activeCards = [];
            introCards.forEach(({ element }) => {
              gsap.killTweensOf(element);
              if (!element.parentNode) cardsContainer.appendChild(element);
              gsap.set(element, {
                display: "block",
                opacity: 1,
                force3D: true,
              });
            });
          }
        } else {
          // SCATTER GALLERY PHASE
          const scatterProgress = (progress - introRatio) / (1 - introRatio);

          if (!state.introComplete) {
            state.introComplete = true;
            headingOpacitySetter(0);
            galleryHeading.textContent = HEADINGS[0];
            galleryHeadingOpacitySetter(1);
            state.activeCards = introCards.map(
              ({ element, targetX, targetY }) => ({
                element,
                centerX: targetX + CONFIG.cardWidth / 2,
                centerY: targetY + CONFIG.cardHeight / 2,
              }),
            );
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
        vw = window.innerWidth;
        vh = window.innerHeight;

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

        const cx = vw / 2;
        const cy = vh / 2;
        introCards.forEach(({ index, spreadAngle }, i) => {
          introStatics[i].stackX = cx - CONFIG.cardWidth / 2 + index * 3;
          introStatics[i].stackY = cy - CONFIG.cardHeight / 2 - index * 3;
          introStatics[i].cosAngle = Math.cos(spreadAngle);
          introStatics[i].sinAngle = Math.sin(spreadAngle);
        });

        if (!state.introComplete) {
          introCards.forEach(({ element, index: idx }) => {
            const stackOffset = idx * 3;
            const stackRotation = (idx - introCards.length / 2) * 2;
            gsap.set(element, {
              x: cx - CONFIG.cardWidth / 2 + stackOffset,
              y: cy - CONFIG.cardHeight / 2 - stackOffset,
              rotation: stackRotation,
              scale: 1 - idx * 0.015,
              force3D: true,
            });
          });
        } else {
          const introIsActive = introCards.some((ic) =>
            state.activeCards.some((ac) => ac.element === ic.element),
          );
          if (introIsActive) {
            state.activeCards = introCards.map(
              ({ element, targetX, targetY }) => ({
                element,
                centerX: targetX + CONFIG.cardWidth / 2,
                centerY: targetY + CONFIG.cardHeight / 2,
              }),
            );
            introCards.forEach(
              ({ element, targetX, targetY, targetRotation }) => {
                gsap.set(element, {
                  x: targetX,
                  y: targetY,
                  rotation: targetRotation,
                  force3D: true,
                });
              },
            );
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
      idleTweens.forEach((t) => t.kill());
      idleTweens.length = 0;
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

      {/* Scroll-down hint */}
      <div ref={scrollHintRef} className="scroll-hint">
        <span className="scroll-hint-text">Scroll to explore</span>
        <div className="scroll-hint-arrow">
          <span className="material-icons">expand_more</span>
        </div>
      </div>
    </section>
  );
}
