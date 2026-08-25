/* ==========================================================================
   Motion in
   ========================================================================== */

(() => {
  "use strict";


  const observer = new IntersectionObserver(
    entries => {

      entries.forEach(entry => {

        entry.target.classList.toggle(
          "is-visible",
          entry.isIntersecting
        );

      });

    },
    {
      threshold:0.1,
      rootMargin:"0px 0px -8% 0px"
    }
  );


  function initMotionIn(scope = document) {

    const elements = scope.querySelectorAll(
      ".motion-in:not([data-motion-initialised])"
    );

    elements.forEach(element => {

      element.setAttribute(
        "data-motion-initialised",
        "true"
      );

      observer.observe(element);

    });

  }


  /*
   * Normal page load
   */

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      () => {
        initMotionIn();
      }
    );

  } else {

    initMotionIn();

  }


  /*
   * Shopify Theme Editor section reloads
   */

  document.addEventListener(
    "shopify:section:load",
    event => {
      initMotionIn(event.target);
    }
  );

})();