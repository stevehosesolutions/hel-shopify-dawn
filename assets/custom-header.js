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
})();