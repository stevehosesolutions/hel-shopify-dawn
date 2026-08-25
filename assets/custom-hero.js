/* ==========================================================================
   Custom hero
   ========================================================================== */

(() => {
  "use strict";


  /* ==========================================================================
     Header theme
     ========================================================================== */

  function updateHeaderHeroTheme(hero) {

    const header = document.querySelector(
      ".custom-header"
    );

    const activeSlide = hero.querySelector(
      ".custom-hero__slide.is-active"
    );


    if (!header || !activeSlide) {
      return;
    }


    const theme =
      activeSlide.dataset.heroTheme;


    header.classList.remove(
      "custom-header--hero-light",
      "custom-header--hero-dark"
    );


    if (theme) {
      header.classList.add(
        `custom-header--hero-${theme}`
      );
    }

  }


  /* ==========================================================================
     Navigation indicator
     ========================================================================== */

  function updateNavigationIndicator(hero) {

    const navigation =
      hero.querySelector(
        ".custom-hero__navigation"
      );

    const activeButton =
      hero.querySelector(
        ".custom-hero__navigation-button.is-active"
      );

    const indicator =
      hero.querySelector(
        ".custom-hero__navigation-indicator"
      );


    if (
      !navigation ||
      !activeButton ||
      !indicator
    ) {
      return;
    }


    const navigationRect =
      navigation.getBoundingClientRect();

    const buttonRect =
      activeButton.getBoundingClientRect();


    const x =
      buttonRect.left -
      navigationRect.left;


    indicator.style.width =
      `${buttonRect.width}px`;

    indicator.style.transform =
      `translateX(${x}px)`;

  }


  /* ==========================================================================
     Slides
     ========================================================================== */

  function showSlide(hero, index) {

    const slides = [
      ...hero.querySelectorAll(
        ".custom-hero__slide"
      )
    ];

    const buttons = [
      ...hero.querySelectorAll(
        ".custom-hero__navigation-button"
      )
    ];


    if (!slides[index]) {
      return;
    }


    slides.forEach((slide, slideIndex) => {

      const active =
        slideIndex === index;


      slide.classList.toggle(
        "is-active",
        active
      );


      slide.setAttribute(
        "aria-hidden",
        active ? "false" : "true"
      );

    });


    buttons.forEach((button, buttonIndex) => {

      const active =
        buttonIndex === index;


      button.classList.toggle(
        "is-active",
        active
      );


      if (active) {

        button.setAttribute(
          "aria-current",
          "true"
        );

      } else {

        button.removeAttribute(
          "aria-current"
        );

      }

    });


    updateNavigationIndicator(hero);
    updateHeaderHeroTheme(hero);

  }


  function getActiveSlideIndex(hero) {

    const slides = [
      ...hero.querySelectorAll(
        ".custom-hero__slide"
      )
    ];


    return slides.findIndex(
      slide =>
        slide.classList.contains(
          "is-active"
        )
    );

  }


  function showNextSlide(hero) {

    const slides = [
      ...hero.querySelectorAll(
        ".custom-hero__slide"
      )
    ];


    if (slides.length < 2) {
      return;
    }


    const currentIndex =
      getActiveSlideIndex(hero);


    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + 1) % slides.length;


    showSlide(
      hero,
      nextIndex
    );

  }


  /* ==========================================================================
     Auto rotation
     ========================================================================== */

  function shouldAutoRotate(hero) {

    if (
      hero.dataset.autoRotate !== "true"
    ) {
      return false;
    }


    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      return false;
    }


    const slides =
      hero.querySelectorAll(
        ".custom-hero__slide"
      );


    return slides.length > 1;

  }


  function stopAutoRotate(hero) {

    if (!hero._autoRotateTimer) {
      return;
    }


    window.clearTimeout(
      hero._autoRotateTimer
    );


    hero._autoRotateTimer = null;

  }


  function startAutoRotate(hero) {

    stopAutoRotate(hero);


    if (!shouldAutoRotate(hero)) {
      return;
    }


    const seconds =
      Number(
        hero.dataset.rotationSpeed
      );


    const delay =
      Number.isFinite(seconds)
        ? seconds * 1000
        : 6000;


    hero._autoRotateTimer =
      window.setTimeout(
        () => {

          showNextSlide(hero);

          startAutoRotate(hero);

        },
        delay
      );

  }


  function restartAutoRotate(hero) {

    stopAutoRotate(hero);
    startAutoRotate(hero);

  }


  /* ==========================================================================
     Initialise hero
     ========================================================================== */

  function initCustomHero(hero) {

    if (
      hero.hasAttribute(
        "data-hero-initialised"
      )
    ) {
      return;
    }


    hero.setAttribute(
      "data-hero-initialised",
      "true"
    );


    const buttons =
      hero.querySelectorAll(
        ".custom-hero__navigation-button"
      );


    /*
     * Manual slide navigation
     */

    buttons.forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.heroSlide
            );


          showSlide(
            hero,
            index
          );


          /*
           * A manual selection starts a fresh
           * rotation period rather than allowing
           * an existing timer to immediately fire.
           */

          restartAutoRotate(hero);

        }
      );

    });


    /*
     * Pause while the user is interacting
     * with the hero.
     */

    hero.addEventListener(
      "mouseenter",
      () => {
        stopAutoRotate(hero);
      }
    );


    hero.addEventListener(
      "mouseleave",
      () => {
        startAutoRotate(hero);
      }
    );


    hero.addEventListener(
      "focusin",
      () => {
        stopAutoRotate(hero);
      }
    );


    hero.addEventListener(
      "focusout",
      event => {

        if (
          hero.contains(
            event.relatedTarget
          )
        ) {
          return;
        }


        startAutoRotate(hero);

      }
    );


    updateHeaderHeroTheme(hero);
    updateNavigationIndicator(hero);

    startAutoRotate(hero);

  }


  /* ==========================================================================
     Initialise all heroes
     ========================================================================== */

  function initCustomHeroes(scope = document) {

    scope
      .querySelectorAll(
        ".custom-hero"
      )
      .forEach(
        initCustomHero
      );

  }


  /* ==========================================================================
     Navigation resize
     ========================================================================== */

  function updateAllNavigationIndicators() {

    document
      .querySelectorAll(
        ".custom-hero"
      )
      .forEach(hero => {

        updateNavigationIndicator(hero);

      });

  }


  let heroResizeRaf = null;


  window.addEventListener(
    "resize",
    () => {

      if (heroResizeRaf) {
        return;
      }


      heroResizeRaf =
        requestAnimationFrame(
          () => {

            heroResizeRaf = null;

            updateAllNavigationIndicators();

          }
        );

    }
  );


  /* ==========================================================================
     Initial page load
     ========================================================================== */

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => {
        initCustomHeroes();
      }
    );

  } else {

    initCustomHeroes();

  }


  /* ==========================================================================
     Shopify Theme Editor — section load
     ========================================================================== */

  document.addEventListener(
    "shopify:section:load",
    event => {

      initCustomHeroes(
        event.target
      );

    }
  );


  /* ==========================================================================
     Shopify Theme Editor — selected slide
     ========================================================================== */

  document.addEventListener(
    "shopify:block:select",
    event => {

      const slide =
        event.target.closest(
          ".custom-hero__slide"
        );


      if (!slide) {
        return;
      }


      const hero =
        slide.closest(
          ".custom-hero"
        );


      if (!hero) {
        return;
      }


      const slides = [
        ...hero.querySelectorAll(
          ".custom-hero__slide"
        )
      ];


      const index =
        slides.indexOf(
          slide
        );


      if (index === -1) {
        return;
      }


      /*
       * Always show the block being edited.
       * Stop rotation while working in the
       * Theme Editor so it doesn't move away.
       */

      stopAutoRotate(hero);


      showSlide(
        hero,
        index
      );

    }
  );


})();