/**
 * Tooltip
 * - HTML content via <template id="..."> using data-tooltip="#id"
 * - One tooltip open at a time
 * - Preferred placement: TOP, then BOTTOM, then LEFT/RIGHT
 * - Closes on outside click, Escape, resize and scroll
 * - Appends tooltip to <body>
 * - Adds .is-active to the trigger while open
 * - Uses CSS transitions for both open and close
 */

(() => {
  "use strict";

  const SELECTOR_TRIGGER = ".tooltip-trigger[data-tooltip]";
  const SELECTOR_CLOSE = "[data-tooltip-close]";
  const ATTR_OPEN = "data-open";

  const rootStyles =
    getComputedStyle(document.documentElement);

  const TOOLTIP_GAP = Math.max(
    6,
    (parseFloat(
      rootStyles.getPropertyValue("--m")
    ) || 16) * 0.5
  );

  const VIEWPORT_PAD = 8;
  const ARROW_PAD = 16;

  let openTip = null;
  let autoCloseTimer = null;

  const q = (selector, context = document) =>
    context.querySelector(selector);

  /* =========================
     Creation
  ========================= */

  function createTooltipFromTemplate(template, trigger) {
    const tip = document.createElement("div");

    tip.className = "tooltip";
    tip.setAttribute("role", "tooltip");

    tip.id = template.id
      ? `${template.id}--pop`
      : `tooltip-${Math.random().toString(36).slice(2)}`;

    const node = template.content
      ? template.content.cloneNode(true)
      : document.createTextNode(
          template.textContent || ""
        );

    const content = document.createElement("div");

    content.className = "tooltip__content";
    content.appendChild(node);

    tip.appendChild(content);

    if (content.querySelector(SELECTOR_CLOSE)) {
      tip.setAttribute(
        "data-has-close",
        "true"
      );
    }

    document.body.appendChild(tip);

    trigger.setAttribute(
      "aria-describedby",
      tip.id
    );

    return tip;
  }

  /* =========================
     Positioning
  ========================= */

  function positionTooltip(trigger, tip) {
    const triggerRect =
      trigger.getBoundingClientRect();

    const tooltipWidth = tip.offsetWidth;
    const tooltipHeight = tip.offsetHeight;

    const viewportWidth =
      document.documentElement.clientWidth;

    const viewportHeight =
      document.documentElement.clientHeight;

    let placement = "top";

    let x =
      triggerRect.left +
      (triggerRect.width - tooltipWidth) / 2;

    let y =
      triggerRect.top -
      tooltipHeight -
      TOOLTIP_GAP;

    const fitsTop =
      y >= VIEWPORT_PAD;

    if (!fitsTop) {
      placement = "bottom";

      x =
        triggerRect.left +
        (triggerRect.width - tooltipWidth) / 2;

      y =
        triggerRect.bottom +
        TOOLTIP_GAP;

      const fitsBottom =
        y + tooltipHeight <=
        viewportHeight - VIEWPORT_PAD;

      if (!fitsBottom) {
        const spaceRight =
          viewportWidth - triggerRect.right;

        const spaceLeft =
          triggerRect.left;

        if (spaceRight >= spaceLeft) {
          placement = "right";

          x =
            triggerRect.right +
            TOOLTIP_GAP;

          y =
            triggerRect.top +
            (triggerRect.height - tooltipHeight) / 2;
        } else {
          placement = "left";

          x =
            triggerRect.left -
            tooltipWidth -
            TOOLTIP_GAP;

          y =
            triggerRect.top +
            (triggerRect.height - tooltipHeight) / 2;
        }
      }
    }

    /*
     * Keep tooltip inside viewport.
     */
    x = Math.min(
      Math.max(VIEWPORT_PAD, x),
      viewportWidth -
        tooltipWidth -
        VIEWPORT_PAD
    );

    y = Math.min(
      Math.max(VIEWPORT_PAD, y),
      viewportHeight -
        tooltipHeight -
        VIEWPORT_PAD
    );

    /*
     * Arrow follows trigger centre after
     * viewport constraint has been applied.
     */
    const triggerCentreX =
      triggerRect.left +
      triggerRect.width / 2;

    const triggerCentreY =
      triggerRect.top +
      triggerRect.height / 2;

    const arrowX = Math.min(
      Math.max(
        ARROW_PAD,
        triggerCentreX - x
      ),
      tooltipWidth - ARROW_PAD
    );

    const arrowY = Math.min(
      Math.max(
        ARROW_PAD,
        triggerCentreY - y
      ),
      tooltipHeight - ARROW_PAD
    );

    tip.style.setProperty(
      "--tooltip-arrow-x",
      `${arrowX}px`
    );

    tip.style.setProperty(
      "--tooltip-arrow-y",
      `${arrowY}px`
    );

    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;

    tip.setAttribute(
      "data-placement",
      placement
    );
  }

  /* =========================
     Transition helper
  ========================= */

  function waitForTransition(
    element,
    propertyName,
    callback
  ) {
    const styles =
      getComputedStyle(element);

    const durations =
      styles.transitionDuration
        .split(",")
        .map(value =>
          parseFloat(value) || 0
        );

    const hasTransition =
      durations.some(
        duration => duration > 0
      );

    if (!hasTransition) {
      callback();
      return;
    }

    let finished = false;

    const finish = () => {
      if (finished) return;

      finished = true;

      element.removeEventListener(
        "transitionend",
        onEnd
      );

      element.removeEventListener(
        "transitioncancel",
        finish
      );

      callback();
    };

    function onEnd(e) {
      if (e.target !== element) return;
      if (
        e.propertyName !== propertyName
      ) return;

      finish();
    }

    element.addEventListener(
      "transitionend",
      onEnd
    );

    element.addEventListener(
      "transitioncancel",
      finish
    );
  }

  /* =========================
     Auto close
  ========================= */

  function clearAutoClose() {
    if (!autoCloseTimer) return;

    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }

  function startAutoClose(timeout) {
    clearAutoClose();

    if (
      !Number.isFinite(timeout) ||
      timeout <= 0
    ) {
      return;
    }

    autoCloseTimer = setTimeout(
      closeTooltip,
      timeout
    );
  }

  /* =========================
     Close
  ========================= */

  function closeTooltip() {
    if (!openTip) return;

    clearAutoClose();

    const {
      trigger,
      tipEl
    } = openTip;

    /*
     * Clear current state immediately so
     * another tooltip can open while this
     * one finishes animating out.
     */
    openTip = null;

    trigger.setAttribute(
      "aria-expanded",
      "false"
    );

    trigger.classList.remove(
      "is-active"
    );

    trigger.removeAttribute(
      "aria-describedby"
    );

    tipEl.removeAttribute(
      ATTR_OPEN
    );

    window.removeEventListener(
      "resize",
      onWindowResize
    );

    window.removeEventListener(
      "scroll",
      onWindowScroll,
      true
    );

    document.removeEventListener(
      "keydown",
      onKeydown,
      true
    );

    document.removeEventListener(
      "pointerdown",
      onOutsidePointerDown,
      true
    );

    waitForTransition(
      tipEl,
      "transform",
      () => {
        tipEl.remove();
      }
    );
  }

  /* =========================
     Events
  ========================= */

  function onWindowResize() {
    if (!openTip) return;

    positionTooltip(
      openTip.trigger,
      openTip.tipEl
    );
  }

  function onWindowScroll() {
    closeTooltip();
  }

  function onKeydown(e) {
    if (e.key !== "Escape") return;

    e.preventDefault();

    closeTooltip();
  }

  function onOutsidePointerDown(e) {
    if (!openTip) return;

    const {
      trigger,
      tipEl
    } = openTip;

    if (
      trigger.contains(e.target) ||
      tipEl.contains(e.target)
    ) {
      return;
    }

    closeTooltip();
  }

  /* =========================
     Open / toggle
  ========================= */

  function toggleTooltip(trigger) {
    /*
     * Same trigger:
     * toggle closed.
     */
    if (
      openTip &&
      openTip.trigger === trigger
    ) {
      closeTooltip();
      return;
    }

    /*
     * Different tooltip open:
     * close it first.
     */
    if (openTip) {
      closeTooltip();
    }

    const selector =
      trigger.getAttribute(
        "data-tooltip"
      );

    const template =
      selector
        ? q(selector)
        : null;

    if (
      !template ||
      template.tagName.toLowerCase() !==
        "template"
    ) {
      return;
    }

    const tip =
      createTooltipFromTemplate(
        template,
        trigger
      );

    trigger.setAttribute(
      "aria-expanded",
      "true"
    );

    trigger.classList.add(
      "is-active"
    );

    positionTooltip(
      trigger,
      tip
    );

    openTip = {
      trigger,
      tipEl:tip
    };

    /*
     * Trigger CSS transition only after
     * the closed state has been rendered.
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (
          !openTip ||
          openTip.tipEl !== tip
        ) {
          return;
        }

        tip.setAttribute(
          ATTR_OPEN,
          "true"
        );
      });
    });

    /*
     * Optional auto-close.
     *
     * No data-tooltip-timeout:
     * tooltip remains open.
     */
    const rawTimeout =
      trigger.getAttribute(
        "data-tooltip-timeout"
      );

    const timeout =
      rawTimeout !== null
        ? parseInt(rawTimeout, 10)
        : NaN;

    startAutoClose(timeout);

    /*
     * Pause auto-close while hovered.
     */
    tip.addEventListener(
      "mouseenter",
      clearAutoClose
    );

    tip.addEventListener(
      "mouseleave",
      () => {
        startAutoClose(timeout);
      }
    );

    /*
     * Tooltip close button.
     */
    tip.addEventListener(
      "click",
      e => {
        const closeButton =
          e.target.closest?.(
            SELECTOR_CLOSE
          );

        if (!closeButton) return;

        e.preventDefault();

        closeTooltip();
      }
    );

    window.addEventListener(
      "resize",
      onWindowResize,
      {
        passive:true
      }
    );

    window.addEventListener(
      "scroll",
      onWindowScroll,
      {
        passive:true,
        capture:true
      }
    );

    document.addEventListener(
      "keydown",
      onKeydown,
      true
    );

    document.addEventListener(
      "pointerdown",
      onOutsidePointerDown,
      true
    );
  }

  /* =========================
     Delegated trigger click
  ========================= */

  document.addEventListener(
    "click",
    e => {
      const trigger =
        e.target.closest?.(
          SELECTOR_TRIGGER
        );

      if (!trigger) return;

      e.preventDefault();
      e.stopPropagation();

      toggleTooltip(trigger);
    }
  );
})();