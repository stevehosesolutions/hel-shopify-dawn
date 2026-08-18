(() => {
  "use strict";

  const OPEN_CLASS = "uxm-active";
  const HTML_LOCK_CLASS = "uxm-modal-open";
  const BODY_LOCK_CLASS = "uxm-modal-open";
  const OVERLAY_OWNER = "modal";

  const SELECTOR_TRIGGER = "[data-uxm-modal-open]";
  const SELECTOR_CLOSE = "[data-uxm-close]";

  const FOCUSABLE = [
    'a[href]',
    'area[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(",");

  const stack = [];

  /* =========================
     Helpers
  ========================= */

  function getParts(root) {
    const dialog = root.querySelector(".uxm-dialog");
    const content = root.querySelector(".uxm-content");
    const header = root.querySelector(".uxm-header");
    const footer = root.querySelector(".uxm-footer");

    return {
      dialog,
      content,
      header,
      footer
    };
  }

  function getModalRoot(id) {
    if (!id) return null;

    const cleanId = String(id).replace(/^#/, "");
    const byId = document.getElementById(cleanId);

    if (byId) return byId;

    try {
      return document.querySelector(id);
    } catch {
      return null;
    }
  }

  function updateScrollShadows(content, header, footer) {
    if (!content) return;

    const maxScroll = content.scrollHeight - content.clientHeight;
    const hasScroll = maxScroll > 1;
    const scrollTop = content.scrollTop;

    if (header) {
      header.classList.toggle(
        "has-shadow",
        hasScroll && scrollTop > 0
      );
    }

    if (footer) {
      footer.classList.toggle(
        "has-shadow",
        hasScroll && scrollTop < maxScroll - 1
      );
    }
  }

  /* =========================
     Focus
  ========================= */

  function trapFocus(e) {
    if (!stack.length) return;

    const { dialog } = stack[stack.length - 1];

    const nodes = [...dialog.querySelectorAll(FOCUSABLE)].filter(
      node =>
        !node.hasAttribute("disabled") &&
        node.getAttribute("aria-hidden") !== "true"
    );

    if (!nodes.length) {
      e.preventDefault();
      return;
    }

    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    if (e.shiftKey) {
      if (
        document.activeElement === first ||
        !dialog.contains(document.activeElement)
      ) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* =========================
     Scroll lock
  ========================= */

  function lockScroll() {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.setProperty(
      "--uxm-scrollbar-width",
      `${scrollbarWidth}px`
    );

    document.documentElement.classList.add(HTML_LOCK_CLASS);
    document.body.classList.add(BODY_LOCK_CLASS);
  }

  function unlockScroll() {
    document.documentElement.classList.remove(HTML_LOCK_CLASS);
    document.body.classList.remove(BODY_LOCK_CLASS);

    document.documentElement.style.removeProperty(
      "--uxm-scrollbar-width"
    );
  }

  /* =========================
     Open
  ========================= */

  function openModalById(id) {
    const root = getModalRoot(id);

    if (!root) return;

    /* Don't open the same modal twice */
    if (stack.some(entry => entry.root === root)) return;

    const {
      dialog,
      content,
      header,
      footer
    } = getParts(root);

    if (!dialog) return;

    const lastActive = document.activeElement;

    const scrollHandler = () =>
      updateScrollShadows(content, header, footer);

    stack.push({
      root,
      dialog,
      content,
      header,
      footer,
      lastActive,
      scrollHandler
    });

    dialog.setAttribute("tabindex", "-1");
    root.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
      root.classList.add(OPEN_CLASS);
      dialog.focus({ preventScroll: true });
    });

    root.addEventListener("keydown", onKeydown);

    dialog.querySelectorAll(SELECTOR_CLOSE).forEach(btn => {
      btn.addEventListener("click", onCloseBtn);
    });

    if (content) {
      content.addEventListener("scroll", scrollHandler, {
        passive: true
      });

      requestAnimationFrame(scrollHandler);
    }

    /*
     * Only initialise global modal behaviour
     * when the first modal opens.
     */
    if (stack.length === 1) {
      document.addEventListener(
        "keydown",
        onGlobalKeydown
      );

      document.addEventListener(
        "pointerdown",
        onOutsidePointerDown
      );

      lockScroll();

      window.CustomOverlay?.show(OVERLAY_OWNER);
    }

    root.dispatchEvent(
      new CustomEvent("uxm:opened")
    );
  }

  /* =========================
     Close
  ========================= */

  function closeTopModal() {
  if (!stack.length) return;

  const {
    root,
    dialog,
    content,
    header,
    footer,
    lastActive,
    scrollHandler
  } = stack.pop();

  const isLastModal = stack.length === 0;

  if (
    document.activeElement &&
    root.contains(document.activeElement) &&
    typeof document.activeElement.blur === "function"
  ) {
    document.activeElement.blur();
  }

  root.removeEventListener("keydown", onKeydown);

  dialog.querySelectorAll(SELECTOR_CLOSE).forEach(btn => {
    btn.removeEventListener("click", onCloseBtn);
  });

  if (content) {
    content.removeEventListener(
      "scroll",
      scrollHandler
    );
  }

  header?.classList.remove("has-shadow");
  footer?.classList.remove("has-shadow");

  if (isLastModal) {
    document.removeEventListener(
      "keydown",
      onGlobalKeydown
    );

    document.removeEventListener(
      "pointerdown",
      onOutsidePointerDown
    );

    window.CustomOverlay?.hide(OVERLAY_OWNER);
  }

  const finishClose = () => {
    root.setAttribute("aria-hidden", "true");

    if (isLastModal) {
      unlockScroll();
    }

    root.dispatchEvent(
      new CustomEvent("uxm:closed")
    );

    if (lastActive?.focus) {
      const isTouchDevice =
        window.matchMedia("(pointer: coarse)").matches;

      const isFormField =
        lastActive.matches?.(
          "input, textarea, select"
        );

      if (!(isTouchDevice && isFormField)) {
        lastActive.focus({
          preventScroll: true
        });
      }
    }
  };

  /* Start closing transition */
  root.classList.remove(OPEN_CLASS);

  waitForDialogTransition(
    dialog,
    finishClose
  );
}

  /* =========================
     Events
  ========================= */

  function waitForDialogTransition(dialog, callback) {
    const styles = getComputedStyle(dialog);

    const durations = styles.transitionDuration
      .split(",")
      .map(value => parseFloat(value) || 0);

    const hasTransition =
      durations.some(duration => duration > 0);

    if (!hasTransition) {
      callback();
      return;
    }

    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;

      dialog.removeEventListener(
        "transitionend",
        onEnd
      );

      dialog.removeEventListener(
        "transitioncancel",
        finish
      );

      callback();
    };

    function onEnd(e) {
      if (e.target !== dialog) return;
      if (e.propertyName !== "transform") return;

      finish();
    }

    dialog.addEventListener(
      "transitionend",
      onEnd
    );

    dialog.addEventListener(
      "transitioncancel",
      finish
    );
  }


function onOutsidePointerDown(e) {
  if (!stack.length) return;

  const { dialog } = stack[stack.length - 1];

  if (dialog.contains(e.target)) return;

  closeTopModal();
}

  function onCloseBtn(e) {
    e.preventDefault();
    e.stopPropagation();

    closeTopModal();
  }

  function onKeydown(e) {
    if (e.key === "Tab") {
      trapFocus(e);
    }
  }

  function onGlobalKeydown(e) {
    if (e.key !== "Escape") return;

    e.preventDefault();

    closeTopModal();
  }

  document.addEventListener("click", e => {
    const trigger =
      e.target.closest?.(SELECTOR_TRIGGER);

    if (!trigger) return;

    e.preventDefault();

    const target =
      trigger.getAttribute("data-uxm-modal-open");

    if (target) {
      openModalById(target);
    }
  });

  /* =========================
     Public API
  ========================= */

  window.uxmModal = {
    open: openModalById,
    close: closeTopModal
  };
})();