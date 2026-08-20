(() => {
  "use strict";

  /* =========================
     Config
  ========================= */

  const CONFIG = {
    HOVER_INTENT_DELAY: 120,
    HOVER_GRACE_DELAY: 200,
    BREAKPOINT_PX: 1199,
    DESKTOP_MQ: "(min-width: 1200px)",
    CLOSE_FALLBACK_MS: 700,
  };

  const tabbablesSelector = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  /* =========================
     Base helpers
  ========================= */

  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const hasText = (v) => typeof v === "string" && v.trim().length > 0;

  function linkAttrs(href) {
    const h = hasText(href) ? String(href) : "";
    return `href="${esc(h)}"`;
  }

  function renderLabel(objOrString) {
    const label =
      typeof objOrString === "string"
        ? objOrString
        : String(objOrString?.label ?? "");

    const note =
      typeof objOrString === "string"
        ? ""
        : String(objOrString?.labelNote ?? "");

    return hasText(note)
      ? `<span class="label-text">${esc(label)}</span><span class="label-note">${esc(note)}</span>`
      : `<span class="label-text">${esc(label)}</span>`;
  }

  function ariaLabelFrom(objOrString) {
    const label =
      typeof objOrString === "string"
        ? objOrString
        : String(objOrString?.label ?? "");

    const note =
      typeof objOrString === "string"
        ? ""
        : String(objOrString?.labelNote ?? "");

    return hasText(note) ? `${label} ${note}` : label;
  }

  const labelText = (objOrString) =>
    typeof objOrString === "string"
      ? String(objOrString || "")
      : String(objOrString?.label ?? objOrString?.id ?? "");


  /* =========================
     Key helpers
  ========================= */

  function itemKey(item, idx) {
    return item && item.key ? String(item.key) : `item-${idx}`;
  }

  function colKey(itemId, ci) {
    return `${itemId}-col-${ci}`;
  }

  function nestedItemKey(itemId, ci, ii) {
    return `${itemId}-col-${ci}-item-${ii}`;
  }

  function columnKey(col, fallbackIndex) {
    if (hasText(col?.key)) return String(col.key);
    if (hasText(col?.label)) return String(col.label);
    return `col-${fallbackIndex}`;
  }

  function hasNestedItems(entry) {
    return Array.isArray(entry?.items) && entry.items.length > 0;
  }

  /* =========================
     Image helpers
  ========================= */

  const warmedSrc = new Set();

  function warmImages(scope) {
    if (!scope) return;

    scope.querySelectorAll("img").forEach(img => {
      const src = img.currentSrc || img.src;

      if (!src || warmedSrc.has(src)) return;

      warmedSrc.add(src);

      try {
        img.loading = "eager";
        img.decoding = "async";
      } catch {}
    });
  }

  /* =========================
     Scroll / focus / lock
  ========================= */

  function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }

  function lockScroll() {
    const sw = getScrollbarWidth();
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${sw}px`;
  }

  function unlockScroll() {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }

  function trapFocus(container) {
    const tabbables = [...container.querySelectorAll(tabbablesSelector)].filter(
      (el) => !el.hasAttribute("inert")
    );
    if (!tabbables.length) return () => {};

    const first = tabbables[0];
    const last = tabbables[tabbables.length - 1];

    function onKey(e) {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", onKey);
    return () => container.removeEventListener("keydown", onKey);
  }

  let rafId = null;
  const queued = new Set();

  function queueHintUpdate(scroller) {
    if (!scroller) return;
    queued.add(scroller);
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      queued.forEach(updateScrollFades);
      queued.clear();
      rafId = null;
    });
  }

  function updateScrollFades(scroller) {
    const container = scroller.closest(".mobile-root, .mobile-submenu");
    if (!container) return;

    const EPS = 1;
    const noOverflow = scroller.scrollHeight <= scroller.clientHeight + EPS;
    const atTop = scroller.scrollTop <= EPS;
    const atBottom =
      scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - EPS;

    container.style.setProperty("--fade-top-opacity", noOverflow || atTop ? 0 : 1);
    container.style.setProperty(
      "--fade-bottom-opacity",
      noOverflow || atBottom ? 0 : 1
    );
  }

  /* =========================
     Icon helpers
  ========================= */

  function iconSvg(icon) {
    switch (String(icon || "").toLowerCase()) {
      case "disc":
        return `
          <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
      case "wrench":
        return `
          <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.5 6.5a4 4 0 0 0 4.8 4.8l-8.8 8.8a2 2 0 1 1-2.8-2.8l8.8-8.8a4 4 0 0 0-1.9-7.6l2.1 2.1-2.8 2.8-2.1-2.1a4 4 0 0 0 2.7 6.8"></path>
          </svg>
        `;
      case "droplet":
        return `
          <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3s6 6.2 6 10.5A6 6 0 1 1 6 13.5C6 9.2 12 3 12 3z"></path>
          </svg>
        `;
      case "thermometer":
        return `
          <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z"></path>
          </svg>
        `;
      default:
        return "";
    }
  }

  function iconSizeClass(item) {
    const size = String(item?.iconSize || "sm").toLowerCase();

    if (size === "lg") return "is-lg";
    if (size === "md") return "is-md";
    return "is-sm";
  }

  function renderIcon(item) {
    const sizeClass = iconSizeClass(item);

    if (hasText(item?.iconImage)) {
      return `<img class="menu-icon-img ${sizeClass}" src="${esc(
        item.iconImage
      )}" alt="" loading="lazy" decoding="async">`;
    }

    if (hasText(item?.icon)) {
      return iconSvg(item.icon).replace(
        'class="menu-icon"',
        `class="menu-icon ${sizeClass}"`
      );
    }

    return "";
  }

  /* =========================
     Promo + view all
  ========================= */

  function pickPromoImg(promo) {
    const isDesktop = window.matchMedia(CONFIG.DESKTOP_MQ).matches;
    const candidate = isDesktop
      ? promo?.imgDesktop || promo?.img || promo?.imgMobile
      : promo?.imgMobile || promo?.img || promo?.imgDesktop;

    return hasText(candidate) ? String(candidate) : "";
  }

  function renderFeaturePromo(promo, ariaContextLabel, mobile = false) {
    if (!promo || !hasText(promo.title) || !hasText(promo.href)) return "";

    const img = pickPromoImg(promo);

    if (mobile) {
      return `
        <div class="mobile-feature-promo" aria-label="${esc(
          ariaContextLabel
        )} featured promo">
          <a class="mobile-feature-promo__link${hasText(img) ? " has-image" : " no-image"}" href="${esc(promo.href)}">
            ${
                hasText(img)
                  ? `
                    <div class="mobile-feature-promo__media">
                      <img src="${esc(img)}" alt="" loading="lazy" decoding="async">
                    </div>
                  `
                  : ""
              }
            <div class="mobile-feature-promo__body">
              ${
                hasText(promo.eyebrow)
                  ? `<div class="mobile-feature-promo__eyebrow">${esc(
                      promo.eyebrow
                    )}</div>`
                  : ""
              }
              <div class="mobile-feature-promo__title">${esc(promo.title)}</div>
              ${
                hasText(promo.text)
                  ? `<div class="mobile-feature-promo__text">${esc(
                      promo.text
                    )}</div>`
                  : ""
              }
              <span class="mobile-feature-promo__cta">${esc(
                promo.ctaLabel || "Learn more"
              )} <span aria-hidden="true">→</span></span>
            </div>
          </a>
        </div>
      `;
    }

    return `
      <div class="combined-promo${hasText(img) ? " has-image" : " no-image"}" aria-label="${esc(
        ariaContextLabel
      )} featured promo">

        ${
          hasText(img)
            ? `
              <img src="${esc(img)}" alt="" loading="lazy" decoding="async">
              <div class="combined-promo__overlay"></div>
            `
            : ""
        }

        <div class="combined-promo__content">
          ${
            hasText(promo.eyebrow)
              ? `<div class="combined-promo__eyebrow">${esc(
                  promo.eyebrow
                )}</div>`
              : ""
          }
          <div class="combined-promo__title">${esc(promo.title)}</div>
          ${
            hasText(promo.text)
              ? `<div class="combined-promo__text">${esc(promo.text)}</div>`
              : ""
          }
          <a class="combined-promo__cta" href="${esc(promo.href)}">
            ${esc(promo.ctaLabel || "Learn more")} <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    `;
  }

  function renderViewAll(node, ariaContextLabel, { className } = {}) {
    const va = node && node.viewAll ? node.viewAll : null;
    if (!va || !hasText(String(va.label || "")) || !hasText(String(va.href || ""))) {
      return "";
    }

    return `
      <div class="${esc(className || "viewall")}">
        <a href="${esc(va.href)}" aria-label="${esc(
      ariaContextLabel || "View all"
    )}: ${esc(ariaLabelFrom(va))}">
          ${renderLabel(va)} <span aria-hidden="true">→</span>
        </a>
      </div>
    `;
  }

  /* =========================
     Shared item renderers
  ========================= */

  function renderMeta(note, className) {
    return hasText(note)
      ? `<span class="${className}">${esc(note)}</span>`
      : "";
  }

  function renderDesktopListItems(items = []) {
    return `
      <ul class="combined-col__list">
        ${items
          .map(
            (entry) => `
              <li>
                <a ${linkAttrs(entry?.href)} aria-label="${esc(ariaLabelFrom(entry))}">
                  <span class="combined-link__main">
                    ${renderIcon(entry)}
                    <span class="combined-link__label">${esc(entry?.label || "")}</span>
                  </span>
                  ${renderMeta(entry?.labelNote, "combined-link__meta")}
                </a>
              </li>
            `
          )
          .join("")}
      </ul>
    `;
  }

  function renderDesktopGridItems(items = [], col = {}) {
    const gridClass = col?.gridFixed
      ? "combined-col__grid combined-col__grid--fixed"
      : "combined-col__grid";

    return `
      <div class="${gridClass}">
        ${items
          .map((entry) => {
            const thumb = hasText(entry?.thumb) ? entry.thumb : "";
            return `
              <a class="combined-grid-tile" ${linkAttrs(entry?.href)} aria-label="${esc(
                ariaLabelFrom(entry)
              )}">
                <span class="combined-grid-tile__media">
                  ${
                    thumb
                      ? `<img src="${esc(thumb)}" alt="" loading="lazy" decoding="async">`
                      : ""
                  }
                </span>
                <span class="combined-grid-tile__label">${esc(entry?.label || "")}</span>
                ${renderMeta(entry?.labelNote, "combined-grid-tile__note")}
              </a>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderMobileListAnchor(entry, href) {
    return `
      <a ${linkAttrs(href)} aria-label="${esc(ariaLabelFrom(entry))}">
        <span class="mobile-link-main">
          ${renderIcon(entry)}
          <span class="mobile-link-label">${esc(entry?.label || "")}</span>
        </span>
        ${renderMeta(entry?.labelNote, "mobile-link-meta")}
      </a>
    `;
  }

  function renderMobileInlineItems(items = []) {
    return `
      <ul class="submenu-list" aria-label="Inline links">
        ${items
          .map(
            (entry) => `
              <li>
                ${renderMobileListAnchor(entry, entry?.href)}
              </li>
            `
          )
          .join("")}
      </ul>
    `;
  }

  function renderMobileListItems(items = []) {
    return `
      <ul class="submenu-list" aria-label="Items">
        ${items
          .map(
            (entry) => `
              <li>
                ${renderMobileListAnchor(entry, entry?.href)}
              </li>
            `
          )
          .join("")}
      </ul>
    `;
  }

  function renderMobileGridItems(items = []) {
    return `
      <div class="mobile-grid-list" aria-label="Grid items">
        ${items
          .map((entry) => {
            const thumb = hasText(entry?.thumb) ? entry.thumb : "";
            return `
              <a class="mobile-grid-tile" ${linkAttrs(entry?.href)} aria-label="${esc(
                ariaLabelFrom(entry)
              )}">
                <span class="mobile-grid-tile__media">
                  ${
                    thumb
                      ? `<img src="${esc(
                          thumb
                        )}" alt="" loading="lazy" decoding="async">`
                      : ""
                  }
                </span>
                <span class="mobile-grid-tile__label">${esc(
                  entry?.label || ""
                )}</span>
                ${renderMeta(entry?.labelNote, "mobile-grid-tile__note")}
              </a>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderMobileColumnItems(items = [], itemId, ci) {
    return `
      <ul class="submenu-list" aria-label="Items">
        ${items
          .map((entry, ii) => {
            const hasChildren = hasNestedItems(entry);

            if (hasChildren) {
              return `
                <li class="has-submenu">
                  <a ${linkAttrs("")}
                     class="submenu-trigger"
                     data-submenu="${esc(nestedItemKey(itemId, ci, ii))}"
                     aria-label="${esc(ariaLabelFrom(entry))}">
                    <span class="mobile-link-main">
                      ${renderIcon(entry)}
                      <span class="mobile-link-label">${esc(entry?.label || "")}</span>
                    </span>
                    ${renderMeta(entry?.labelNote, "mobile-link-meta")}
                  </a>
                </li>
              `;
            }

            return `
              <li>
                ${renderMobileListAnchor(entry, entry?.href)}
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  }

  function renderMobileColumnGridItems(items = [], itemId, ci) {
    return `
      <div class="mobile-grid-list" aria-label="Grid items">
        ${items
          .map((entry, ii) => {
            const thumb = hasText(entry?.thumb) ? entry.thumb : "";
            const hasChildren = hasNestedItems(entry);

            if (hasChildren) {
              return `
                <a class="mobile-grid-tile submenu-trigger"
                   ${linkAttrs("")}
                   data-submenu="${esc(nestedItemKey(itemId, ci, ii))}"
                   aria-label="${esc(ariaLabelFrom(entry))}">
                  <span class="mobile-grid-tile__media">
                    ${
                      thumb
                        ? `<img src="${esc(
                            thumb
                          )}" alt="" loading="lazy" decoding="async">`
                        : ""
                    }
                  </span>
                  <span class="mobile-grid-tile__label">${esc(
                    entry?.label || ""
                  )}</span>
                  ${renderMeta(entry?.labelNote, "mobile-grid-tile__note")}
                </a>
              `;
            }

            return `
              <a class="mobile-grid-tile"
                 ${linkAttrs(entry?.href)}
                 aria-label="${esc(ariaLabelFrom(entry))}">
                <span class="mobile-grid-tile__media">
                  ${
                    thumb
                      ? `<img src="${esc(
                          thumb
                        )}" alt="" loading="lazy" decoding="async">`
                      : ""
                  }
                </span>
                <span class="mobile-grid-tile__label">${esc(
                  entry?.label || ""
                )}</span>
                ${renderMeta(entry?.labelNote, "mobile-grid-tile__note")}
              </a>
            `;
          })
          .join("")}
      </div>
    `;
  }

  /* =========================
     Mobile panel chrome
  ========================= */

  function mobileBackHeader(backLabel, currentTitle) {
    return `
      <div class="back-header">
        <div class="back-header__top">
          <button class="back-btn" aria-label="${esc(backLabel)}">
            <span class="back-btn__icon" aria-hidden="true">←</span>
            <span class="back-btn__text">${esc(backLabel)}</span>
          </button>
        </div>
        <div class="back-header__bottom">
          <div class="back-header__title">${esc(currentTitle)}</div>
        </div>
      </div>
    `;
  }

  function mobilePanel(id, backLabel, currentTitle, bodyHtml) {
    return `
      <div class="mobile-submenu" id="submenu-${esc(id)}" aria-label="${esc(
      currentTitle
    )}">
        ${mobileBackHeader(backLabel, currentTitle)}
        <div class="submenu-scroll">${bodyHtml}</div>
      </div>
    `;
  }

  /* =========================
     Init guard
  ========================= */

  let didInit = false;

  function safeInitNav() {
    if (didInit) return;

    const data = window.navData;
    if (!(data && Array.isArray(data.items))) return;

    const desktopMenu = document.getElementById("desktopMenu");
    const mobileMenu = document.getElementById("mobileMenu");
    const mobilePanels = document.getElementById("mobilePanels");

    if (!desktopMenu || !mobileMenu || !mobilePanels) return;

    didInit = true;
    initNav();
  }

  safeInitNav();
  document.addEventListener("navdata:ready", () => safeInitNav(), { once: true });

  /* =========================
     Main init
  ========================= */

  function initNav() {
    const navData = window.navData;
    if (!navData || !Array.isArray(navData.items)) return;

    const OVERLAY_OWNER = "navigation";

    const el = {
      hamburger: document.getElementById("hamburger"),
      mobileNav: document.getElementById("mobileNav"),
      mobileRoot: document.getElementById("mobileRoot"),
      rootScroll: document.getElementById("rootScroll"),
      megaContainer: document.getElementById("megaContainer"),
      navEl: document.querySelector("nav"),
      mobileFooter: document.querySelector(".mobile-footer"),
      desktopMenu: document.getElementById("desktopMenu"),
      mobileMenu: document.getElementById("mobileMenu"),
      mobilePanels: document.getElementById("mobilePanels"),
    };



    const mqDesktop = window.matchMedia(CONFIG.DESKTOP_MQ);

        /* =========================
       Compact mobile header
       ========================= */

    const COMPACT_HEADER_SCROLL_Y = 80;

    let headerScrollRaf = null;

    function syncCompactHeader() {
      const isMobile = !mqDesktop.matches;

      const shouldCompact =
        isMobile &&
        window.scrollY > COMPACT_HEADER_SCROLL_Y;

      document.body.classList.toggle(
        "header-compact",
        shouldCompact
      );
    }

    function onHeaderScroll() {
      if (headerScrollRaf) return;

      headerScrollRaf = requestAnimationFrame(() => {
        headerScrollRaf = null;
        syncCompactHeader();
      });
    }

    window.addEventListener(
      "scroll",
      onHeaderScroll,
      { passive:true }
    );

    syncCompactHeader();


    const itemIds = navData.items.map((item, idx) => itemKey(item, idx));

    let pendingOpenTimer = null;
    let pendingOpenItem = null;

    function clearPendingOpens() {
      if (pendingOpenTimer) {
        clearTimeout(pendingOpenTimer);
        pendingOpenTimer = null;
      }
      pendingOpenItem = null;
    }

    function scheduleOpenFor(item, mega) {
      clearPendingOpens();

      pendingOpenItem = item;
      pendingOpenTimer = setTimeout(() => {
        mega?.openFor(item);
        pendingOpenTimer = null;
        pendingOpenItem = null;
      }, CONFIG.HOVER_INTENT_DELAY);
    }

    function getAllSubmenuScrollers() {
      return el.mobilePanels.querySelectorAll(".mobile-submenu .submenu-scroll");
    }

    function syncDrawerHeaderHeights() {
      el.mobilePanels.querySelectorAll(".mobile-submenu").forEach((panel) => {
        const header = panel.querySelector(".back-header");
        if (!header) return;
        panel.style.setProperty(
          "--drawer-header-height",
          `${Math.round(header.offsetHeight)}px`
        );
      });
    }

    /* =========================
       Desktop render
    ========================= */

    function renderDesktopColumnSection(col, sectionIndex = 0) {
      const renderMode = String(col?.render || "list").toLowerCase();
      const items = Array.isArray(col?.items) ? col.items : [];
      const showHeaderDesktop = col?.showColumnNameOnDesktop !== false;

      const content =
        renderMode === "grid"
          ? renderDesktopGridItems(items, col)
          : renderDesktopListItems(items);

      return `
        <section class="combined-section combined-section--${esc(
          renderMode
        )} ${showHeaderDesktop ? "" : "combined-section--no-header"}"
                 data-section-index="${sectionIndex}">
          ${
            showHeaderDesktop
              ? `
                <div class="combined-col__header">
                  ${
                    hasText(col?.href)
                      ? `
                        <a href="${esc(col.href)}" class="combined-col__header-link">
                          <span class="combined-col__header-text">${esc(col?.label || "")}</span>
                        </a>
                      `
                      : `
                        <div class="combined-col__header-text">${esc(col?.label || "")}</div>
                      `
                  }
                </div>
              `
              : ""
          }
          ${content}
        </section>
      `;
    }

    function buildDesktopPanel(item, itemId) {
      const panelId = `panel-${itemId}`;
      const columns = Array.isArray(item.columns) ? item.columns.filter(Boolean) : [];
      const hasPromo = !!item.promo;

      const columnMap = new Map(
        columns.map((col, index) => [columnKey(col, index), col])
      );

      const hasDesktopColumns =
        Array.isArray(item.desktopColumns) && item.desktopColumns.length > 0;

      let colsHtml = "";
      let visualColCount = 0;

      if (hasDesktopColumns) {
        const packedColumns = item.desktopColumns
          .filter(Boolean)
          .map((desktopCol, desktopIndex) => {
            const sectionKeys = Array.isArray(desktopCol.sections)
              ? desktopCol.sections
              : [];

            const sectionHtml = sectionKeys
              .map((sectionKey, sectionIndex) => {
                const col = columnMap.get(String(sectionKey));
                if (!col) return "";
                return renderDesktopColumnSection(col, sectionIndex);
              })
              .join("");

            if (!sectionHtml) return "";

            return `
              <div class="combined-col combined-col--stack" data-desktop-col="${desktopIndex}">
                ${sectionHtml}
              </div>
            `;
          })
          .filter(Boolean);

        colsHtml = packedColumns.join("");
        visualColCount = packedColumns.length;
      } else {
        colsHtml = columns
          .slice(0, 4)
          .map((col) => {
            const renderMode = String(col?.render || "list").toLowerCase();
            const items = Array.isArray(col?.items) ? col.items : [];
            const content =
              renderMode === "grid"
                ? renderDesktopGridItems(items, col)
                : renderDesktopListItems(items);
            const showHeaderDesktop = col?.showColumnNameOnDesktop !== false;

            return `
              <div class="combined-col ${showHeaderDesktop ? "" : "combined-col--no-header"}">
                ${
                  showHeaderDesktop
                    ? `
                      <div class="combined-col__header">
                        ${
                          hasText(col?.href)
                            ? `
                              <a href="${esc(col.href)}" class="combined-col__header-link">
                                <span class="combined-col__header-text">${esc(col?.label || "")}</span>
                              </a>
                            `
                            : `
                              <div class="combined-col__header-text">${esc(col?.label || "")}</div>
                            `
                        }
                      </div>
                    `
                    : ""
                }
                ${content}
              </div>
            `;
          })
          .join("");

        visualColCount = Math.min(columns.length, 4);
      }

      const promoHtml = hasPromo
        ? `
          <div class="combined-col combined-col--promo">
            ${renderFeaturePromo(item.promo, ariaLabelFrom(item), false)}
          </div>
        `
        : "";

      const totalCols = visualColCount + (hasPromo ? 1 : 0);
      const colsClass = `cols-${Math.max(Math.min(totalCols, 4), 1)}`;

      return `
        <div class="mega-panel mega-panel--combined" aria-hidden="true" id="${esc(
          panelId
        )}">
          <div class="mega-inner mega-inner--combined ${esc(colsClass)}">
            ${colsHtml}
            ${promoHtml}
          </div>
          ${renderViewAll(item, ariaLabelFrom(item), { className: "mega-viewall" })}
        </div>
      `;
    }

    el.desktopMenu.innerHTML = navData.items
      .map((item, idx) => {
        const itemId = itemIds[idx];
        return `
          <li class="has-mega" role="none">
            <a role="menuitem"
               ${linkAttrs(item?.href)}
               data-mega-trigger="${esc(itemId)}"
               aria-haspopup="true"
               aria-expanded="false">
                  <span class="nav-link-main">
                    ${renderIcon(item)}
                    <span class="nav-link-label">${renderLabel(item)}</span>
                  </span>
                </a>
            ${buildDesktopPanel(item, itemId)}
          </li>
        `;
      })
      .join("");

    /* =========================
       Mobile render
    ========================= */

    el.mobileMenu.innerHTML = navData.items
      .map((item, idx) => {
        const itemId = itemIds[idx];
        return `
          <li class="has-submenu">
            <a ${linkAttrs(item?.href)}
               class="submenu-trigger"
               data-submenu="${esc(itemId)}">

              <span class="mobile-link-main">
                ${renderIcon(item)}
                <span class="mobile-link-label">${renderLabel(item)}</span>
              </span>

            </a>
          </li>
        `;
      })
      .join("");

    if (navData.mobileTopPromo) {
      el.mobileMenu.insertAdjacentHTML(
        "afterend",
        renderFeaturePromo(navData.mobileTopPromo, "Mobile featured", true)
      );
    }

    const mobilePanelsHtml = navData.items
      .map((item, idx) => {
        const itemId = itemIds[idx];
        const columns = Array.isArray(item.columns) ? item.columns : [];

        const inlineColumns = columns.filter((col) => col?.mobileInline);
        const drawerColumns = columns.filter((col) => !col?.mobileInline);

        const topBody = `
          ${inlineColumns
            .map((col, inlineIndex) => {
              const renderMode = String(
                col?.mobileRender || col?.render || "list"
              ).toLowerCase();
              const items = Array.isArray(col?.items) ? col.items : [];

              return renderMode === "grid"
                ? renderMobileColumnGridItems(items, itemId, inlineIndex)
                : renderMobileInlineItems(items);
            })
            .join("")}
          <ul class="submenu-list" aria-label="${esc(ariaLabelFrom(item))} sections">
            ${drawerColumns
              .map((col) => {
                const originalIndex = columns.indexOf(col);
                return `
                  <li class="has-submenu">
                    <a ${linkAttrs("")} class="submenu-trigger" data-submenu="${esc(
                      colKey(itemId, originalIndex)
                    )}">
                      ${renderLabel(col)}
                    </a>
                  </li>
                `;
              })
              .join("")}
          </ul>
          ${renderViewAll(item, ariaLabelFrom(item), { className: "mobile-viewall" })}
          ${item.promo ? renderFeaturePromo(item.promo, ariaLabelFrom(item), true) : ""}
        `;

        const childPanels = columns
          .map((col, ci) => {
            if (col?.mobileInline) return "";

            const renderMode = String(
              col?.mobileRender || col?.render || "list"
            ).toLowerCase();
            const items = Array.isArray(col?.items) ? col.items : [];

            const body = `
              ${
                renderMode === "grid"
                  ? renderMobileColumnGridItems(items, itemId, ci)
                  : renderMobileColumnItems(items, itemId, ci)
              }
              ${renderViewAll(col, ariaLabelFrom(col), { className: "mobile-viewall" })}
            `;

            return mobilePanel(
              colKey(itemId, ci),
              `Back to ${item.label}`,
              col?.label || "",
              body
            );
          })
          .join("");

        const nestedPanels = columns
          .map((col, ci) => {
            if (col?.mobileInline) return "";

            const items = Array.isArray(col?.items) ? col.items : [];

            return items
              .map((entry, ii) => {
                if (!hasNestedItems(entry)) return "";

                const nestedBody = `
                  ${renderMobileListItems(entry.items || [])}
                  ${renderViewAll(entry, ariaLabelFrom(entry), { className: "mobile-viewall" })}
                `;

                return mobilePanel(
                  nestedItemKey(itemId, ci, ii),
                  `Back to ${col?.label || item.label}`,
                  entry?.label || "",
                  nestedBody
                );
              })
              .join("");
          })
          .join("");

        return (
          mobilePanel(itemId, "Back to main menu", item?.label || "", topBody) +
          childPanels +
          nestedPanels
        );
      })
      .join("");

    el.mobilePanels.innerHTML = mobilePanelsHtml;
    syncDrawerHeaderHeights();

    /* =========================
       Mobile state
    ========================= */

    let previousFocus = null;
    let releaseFocus = () => {};
    let footerSyncRaf = null;

    function syncFooterOffset() {
      if (window.innerWidth > CONFIG.BREAKPOINT_PX) return;
      if (footerSyncRaf) cancelAnimationFrame(footerSyncRaf);

      footerSyncRaf = requestAnimationFrame(() => {
        const h = el.mobileFooter
          ? Math.round(el.mobileFooter.getBoundingClientRect().height)
          : 0;

        document.documentElement.style.setProperty("--footer-offset", `${h}px`);
        queueHintUpdate(el.rootScroll);
        getAllSubmenuScrollers().forEach(queueHintUpdate);
        footerSyncRaf = null;
      });
    }

    function openMobileNav() {
      el.mobileNav.classList.add("active");
      el.mobileNav.removeAttribute("aria-hidden");

      el.hamburger.classList.remove("show-hamburger");
      el.hamburger.classList.add("show-cross");
      el.hamburger.setAttribute("aria-expanded", "true");
      el.hamburger.setAttribute("aria-label", "Close menu");

      lockScroll();


      warmImages(el.mobileRoot);
      queueHintUpdate(el.rootScroll);
      getAllSubmenuScrollers().forEach(queueHintUpdate);
      syncFooterOffset();
      syncDrawerHeaderHeights();

      previousFocus = document.activeElement;
      releaseFocus = trapFocus(el.mobileNav);
      const first = el.mobileNav.querySelector(tabbablesSelector);
      first && first.focus({ preventScroll: true });
    }

    function closeMobileNav() {
      el.mobileNav.classList.remove("active");

      el.hamburger.classList.remove("show-cross");
      el.hamburger.classList.add("show-hamburger");
      el.hamburger.setAttribute("aria-expanded", "false");
      el.hamburger.setAttribute("aria-label", "Open menu");

      const finishClose = () => {
        el.mobileNav.setAttribute("aria-hidden", "true");

        el.rootScroll.classList.remove("animate");

        el.mobileRoot?.style.removeProperty("--fade-top-opacity");
        el.mobileRoot?.style.removeProperty("--fade-bottom-opacity");

        el.mobilePanels
          .querySelectorAll(".mobile-submenu")
          .forEach(menu => {
            menu.style.removeProperty("--fade-top-opacity");
            menu.style.removeProperty("--fade-bottom-opacity");
            menu.classList.remove("active", "slide-out");
          });

        unlockScroll();

        releaseFocus();

        previousFocus?.focus({
          preventScroll: true
        });
      };

      waitForTransition(
        el.mobileNav,
        "transform",
        finishClose
      );
    }

    function waitForTransition(element, propertyName, callback) {
      const styles = getComputedStyle(element);

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
        if (e.propertyName !== propertyName) return;

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
       Desktop mega controller
    ========================= */

    const mega = (() => {
      if (!el.megaContainer) return null;

      const itemToPanel = new Map();
      const panelHeightCache = new WeakMap();

      function ensureOverlay(visible) {
        if (visible && mqDesktop.matches) {
          window.CustomOverlay?.show(OVERLAY_OWNER);
        } else {
          window.CustomOverlay?.hide(OVERLAY_OWNER);
        }
      }

      let resizeRaf = null;

      el.desktopMenu.querySelectorAll("li.has-mega").forEach((li) => {
        const panel = li.querySelector(":scope > .mega-panel");
        if (!panel) return;

        const trigger = li.querySelector(':scope > a[aria-haspopup="true"]');
        if (!panel.id) panel.id = "panel-" + Math.random().toString(36).slice(2, 9);

        if (trigger) {
          if (!trigger.id) trigger.id = panel.id + "-label";
          trigger.setAttribute("aria-controls", panel.id);
          panel.setAttribute("role", "group");
          panel.setAttribute("aria-labelledby", trigger.id);
        }

        panel.classList.add("is-inactive");
        panel.hidden = false;

        el.megaContainer.appendChild(panel);
        itemToPanel.set(li, panel);
      });

      let state = "closed";
      let currentItem = null;
      let currentPanel = null;
      let ro = null;
      let endHandler = null;
      let closeTimer = null;
      let closeToken = 0;
      let closingRafId = null;


      function setAriaExpandedFor(item, expanded) {
        const trigger = item?.querySelector(':scope > a[aria-expanded]');
        if (trigger) {
          trigger.setAttribute("aria-expanded", expanded ? "true" : "false");
        }
      }

      function setOnlyPanelVisible(panel) {
        Array.from(el.megaContainer.children).forEach((p) => {
          const active = p === panel;
          p.classList.toggle("is-active", active);
          p.classList.toggle("is-inactive", !active);
          p.setAttribute("aria-hidden", active ? "false" : "true");
        });
      }

      function removeEndHandler() {
        if (!endHandler) return;
        el.megaContainer.removeEventListener("transitionend", endHandler);
        endHandler = null;
      }

      function detachObserver() {
        ro?.disconnect();
        ro = null;
      }

      function invalidatePanelHeight(panel) {
        if (!panel) return;
        panelHeightCache.delete(panel);
      }

      function invalidateAllPanelHeights() {
        Array.from(el.megaContainer.children).forEach((panel) => {
          panelHeightCache.delete(panel);
        });
      }

      function getContainerMaxHeight() {
        const maxH = parseFloat(getComputedStyle(el.megaContainer).maxHeight);
        return Number.isFinite(maxH) ? Math.round(maxH) : Infinity;
      }

      function computeTargetHeight(panel, { force = false } = {}) {
        if (!panel) return 0;

        if (!force && panelHeightCache.has(panel)) {
          return panelHeightCache.get(panel);
        }

        const measured = Math.ceil(panel.scrollHeight);
        const finalHeight = Math.min(measured, getContainerMaxHeight());

        panelHeightCache.set(panel, finalHeight);
        return finalHeight;
      }

      function recalcNow(force = false) {
        if (!currentPanel) return;
        const next = `${computeTargetHeight(currentPanel, { force })}px`;
        if (el.megaContainer.style.height !== next) {
          el.megaContainer.style.height = next;
        }
      }

      function attachObserver() {
        detachObserver();
        if (!window.ResizeObserver || !currentPanel) return;

        ro = new ResizeObserver(() => {
          if (state !== "open") return;
          invalidatePanelHeight(currentPanel);

          if (resizeRaf) cancelAnimationFrame(resizeRaf);
          resizeRaf = requestAnimationFrame(() => {
            resizeRaf = null;
            recalcNow();
          });
        });

        ro.observe(currentPanel);
      }

      function cancelClose() {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
        closeToken++;
      }

      function cancelClosingRaf() {
        if (closingRafId) cancelAnimationFrame(closingRafId);
        closingRafId = null;
      }

      function scheduleClose() {
        if (!mqDesktop.matches) return;
        if (!el.megaContainer.classList.contains("open")) return;

        const myToken = ++closeToken;
        clearTimeout(closeTimer);

        closeTimer = setTimeout(() => {
          if (myToken !== closeToken) return;
          closeAll(false);
        }, CONFIG.HOVER_GRACE_DELAY);
      }

      function openFor(item) {
        clearPendingOpens();
        cancelClose();
        cancelClosingRaf();
        removeEndHandler();
        clearTimeout(el.megaContainer.__closeFallback);

        if (!mqDesktop.matches) return;

        const panel = itemToPanel.get(item);
        if (!panel) return;
        if (currentItem === item && state === "open") return;

        const fromH = Math.round(el.megaContainer.getBoundingClientRect().height);

        invalidatePanelHeight(panel);

        if (state === "closed" || state === "closing") {
          currentItem = item;
          currentPanel = panel;

          setOnlyPanelVisible(panel);
          warmImages(panel, { eager: true });

          const targetH = computeTargetHeight(panel);

          if (state === "closed") {
            el.megaContainer.style.height = "0px";
          } else {
            const prev = el.megaContainer.style.transition;

            el.megaContainer.style.transition = "none";
            el.megaContainer.style.height = `${fromH}px`;
            void el.megaContainer.offsetWidth;
            el.megaContainer.style.transition = prev;
          }

          el.megaContainer.classList.add("open");
          ensureOverlay(true);
          setAriaExpandedFor(item, true);
          state = "opening";

          requestAnimationFrame(() => {
            el.megaContainer.style.height = `${targetH}px`;
          });

          endHandler = (e) => {
            if (e.propertyName !== "height") return;
            removeEndHandler();
            state = "open";
            attachObserver();
          };
          el.megaContainer.addEventListener("transitionend", endHandler);
          return;
        }

        /* switching between already-open top-level items */
        setAriaExpandedFor(currentItem, false);

        currentItem = item;
        currentPanel = panel;

        setOnlyPanelVisible(panel);
        warmImages(panel);

        const targetH = computeTargetHeight(panel);

        setAriaExpandedFor(currentItem, true);

        el.megaContainer.style.height = `${fromH}px`;
        requestAnimationFrame(() => {
          el.megaContainer.style.height = `${targetH}px`;
        });

        ensureOverlay(true);
        state = "opening";

        removeEndHandler();
        endHandler = (e) => {
          if (e.propertyName !== "height") return;
          removeEndHandler();
          state = "open";
          attachObserver();
        };
        el.megaContainer.addEventListener("transitionend", endHandler);
      }

      function closeAll(force) {
        if (state === "closed") return;

        setAriaExpandedFor(currentItem, false);
        detachObserver();
        state = "closing";

        let fromH = Math.round(el.megaContainer.getBoundingClientRect().height);
        if (fromH === 0 && currentPanel) {
          fromH = computeTargetHeight(currentPanel);
        }

        const finish = () => {
          removeEndHandler();
          el.megaContainer.classList.remove("open");

          Array.from(el.megaContainer.children).forEach((p) => {
            p.classList.remove("is-active");
            p.classList.add("is-inactive");
            p.setAttribute("aria-hidden", "true");
          });

          el.desktopMenu
            .querySelectorAll('li.has-mega > a[aria-expanded="true"]')
            .forEach((a) => a.setAttribute("aria-expanded", "false"));

          currentItem = null;
          currentPanel = null;
          state = "closed";
          el.megaContainer.style.height = "0px";
          ensureOverlay(false);
        };

        const cs = getComputedStyle(el.megaContainer);
        const hasHeightTransition =
          cs.transitionProperty.includes("height") &&
          cs.transitionDuration.split(",").some((d) => parseFloat(d) > 0);

        if (force || !hasHeightTransition) {
          ensureOverlay(false);
          finish();
          return;
        }

        const prev = el.megaContainer.style.transition;
        el.megaContainer.style.transition = "none";
        el.megaContainer.style.height = `${fromH}px`;
        void el.megaContainer.offsetWidth;
        el.megaContainer.style.transition = prev;

        ensureOverlay(false);

        closingRafId = requestAnimationFrame(() => {
          el.megaContainer.style.height = "0px";
        });

        removeEndHandler();
        endHandler = (e) => {
          if (e.propertyName === "height") finish();
        };
        el.megaContainer.addEventListener("transitionend", endHandler);

        clearTimeout(el.megaContainer.__closeFallback);
        el.megaContainer.__closeFallback = setTimeout(
          finish,
          CONFIG.CLOSE_FALLBACK_MS
        );
      }

      return {
        openFor,
        closeAll,
        cancelClose,
        scheduleClose,
        recalcNow,
        invalidateAllPanelHeights,
      };
    })();

    /* =========================
       Event wiring
    ========================= */

    el.hamburger?.addEventListener("click", () => {
      el.mobileNav.classList.contains("active") ? closeMobileNav() : openMobileNav();
    });

/*    window.CustomOverlay?.element.addEventListener("click", () => {
      if (!window.CustomOverlay.has(OVERLAY_OWNER)) return;

      if (el.mobileNav.classList.contains("active")) closeMobileNav();
      mega?.closeAll(false);
    });*/

    window.addEventListener(
      "blur",
      () => {
        mega?.closeAll(true);
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", () => {
      mega?.closeAll(true);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      mega?.closeAll(false);
      if (el.mobileNav.classList.contains("active")) closeMobileNav();
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("nav")) mega?.closeAll(false);
    });

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a && a.getAttribute("href") === "") e.preventDefault();

      const trig = e.target.closest(".submenu-trigger");
      if (trig && window.innerWidth <= CONFIG.BREAKPOINT_PX) {
        const target = trig.dataset.submenu;
        const submenu = document.getElementById(`submenu-${target}`);
        if (!submenu) return;

        e.preventDefault();
        submenu.classList.add("active");

        const scroller = submenu.querySelector(".submenu-scroll");
        if (scroller) {
          warmImages(scroller);
          queueHintUpdate(scroller);
        }
        return;
      }

      const back = e.target.closest(".back-btn");

      if (back) {
        const parent = back.closest(".mobile-submenu");

        if (!parent) return;

        parent.classList.add("slide-out");

        waitForTransition(
          parent,
          "transform",
          () => {
            parent.style.removeProperty("--fade-top-opacity");
            parent.style.removeProperty("--fade-bottom-opacity");
            parent.classList.remove("active", "slide-out");
          }
        );

        return;
      }

      const megaTrigger = e.target.closest("[data-mega-trigger]");
      if (megaTrigger && mqDesktop.matches) {
        const href = megaTrigger.getAttribute("href") || "";
        if (href === "") {
          e.preventDefault();
          const li = megaTrigger.closest("li.has-mega");
          if (!li) return;

          const expanded = megaTrigger.getAttribute("aria-expanded") === "true";
          if (expanded) mega?.closeAll(false);
          else mega?.openFor(li);
        }
      }
    });

    function closestHasMegaFromNode(node) {
      return node && node.closest ? node.closest("li.has-mega") : null;
    }

    function closestHasMegaFromEvent(e) {
      let item = closestHasMegaFromNode(e.target);
      if (!item && typeof e.clientX === "number") {
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        item = closestHasMegaFromNode(hit);
      }
      return item;
    }

    function isInsideMega(node) {
      return !!(node && el.megaContainer && el.megaContainer.contains(node));
    }

    function isInsideDesktopMenu(node) {
      return !!(node && el.desktopMenu && el.desktopMenu.contains(node));
    }

    function isItemOpen(item) {
      return (
        item
          ?.querySelector(':scope > a[aria-expanded="true"]')
          ?.getAttribute("aria-expanded") === "true"
      );
    }

    el.desktopMenu.addEventListener(
      "pointerover",
      (e) => {
        if (e.pointerType && e.pointerType !== "mouse") return;
        if (!mqDesktop.matches) return;

        const item = closestHasMegaFromEvent(e);
        if (!item) return;

        const fromItem = closestHasMegaFromNode(e.relatedTarget);
        if (fromItem === item) return;

        mega?.cancelClose();

        if (isItemOpen(item)) {
          clearPendingOpens();
          return;
        }

        scheduleOpenFor(item, mega);
      },
      { passive: true }
    );

    el.desktopMenu.addEventListener(
      "pointerout",
      (e) => {
        if (e.pointerType && e.pointerType !== "mouse") return;
        if (!mqDesktop.matches) return;

        const item = closestHasMegaFromNode(e.target);
        if (!item) return;

        const to = e.relatedTarget;
        const toItem = closestHasMegaFromNode(to);

        if (toItem === item) return;

        if (pendingOpenItem === item) {
          clearPendingOpens();
        }

        if (isInsideMega(to)) return;
        if (toItem) return;

        mega?.scheduleClose();
      },
      { passive: true }
    );

