(() => {
  "use strict";

  const overlay =
    document.getElementById("overlay");

  if (!overlay) return;

  const owners = new Set();

  overlay.setAttribute(
    "aria-hidden",
    "true"
  );

  function sync() {
    const active =
      owners.size > 0;

    const modalActive =
      owners.has("modal");

    overlay.classList.toggle(
      "active",
      active
    );

    overlay.classList.toggle(
      "overlay--modal",
      modalActive
    );

    overlay.setAttribute(
      "aria-hidden",
      active ? "false" : "true"
    );
  }

  window.CustomOverlay = {
    show(owner = "default") {
      owners.add(owner);
      sync();
    },

    hide(owner = "default") {
      owners.delete(owner);
      sync();
    },

    clear() {
      owners.clear();
      sync();
    },

    isActive() {
      return owners.size > 0;
    },

    has(owner) {
      return owners.has(owner);
    },

    element:overlay
  };
})();