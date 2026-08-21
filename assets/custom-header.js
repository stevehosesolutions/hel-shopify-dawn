(() => {
  "use strict";

  document
    .querySelectorAll(".custom-header__messages")
    .forEach(messages => {

      const items = [
        ...messages.querySelectorAll(
          ".custom-header__message"
        )
      ];

      const dots = [
        ...messages.querySelectorAll(
          ".custom-header__message-dot"
        )
      ];

      if (!items.length) return;

      function show(index) {

        if (index < 0 || index >= items.length) {
          return;
        }

        items.forEach((item, i) => {
          item.classList.toggle(
            "is-active",
            i === index
          );
        });

        dots.forEach((dot, i) => {

          const active = i === index;

          dot.classList.toggle(
            "is-active",
            active
          );

          if (active) {
            dot.setAttribute(
              "aria-current",
              "true"
            );
          } else {
            dot.removeAttribute(
              "aria-current"
            );
          }

        });

      }


      dots.forEach((dot, index) => {

        dot.addEventListener(
          "click",
          () => {
            show(index);
          }
        );

      });

    });




   const desktopBreakpoint = window.matchMedia(
  "(min-width: 1200px)"
);

const desktopNavigation = document.querySelector(
  ".custom-header__navigation"
);

let desktopHeaderScrollRaf = null;
let desktopHeaderTriggerY = 0;


function removeDesktopHeaderStates() {

  document.body.classList.remove(
    "header-desktop-compact-layout",
    "header-compact-desktop"
  );

}


function measureDesktopHeaderTrigger() {

  if (!desktopNavigation) {
    return;
  }

  /*
   * Only call this while the navigation is in its
   * normal document position.
   */

  desktopHeaderTriggerY =
    desktopNavigation.getBoundingClientRect().bottom +
    window.scrollY;

}

function showDesktopCompactHeader() {

  document.body.classList.add(
    "header-desktop-compact-layout",
    "header-compact-desktop"
  );

}


function hideDesktopCompactHeader() {

  /*
   * Restore the normal desktop navigation immediately.
   *
   * The compact header has an animated entrance only.
   */

  removeDesktopHeaderStates();

}


function updateDesktopHeader() {

  if (
    !desktopBreakpoint.matches ||
    !desktopNavigation
  ) {
    removeDesktopHeaderStates();
    return;
  }

  const shouldCompact =
    window.scrollY >= desktopHeaderTriggerY;


  if (shouldCompact) {

    if (
      !document.body.classList.contains(
        "header-compact-desktop"
      )
    ) {
      showDesktopCompactHeader();
    }

    return;
  }


  hideDesktopCompactHeader();

}


function onDesktopHeaderScroll() {

  if (desktopHeaderScrollRaf) {
    return;
  }

  desktopHeaderScrollRaf =
    requestAnimationFrame(() => {

      desktopHeaderScrollRaf = null;

      updateDesktopHeader();

    });

}


function onDesktopHeaderResize() {

  /*
   * Crossing out of desktop:
   * remove all desktop compact state.
   */

  if (!desktopBreakpoint.matches) {
    removeDesktopHeaderStates();
    return;
  }


  /*
   * If the normal navigation is currently in-flow,
   * it is safe to remeasure its trigger position.
   *
   * Do not temporarily remove the compact state while
   * resizing — that causes the header to flash.
   */

  if (
    !document.body.classList.contains(
      "header-desktop-compact-layout"
    )
  ) {
    measureDesktopHeaderTrigger();
    updateDesktopHeader();
  }

}


window.addEventListener(
  "scroll",
  onDesktopHeaderScroll,
  { passive:true }
);


window.addEventListener(
  "resize",
  onDesktopHeaderResize
);


desktopBreakpoint.addEventListener(
  "change",
  onDesktopHeaderResize
);


measureDesktopHeaderTrigger();
updateDesktopHeader();


})();