/*    el.desktopMenu.addEventListener(
      "pointermove",
      (e) => {
        if (!mqDesktop.matches) return;

        const item = closestHasMegaFromEvent(e);

        if (item) {
          mega?.cancelClose();
          return;
        }

        clearPendingOpens();
        mega?.scheduleClose();
      },
      { passive: true }
    );*/

    el.desktopMenu.addEventListener(
      "mouseleave",
      (e) => {
        if (!mqDesktop.matches) return;

        const to = e.relatedTarget;
        if (isInsideMega(to)) return;

        clearPendingOpens();
        mega?.scheduleClose();
      },
      { passive: true }
    );

    el.megaContainer?.addEventListener(
      "mouseenter",
      () => {
        if (!mqDesktop.matches) return;
        clearPendingOpens();
        mega?.cancelClose();
      },
      { passive: true }
    );

    el.megaContainer?.addEventListener(
      "mouseleave",
      (e) => {
        if (!mqDesktop.matches) return;

        const to = e.relatedTarget;
        if (isInsideDesktopMenu(to)) return;

        clearPendingOpens();
        mega?.scheduleClose();
      },
      { passive: true }
    );

    el.desktopMenu.addEventListener(
      "focusin",
      (e) => {
        if (!mqDesktop.matches) return;

        const item = e.target.closest("li.has-mega");
        if (!item) return;

        clearPendingOpens();
        mega?.cancelClose();
        mega?.openFor(item);
      },
      true
    );

    el.rootScroll?.addEventListener(
      "scroll",
      () => queueHintUpdate(el.rootScroll),
      { passive: true }
    );

    el.mobilePanels.addEventListener(
      "scroll",
      (e) => {
        const scroller = e.target?.closest?.(".submenu-scroll");
        if (scroller) queueHintUpdate(scroller);
      },
      { passive: true, capture: true }
    );

   let windowResizeRaf = null;

    window.addEventListener(
      "resize",
      () => {
        if (windowResizeRaf) return;

        windowResizeRaf = requestAnimationFrame(() => {
          windowResizeRaf = null;

          mega?.invalidateAllPanelHeights();

          syncCompactHeader();

          if (
            window.innerWidth > CONFIG.BREAKPOINT_PX &&
            el.mobileNav.classList.contains("active")
          ) {
            closeMobileNav();
            return;
          }

          if (el.mobileNav.classList.contains("active")) {
            syncDrawerHeaderHeights();
            syncFooterOffset();
          }
        });
      },
      { passive:true }
    );

    window.addEventListener("orientationchange", () => {
      mega?.invalidateAllPanelHeights();
      if (el.mobileNav.classList.contains("active")) {
        syncDrawerHeaderHeights();
        syncFooterOffset();
      }
    });
  }
})();