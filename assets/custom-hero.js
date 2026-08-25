/* ==========================================================================
   Custom hero
   ========================================================================== */

(() => {
  "use strict";


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


    updateHeaderHeroTheme(hero);

  }


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

        }
      );

    });


    updateHeaderHeroTheme(hero);

  }


  function initCustomHeroes(scope = document) {

    scope
      .querySelectorAll(".custom-hero")
      .forEach(initCustomHero);

  }


  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      () => {
        initCustomHeroes();
      }
    );

  } else {

    initCustomHeroes();

  }


  document.addEventListener(
    "shopify:section:load",
    event => {
      initCustomHeroes(event.target);
    }
  );

})();