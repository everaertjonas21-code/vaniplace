const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navDropdown = document.querySelector(".nav-item-dropdown");
const navMoreButton = document.querySelector(".nav-more-btn");
const ORDER_CART_KEY = "vani_order_cart_v1";
let menuDataCache = null;
let renderedMenuItems = [];
let currentModalItem = null;
let currentModalQuantity = 1;
let currentMenuFeedbackNode = null;
let currentBreakfastReservation = null;
const BREAKFAST_RESERVATION_LEAD_MINUTES = 30;
const BREAKFAST_RESERVATION_MAX_DAYS_AHEAD = 14;
const BREAKFAST_RESERVATION_SLOT_INTERVAL_MINUTES = 15;
const BREAKFAST_RESERVATION_HOURS_BY_DAY = {
  0: null,
  1: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  2: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  3: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  4: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  5: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  6: { openMinutes: 8 * 60, closeMinutes: 14 * 60 + 30 }
};
const breakfastReservationUiState = {
  dayOptions: [],
  activeIndex: 0
};

function getCurrentLangCode() {
  if (typeof window.getCurrentLanguage === "function") {
    return window.getCurrentLanguage();
  }
  return "nl";
}

function getI18nText(key, fallback) {
  if (typeof window.i18nTranslate !== "function") return fallback;
  const value = window.i18nTranslate(key, getCurrentLangCode());
  return value && value !== key ? value : fallback;
}

function ensureOrderNavLink() {
  const langSwitch = document.querySelector(".lang-switch");
  const navbar = document.querySelector(".navbar");
  if (!langSwitch || !navbar || navbar.querySelector(".header-cart-link")) return;

  const cartLink = document.createElement("a");
  cartLink.className = "nav-link header-cart-link";
  cartLink.href = "order.html";
  cartLink.setAttribute("data-i18n", "nav.cart");
  cartLink.setAttribute("aria-label", getI18nText("nav.cart", "Winkelwagen"));
  cartLink.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h2l2.1 9.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>
      <circle cx="10" cy="19" r="1.7" fill="currentColor"></circle>
      <circle cx="17" cy="19" r="1.7" fill="currentColor"></circle>
    </svg>
    <span class="nav-cart-count" aria-hidden="true">0</span>
  `;

  langSwitch.insertAdjacentElement("afterend", cartLink);
}

ensureOrderNavLink();

const appStorage = (() => {
  try {
    localStorage.setItem("__vp_test__", "1");
    localStorage.removeItem("__vp_test__");
    return localStorage;
  } catch (error) {
    return sessionStorage;
  }
})();

const DEFAULT_SIZE_OPTIONS = [
  { id: "small", label: "Klein", delta: 0 },
  { id: "large", label: "Groot", delta: 1.0 }
];

const DEFAULT_EXTRA_GROUPS = [
  {
    title: "Saus en toppings",
    options: [
      { id: "smos", label: "Smos", price: 1.0 },
      { id: "sla", label: "Seldersla", price: 0.5 },
      { id: "boter", label: "Boter", price: 0 },
      { id: "ajuin", label: "Ajuin", price: 0.3 },
      { id: "gedroogde-ajuin", label: "Gedroogde ajuin", price: 0.3 },
      { id: "spek", label: "Spek", price: 1.0 },
      { id: "honing", label: "Honing", price: 0.5 },
      { id: "extra-pikant", label: "Extra pikant", price: 0 },
      { id: "mayonaise", label: "Mayonaise", price: 0.5 },
      { id: "tomaten-ketchup", label: "Tomaten ketchup", price: 0.5 },
      { id: "curry-ketchup", label: "Curry ketchup", price: 0.5 },
      { id: "andalouse", label: "Andalouse", price: 0.5 },
      { id: "tartare", label: "Tartare", price: 0.5 },
      { id: "barbecue", label: "Barbecue", price: 0.5 },
      { id: "curry", label: "Curry", price: 0.5 },
      { id: "currymayonaise", label: "Currymayonaise", price: 0.5 },
      { id: "bicky-geel", label: "Bicky saus geel", price: 0.5 },
      { id: "bicky-bruin", label: "Bicky saus bruin", price: 0.5 },
      { id: "samourai", label: "Samourai", price: 0.5 },
      { id: "mosterd", label: "Mosterd", price: 0.5 },
      { id: "mammouth", label: "Mammouth", price: 0.5 },
      { id: "hot-shot", label: "Hot shot", price: 0.5 },
      { id: "americaine", label: "Americaine", price: 0.5 },
      { id: "cocktail", label: "Cocktail", price: 0.5 },
      { id: "joppie", label: "Joppie", price: 0.5 }
    ]
  },
  {
    title: "Broodjes",
    options: [
      { id: "bruin-broodje", label: "Bruin broodje", price: 0.5 },
      { id: "glutenvrij-rond", label: "Glutenvrij rond broodje", price: 1.5 }
    ]
  }
];
let sizeOptionsState = DEFAULT_SIZE_OPTIONS;
let extraGroupsState = DEFAULT_EXTRA_GROUPS;
let extraOptionsState = extraGroupsState.flatMap((group) => group.options);
let orderOptionsLoadedPromise = null;

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      if (navDropdown) {
        navDropdown.classList.remove("is-open");
      }
      if (navMoreButton) {
        navMoreButton.setAttribute("aria-expanded", "false");
      }
    });
  });
}

if (navDropdown && navMoreButton) {
  navMoreButton.addEventListener("click", () => {
    const isOpen = navDropdown.classList.toggle("is-open");
    navMoreButton.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!navDropdown.contains(event.target)) {
      navDropdown.classList.remove("is-open");
      navMoreButton.setAttribute("aria-expanded", "false");
    }
  });
}

const page = document.body.dataset.page;
if (page) {
  const navPage = page;
  const links = Array.from(document.querySelectorAll(".nav-link"));
  const hasMatch = links.some((link) => {
    const href = link.getAttribute("href");
    return Boolean(href && href.includes(`${navPage}.html`));
  });

  if (hasMatch) {
    links.forEach((link) => {
      const href = link.getAttribute("href");
      const isActive = href && href.includes(`${navPage}.html`);
      link.classList.toggle("active", Boolean(isActive));
    });

    if (navMoreButton) {
      const dropdownHasActive = Array.from(document.querySelectorAll(".nav-dropdown-link")).some((link) =>
        link.classList.contains("active")
      );
      navMoreButton.classList.toggle("active", dropdownHasActive);
    }
  }
}

function getLocalizedValue(value, lang) {
  if (value && typeof value === "object") {
    return value[lang] ?? value.nl ?? value.en ?? "";
  }
  return value ?? "";
}

function getCartItemDisplayName(item) {
  return getLocalizedValue(item?.name, getLanguage()) || getLocalizedValue(item?.name, "nl") || String(item?.name || "");
}

function getSizeOptions() {
  const source = Array.isArray(sizeOptionsState) && sizeOptionsState.length ? sizeOptionsState : DEFAULT_SIZE_OPTIONS;
  return source.filter((option) => option?.available !== false);
}

function getExtraGroups() {
  const source = Array.isArray(extraGroupsState) && extraGroupsState.length ? extraGroupsState : DEFAULT_EXTRA_GROUPS;
  return source
    .map((group) => ({
      ...group,
      options: Array.isArray(group?.options) ? group.options.filter((option) => option?.available !== false) : []
    }))
    .filter((group) => group.options.length);
}

function getExtraOptions() {
  return getExtraGroups().flatMap((group) => group.options);
}

function isOrderOptionsDataValid(data) {
  return Boolean(data && Array.isArray(data.sizes) && data.sizes.length && Array.isArray(data.extraGroups) && data.extraGroups.length);
}

async function loadOrderOptions() {
  if (orderOptionsLoadedPromise) return orderOptionsLoadedPromise;

  orderOptionsLoadedPromise = fetch("/api/order-options", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Order options konden niet geladen worden");
      return response.json();
    })
    .then((data) => {
      if (!isOrderOptionsDataValid(data)) {
        throw new Error("Order options hebben een ongeldig formaat");
      }
      sizeOptionsState = data.sizes;
      extraGroupsState = data.extraGroups;
      extraOptionsState = data.extraGroups.flatMap((group) => group.options || []);
      return data;
    })
    .catch(() => ({
      sizes: getSizeOptions(),
      extraGroups: getExtraGroups()
    }));

  return orderOptionsLoadedPromise;
}

function getLanguage() {
  if (typeof window.getCurrentLanguage === "function") {
    return window.getCurrentLanguage();
  }
  return "nl";
}

function tr(key, fallback) {
  const lang = getLanguage();
  if (typeof window.i18nTranslate === "function") {
    const value = window.i18nTranslate(key, lang);
    if (value && value !== key) return value;
  }
  return fallback;
}

function ensureLegalLinksInFooters() {
  document.querySelectorAll(".footer-inner").forEach((footerInner) => {
    const infoBlock = footerInner.querySelector(":scope > div");
    if (!infoBlock) return;

    let legalNode = infoBlock.querySelector(".footer-legal");
    if (!legalNode) {
      infoBlock.insertAdjacentHTML("beforeend", "<p class=\"footer-legal\"></p>");
      legalNode = infoBlock.querySelector(".footer-legal");
    }

    if (!legalNode) return;
    legalNode.innerHTML = [
      `<a href="algemene-voorwaarden.html">${tr("legal.terms", "Algemene voorwaarden")}</a>`,
      `<a href="privacybeleid.html">${tr("legal.privacy", "Privacybeleid")}</a>`,
      `<a href="cookiebeleid.html">${tr("legal.cookies", "Cookiebeleid")}</a>`
    ].join("<span aria-hidden=\"true\">|</span>");
  });
}

function ensureOrderLegalNotice() {
  const legalNote = document.querySelector(".order-legal-note");
  if (!legalNote) return;

  const noticeTemplate = tr(
    "order.legalNotice",
    "Door je bestelling te plaatsen ga je akkoord met de {terms} en neem je kennis van het {privacy} en het {cookies}."
  );
  const termsLink = `<a href="algemene-voorwaarden.html">${tr("legal.terms", "Algemene voorwaarden")}</a>`;
  const privacyLink = `<a href="privacybeleid.html">${tr("legal.privacy", "Privacybeleid")}</a>`;
  const cookiesLink = `<a href="cookiebeleid.html">${tr("legal.cookies", "Cookiebeleid")}</a>`;

  legalNote.innerHTML = noticeTemplate
    .replace("{terms}", termsLink)
    .replace("{privacy}", privacyLink)
    .replace("{cookies}", cookiesLink);
}

function setupDeferredMaps() {
  document.querySelectorAll(".map-wrap[data-map-src]").forEach((mapWrap) => {
    if (mapWrap.dataset.mapReady === "1") return;

    const button = mapWrap.querySelector(".map-consent-btn");
    const mapSrc = mapWrap.dataset.mapSrc;
    if (!button || !mapSrc) return;

    button.addEventListener("click", () => {
      if (mapWrap.dataset.mapReady === "1") return;

      mapWrap.innerHTML = `
        <iframe
          title="Google Maps locatie Vani's Place"
          src="${mapSrc}"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen>
        </iframe>
      `;
      mapWrap.dataset.mapReady = "1";
    });
  });
}

function parseEuroPrice(input) {
  const match = String(input || "").replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function formatEuroPrice(value) {
  return `EUR ${Number(value || 0).toFixed(2).replace(".", ",")}`;
}

function parseLinePrice(value) {
  const normalized = String(value || "").replace(",", ".");
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function getDefaultMenuData() {
  const hasDefaults =
    typeof MENU_ITEMS !== "undefined" &&
    typeof MENU_CATEGORIES !== "undefined" &&
    Array.isArray(MENU_ITEMS) &&
    Array.isArray(MENU_CATEGORIES);

  if (!hasDefaults) return { items: [], categories: [] };

  return {
    items: MENU_ITEMS,
    categories: MENU_CATEGORIES
  };
}

function getCart() {
  try {
    const raw = appStorage.getItem(ORDER_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
  }

  try {
    const cookieMatch = document.cookie.split("; ").find((entry) => entry.startsWith(`${ORDER_CART_KEY}=`));
    if (!cookieMatch) return [];
    const cookieValue = decodeURIComponent(cookieMatch.split("=").slice(1).join("="));
    const parsed = JSON.parse(cookieValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeCartCookie(cookieKey, serialized) {
  const attributes = [
    "Path=/",
    `Max-Age=${60 * 60 * 24 * 7}`,
    "SameSite=Lax",
    window.location.protocol === "https:" ? "Secure" : ""
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = `${cookieKey}=${encodeURIComponent(serialized)}; ${attributes}`;
}

function setCart(cart) {
  const serialized = JSON.stringify(cart);
  try {
    appStorage.setItem(ORDER_CART_KEY, serialized);
  } catch (error) {
  }
  writeCartCookie(ORDER_CART_KEY, serialized);
}

function getCartItemCount() {
  return getCart().reduce((total, item) => total + (Number(item.quantity) || 0), 0);
}

function getCartSubtotal() {
  return getCart().reduce((total, item) => {
    const unit = parseLinePrice(item.price);
    const qty = Number(item.quantity) || 0;
    return total + unit * qty;
  }, 0);
}

function updateMenuCartCount() {
  // Header cart badge removed from layout; floating badge is used instead.
}

function ensureCartShortcut() {
  return;
}

function updateCartShortcut() {
  return;
}

function updateOrderNavLinkCount() {
  const navCartLink = document.querySelector(".header-cart-link");
  const countNode = document.querySelector(".nav-cart-count");
  if (!navCartLink || !countNode) return;

  const totalCount = getCartItemCount();
  countNode.textContent = String(totalCount);
  navCartLink.classList.toggle("has-items", totalCount > 0);
  countNode.classList.toggle("is-visible", totalCount > 0);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function renderCartPreview() {
  const list = document.querySelector("#cart-preview-items");
  const empty = document.querySelector("#cart-preview-empty");
  const total = document.querySelector("#cart-preview-total");
  if (!list || !empty || !total) return;

  const cart = getCart();
  const totalCount = getCartItemCount();
  const subtotal = getCartSubtotal();
  const itemWord = totalCount === 1 ? tr("ui.itemSingular", "item") : tr("ui.itemPlural", "items");
  total.textContent = `${totalCount} ${itemWord} | ${tr("ui.subtotal", "Subtotaal")} ${formatEuroPrice(subtotal)}`;

  if (!cart.length) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";
  list.innerHTML = cart
    .map((item, index) => {
      return `
        <div class="cart-preview-item" data-index="${index}">
          <div class="cart-preview-top">
            <div>
              <p class="cart-preview-title">${escapeHtml(getCartItemDisplayName(item))}</p>
              <p class="cart-preview-price">${escapeHtml(item.price || "")}</p>
            </div>
            <div class="cart-preview-actions">
              <button type="button" data-action="decrease" data-index="${index}">-</button>
              <span>${Number(item.quantity) || 1}</span>
              <button type="button" data-action="increase" data-index="${index}">+</button>
              <button type="button" data-action="remove" data-index="${index}">x</button>
            </div>
          </div>
          <input class="cart-preview-note" type="text" data-action="note" data-index="${index}" value="${escapeHtml(item.changeRequest || "")}" placeholder="${escapeHtml(tr("ui.extraWishes", "Extra wensen voor dit broodje"))}" />
        </div>
      `;
    })
    .join("");
}

function addCustomItemToCart(item, config) {
  const baseName = getLocalizedValue(item.name, "nl") || getLocalizedValue(item.name, "en") || "Broodje";
  const signature = JSON.stringify({
    name: baseName,
    size: config.sizeId,
    extras: config.extras.map((extra) => extra.id),
    note: config.note,
    unitPrice: config.unitPrice
  });
  const itemId = `${item.category}|${signature}`;
  const cart = getCart();
  const existing = cart.find((entry) => entry.id === itemId);

  if (existing) {
    existing.quantity += config.quantity;
  } else {
    cart.push({
      id: itemId,
      category: item.category,
      name: baseName,
      price: formatEuroPrice(config.unitPrice),
      quantity: config.quantity,
      changeRequest: config.changeSummary,
      customization: {
        basePrice: config.basePrice,
        sizeId: config.sizeId,
        extraIds: config.extras.map((extra) => extra.id),
        note: config.note
      }
    });
  }

  setCart(cart);
}

function addFixedItemToCart(itemConfig) {
  const quantity = Math.max(1, Number(itemConfig.quantity) || 1);
  const suffix = String(itemConfig.idSuffix || "").trim();
  const itemId = `${itemConfig.category}|${itemConfig.key}${suffix ? `|${suffix}` : ""}`;
  const cart = getCart();
  const existing = cart.find((entry) => entry.id === itemId);

  if (existing) {
    existing.quantity = (existing.quantity || 1) + quantity;
  } else {
    cart.push({
      id: itemId,
      category: itemConfig.category,
      name: itemConfig.name,
      price: itemConfig.price,
      quantity,
      changeRequest: itemConfig.changeRequest || "",
      customizationMode: "fixed",
      reservationDetails: itemConfig.reservationDetails || null
    });
  }

  setCart(cart);
}

function getLocalizedBundleFromI18nKey(key, fallbackNl) {
  const fallback = String(fallbackNl || "").trim();
  const readTranslation = (lang) => {
    if (typeof window.i18nTranslate !== "function") return fallback;
    const value = window.i18nTranslate(key, lang);
    return value && value !== key ? value : fallback;
  };

  return {
    nl: readTranslation("nl"),
    en: readTranslation("en"),
    fr: readTranslation("fr")
  };
}

function breakfastStartOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function breakfastRoundUpMinutes(minutes, step) {
  return Math.ceil(minutes / step) * step;
}

function formatBreakfastTimeFromMinutes(totalMinutes) {
  const safeMinutes = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getBreakfastReservationDateValue(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatBreakfastDayButtonLabel(date, dayOffset) {
  if (dayOffset === 0) return tr("order.day.today", "Vandaag");
  if (dayOffset === 1) return tr("order.day.tomorrow", "Morgen");
  if (dayOffset === 2) return tr("order.day.dayAfter", "Overmorgen");

  try {
    return new Intl.DateTimeFormat(getLanguage(), {
      weekday: "short",
      day: "2-digit",
      month: "2-digit"
    }).format(date);
  } catch (error) {
    return formatBreakfastReservationDate(getBreakfastReservationDateValue(date));
  }
}

function getBreakfastReservationSlotsForDate(date) {
  const schedule = BREAKFAST_RESERVATION_HOURS_BY_DAY[date.getDay()];
  if (!schedule) return [];

  let startMinutes = schedule.openMinutes;
  const now = new Date();
  if (breakfastStartOfLocalDay(now).getTime() === breakfastStartOfLocalDay(date).getTime()) {
    const minimumMinutes = now.getHours() * 60 + now.getMinutes() + BREAKFAST_RESERVATION_LEAD_MINUTES;
    startMinutes = Math.max(startMinutes, breakfastRoundUpMinutes(minimumMinutes, BREAKFAST_RESERVATION_SLOT_INTERVAL_MINUTES));
  }

  const slots = [];
  for (let minute = startMinutes; minute <= schedule.closeMinutes; minute += BREAKFAST_RESERVATION_SLOT_INTERVAL_MINUTES) {
    const label = formatBreakfastTimeFromMinutes(minute);
    slots.push({ value: label, label });
  }

  return slots;
}

function getBreakfastReservationDayOptions() {
  const today = breakfastStartOfLocalDay(new Date());
  const options = [];

  for (let offset = 0; offset <= BREAKFAST_RESERVATION_MAX_DAYS_AHEAD; offset += 1) {
    const date = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);
    const slots = getBreakfastReservationSlotsForDate(date);
    if (!slots.length) continue;

    options.push({
      dayOffset: offset,
      date,
      value: getBreakfastReservationDateValue(date),
      label: formatBreakfastDayButtonLabel(date, offset)
    });
  }

  return options;
}

function renderBreakfastReservationUi() {
  const dayButtonsWrap = document.getElementById("breakfast-reservation-day-buttons");
  const timeSelect = document.getElementById("breakfast-reservation-time");
  const helper = document.getElementById("breakfast-reservation-helper");
  if (!dayButtonsWrap || !timeSelect || !helper) return;

  const dayOptions = breakfastReservationUiState.dayOptions;
  if (!dayOptions.length) {
    dayButtonsWrap.innerHTML = "";
    timeSelect.innerHTML = `<option value="">${tr("breakfast.modalNoTimes", "Geen uren beschikbaar")}</option>`;
    timeSelect.disabled = true;
    helper.textContent = tr("breakfast.modalNoDates", "Er zijn momenteel geen geldige reservatiedagen beschikbaar.");
    return;
  }

  if (!dayOptions[breakfastReservationUiState.activeIndex]) {
    breakfastReservationUiState.activeIndex = 0;
  }

  const activeDay = dayOptions[breakfastReservationUiState.activeIndex];
  const slots = getBreakfastReservationSlotsForDate(activeDay.date);

  dayButtonsWrap.innerHTML = dayOptions
    .map((option, index) => {
      const activeClass = index === breakfastReservationUiState.activeIndex ? " is-active" : "";
      return `<button type="button" class="pickup-day-btn breakfast-reservation-day-btn${activeClass}" data-breakfast-day-index="${index}" role="tab" aria-selected="${index === breakfastReservationUiState.activeIndex ? "true" : "false"}">${option.label}</button>`;
    })
    .join("");

  timeSelect.disabled = !slots.length;
  timeSelect.innerHTML = slots.length
    ? slots.map((slot) => `<option value="${slot.value}">${slot.label}</option>`).join("")
    : `<option value="">${tr("breakfast.modalNoTimes", "Geen uren beschikbaar")}</option>`;

  helper.textContent = tr("breakfast.modalHelper", "Reservaties zijn mogelijk tijdens de openingsuren. Zondag gesloten.");
}

function formatBreakfastReservationDate(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return raw;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  try {
    return new Intl.DateTimeFormat(getLanguage(), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  } catch (error) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
}

function sanitizeReservationIdPart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 80);
}

function updateBreakfastReservationButtonLabel() {
  const confirmButton = document.getElementById("breakfast-reservation-confirm");
  const personsInput = document.getElementById("breakfast-reservation-persons");
  if (!confirmButton || !personsInput || !currentBreakfastReservation) return;

  const persons = Math.max(1, Number(personsInput.value) || 1);
  const total = parseEuroPrice(currentBreakfastReservation.price) * persons;
  confirmButton.textContent = `${tr("breakfast.modalConfirm", "Voeg reservatie toe")} | ${formatEuroPrice(total)}`;
}

function closeBreakfastReservationModal() {
  const modal = document.getElementById("breakfast-reservation-modal");
  const feedback = document.getElementById("breakfast-reservation-feedback");
  if (!modal) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  currentBreakfastReservation = null;
  if (feedback) {
    feedback.textContent = "";
  }
}

function openBreakfastReservationModal(config) {
  const modal = document.getElementById("breakfast-reservation-modal");
  const title = document.getElementById("breakfast-reservation-title");
  const priceBadge = document.getElementById("breakfast-reservation-price");
  const timeInput = document.getElementById("breakfast-reservation-time");
  const personsInput = document.getElementById("breakfast-reservation-persons");
  const noteInput = document.getElementById("breakfast-reservation-note");
  const feedback = document.getElementById("breakfast-reservation-feedback");
  if (!modal || !title || !priceBadge || !timeInput || !personsInput || !noteInput || !feedback) return;

  currentBreakfastReservation = config;
  title.textContent = getLocalizedValue(config.localizedName, getLanguage()) || config.fallbackTitle;
  priceBadge.textContent = `${config.price} ${tr("breakfast.perPerson", "p.p.")}`;
  feedback.textContent = "";
  noteInput.value = "";
  personsInput.value = "2";

  breakfastReservationUiState.dayOptions = getBreakfastReservationDayOptions();
  const tomorrowIndex = breakfastReservationUiState.dayOptions.findIndex((option) => option.dayOffset === 1);
  breakfastReservationUiState.activeIndex = tomorrowIndex >= 0 ? tomorrowIndex : 0;
  renderBreakfastReservationUi();

  updateBreakfastReservationButtonLabel();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function setupBreakfastReservationModal() {
  const modal = document.getElementById("breakfast-reservation-modal");
  const closeButton = document.getElementById("breakfast-reservation-close");
  const cancelButton = document.getElementById("breakfast-reservation-cancel");
  const confirmButton = document.getElementById("breakfast-reservation-confirm");
  const dayButtonsWrap = document.getElementById("breakfast-reservation-day-buttons");
  const timeInput = document.getElementById("breakfast-reservation-time");
  const personsInput = document.getElementById("breakfast-reservation-persons");
  const noteInput = document.getElementById("breakfast-reservation-note");
  const feedbackNode = document.getElementById("breakfast-order-feedback");
  const modalFeedback = document.getElementById("breakfast-reservation-feedback");
  if (!modal || !closeButton || !cancelButton || !confirmButton || !dayButtonsWrap || !timeInput || !personsInput || !noteInput) return;
  if (modal.dataset.bound === "1") return;
  modal.dataset.bound = "1";

  const close = () => closeBreakfastReservationModal();

  closeButton.addEventListener("click", close);
  cancelButton.addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.closeBreakfastReservation === "true") {
      close();
    }
  });

  personsInput.addEventListener("input", () => {
    const safeValue = Math.max(1, Math.min(30, Number(personsInput.value) || 1));
    personsInput.value = String(safeValue);
    updateBreakfastReservationButtonLabel();
  });
  timeInput.addEventListener("input", updateBreakfastReservationButtonLabel);
  dayButtonsWrap.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest(".breakfast-reservation-day-btn");
    if (!button) return;
    const index = Number(button.dataset.breakfastDayIndex);
    if (Number.isNaN(index) || !breakfastReservationUiState.dayOptions[index]) return;
    breakfastReservationUiState.activeIndex = index;
    renderBreakfastReservationUi();
  });

  confirmButton.addEventListener("click", () => {
    if (!currentBreakfastReservation || !modalFeedback) return;

    const activeDay = breakfastReservationUiState.dayOptions[breakfastReservationUiState.activeIndex];
    const dateValue = String(activeDay?.value || "").trim();
    const timeValue = String(timeInput.value || "").trim();
    const persons = Math.max(1, Number(personsInput.value) || 0);
    const note = noteInput.value.trim();

    if (!dateValue || !timeValue || !persons) {
      modalFeedback.textContent = tr("breakfast.modalErrorRequired", "Kies een datum, uur en aantal personen.");
      return;
    }

    const reservationDate = new Date(`${dateValue}T${timeValue}`);
    if (Number.isNaN(reservationDate.getTime()) || reservationDate.getTime() <= Date.now()) {
      modalFeedback.textContent = tr("breakfast.modalErrorFuture", "Kies een reservatiemoment in de toekomst.");
      return;
    }

    const summaryParts = [
      tr("breakfast.modalReservation", "Ontbijtreservatie"),
      `${tr("breakfast.modalSummaryDate", "Datum")}: ${formatBreakfastReservationDate(dateValue)}`,
      `${tr("breakfast.modalSummaryTime", "Uur")}: ${timeValue}`,
      `${tr("breakfast.modalSummaryPersons", "Personen")}: ${persons}`
    ];

    if (note) {
      summaryParts.push(`${tr("breakfast.modalSummaryNote", "Wens")}: ${note}`);
    }

    addFixedItemToCart({
      key: currentBreakfastReservation.key,
      idSuffix: [dateValue, timeValue, sanitizeReservationIdPart(note)].filter(Boolean).join("_"),
      category: "ontbijtformules",
      name: currentBreakfastReservation.localizedName,
      price: currentBreakfastReservation.price,
      quantity: persons,
      changeRequest: summaryParts.join(" | "),
      reservationDetails: {
        date: dateValue,
        time: timeValue,
        persons,
        note
      }
    });

    updateCartShortcut();
    updateOrderNavLinkCount();
    if (feedbackNode) {
      const currentName = getLocalizedValue(currentBreakfastReservation.localizedName, getLanguage()) || currentBreakfastReservation.fallbackTitle;
      feedbackNode.textContent = `${currentName} ${tr("breakfast.addedToCart", "toegevoegd aan winkelmand.")}`;
    }

    close();
  });
}

function setupBreakfastOrderButtons() {
  const buttons = document.querySelectorAll(".breakfast-order-btn");
  if (!buttons.length) return;

  buttons.forEach((button) => {
    if (button.dataset.bound === "1") return;
    button.dataset.bound = "1";

    button.addEventListener("click", () => {
      const breakfastKey = String(button.dataset.breakfastKey || "").trim();
      const price = String(button.dataset.breakfastPrice || "").trim();
      if (!breakfastKey || !price) return;

      const titleKey = `breakfast.${breakfastKey}.title`;
      const fallbackTitle = button.closest(".formula-card")?.querySelector("h2")?.textContent?.trim() || "Ontbijtformule";
      const localizedName = getLocalizedBundleFromI18nKey(titleKey, fallbackTitle);

      openBreakfastReservationModal({
        key: breakfastKey,
        fallbackTitle,
        localizedName,
        price,
      });
    });
  });
}

function isMenuDataValid(data) {
  return Boolean(data && Array.isArray(data.items) && Array.isArray(data.categories));
}

async function fetchMenuDataFromApi() {
  const response = await fetch("/api/menu-data", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Menu data kon niet geladen worden");
  }
  const data = await response.json();
  if (!isMenuDataValid(data)) {
    throw new Error("Menu data heeft een ongeldig formaat");
  }
  return data;
}

async function resolveMenuData() {
  if (menuDataCache) return menuDataCache;
  try {
    menuDataCache = await fetchMenuDataFromApi();
  } catch (error) {
    const fallback = getDefaultMenuData();
    if (!fallback.items.length || !fallback.categories.length) {
      throw error;
    }
    menuDataCache = fallback;
  }
  return menuDataCache;
}

function renderMenuCards(items, lang) {
  const menuGrid = document.querySelector("#menu-grid");
  if (!menuGrid) return;
  renderedMenuItems = items;
  menuGrid.innerHTML = "";

  items.forEach((item, index) => {
    const status = String(getLocalizedValue(item.status, lang) || "").trim();
    const isAvailable = item.available !== false;
    const badgeHtml = status
      ? `<span class="sandwich-badge">${escapeHtml(status)}</span>`
      : "";
    const buttonLabel = isAvailable ? tr("ui.choose", "Kies") : tr("ui.unavailable", "Niet beschikbaar");
    const buttonDisabled = isAvailable ? "" : " disabled aria-disabled=\"true\"";
    const cardClass = isAvailable ? "" : " is-unavailable";

    const cardHtml = `
      <article class="menu-card sandwich-card reveal${cardClass}" data-category="${escapeHtml(item.category)}">
        <div class="sandwich-card-head">
          ${badgeHtml}
          <h3>${escapeHtml(getLocalizedValue(item.name, lang))}</h3>
        </div>
        <p>${escapeHtml(getLocalizedValue(item.description, lang))}</p>
        <div class="menu-card-footer">
          <span class="price">${escapeHtml(item.price)}</span>
          <button class="btn btn-primary menu-add-btn" type="button" data-menu-index="${index}"${buttonDisabled}>${escapeHtml(buttonLabel)}</button>
        </div>
      </article>
    `;

    menuGrid.insertAdjacentHTML("beforeend", cardHtml);
  });
}

function renderMenuFilters(categories, lang) {
  const filterBar = document.querySelector("#menu-filters");
  if (!filterBar) return;

  const allText = typeof window.i18nTranslate === "function" ? window.i18nTranslate("menu.filterAll", lang) : "Alles";
  const allButton = `<button class="filter-btn is-active" data-filter="all">${escapeHtml(allText)}</button>`;
  const categoryButtons = categories
    .map((category) => `<button class="filter-btn" data-filter="${escapeHtml(category.id)}">${escapeHtml(getLocalizedValue(category.label, lang))}</button>`)
    .join("");

  filterBar.innerHTML = `${allButton}${categoryButtons}`;
}

function setupMenuFiltering() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const menuCards = document.querySelectorAll(".menu-card");
  if (!filterButtons.length || !menuCards.length) return;

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      filterButtons.forEach((btn) => btn.classList.remove("is-active"));
      button.classList.add("is-active");

      menuCards.forEach((card) => {
        const category = card.dataset.category;
        const show = filter === "all" || category === filter;
        card.classList.toggle("is-hidden", !show);
      });
    });
  });
}

function getSelectedExtrasFromModal() {
  const checked = Array.from(document.querySelectorAll("#menu-modal-extras input[type='checkbox']:checked"));
  return checked
    .map((input) => getExtraOptions().find((extra) => extra.id === input.value))
    .filter(Boolean);
}

function getSelectedSizeFromModal() {
  const selected = document.querySelector("#menu-modal-sizes input[type='radio']:checked");
  const currentSizeOptions = getSizeOptions();
  const size = currentSizeOptions.find((option) => option.id === (selected ? selected.value : "small"));
  return (
    size ||
    currentSizeOptions[0] || {
      id: "default",
      label: { nl: "Standaard", en: "Standard", fr: "Standard" },
      delta: 0
    }
  );
}

function updateModalAddButtonLabel() {
  const button = document.getElementById("menu-modal-add-btn");
  if (!button || !currentModalItem) return;

  const base = parseEuroPrice(currentModalItem.price);
  const size = getSelectedSizeFromModal();
  const extras = getSelectedExtrasFromModal();
  const extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
  const total = (base + size.delta + extrasTotal) * currentModalQuantity;
  button.textContent = `${tr("ui.addToCart", "Aan winkelwagen toevoegen")} | ${formatEuroPrice(total)}`;
}

function closeMenuItemModal() {
  const modal = document.getElementById("menu-item-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  currentModalItem = null;
}

function openMenuItemModal(item) {
  const modal = document.getElementById("menu-item-modal");
  const title = document.getElementById("menu-modal-title");
  const description = document.getElementById("menu-modal-description");
  const sizesContainer = document.getElementById("menu-modal-sizes");
  const extrasContainer = document.getElementById("menu-modal-extras");
  const note = document.getElementById("menu-modal-note");
  const qtyValue = document.getElementById("menu-modal-qty-value");
  if (!modal || !title || !description || !sizesContainer || !extrasContainer || !note || !qtyValue) return;

  currentModalItem = item;
  currentModalQuantity = 1;
  title.textContent = getLocalizedValue(item.name, getLanguage());
  description.textContent = getLocalizedValue(item.description, getLanguage());
  note.value = "";
  qtyValue.textContent = "1";

  const currentSizeOptions = getSizeOptions();
  const currentExtraGroups = getExtraGroups();

  sizesContainer.innerHTML = currentSizeOptions.map((option, index) => {
    const priceLabel = option.delta > 0 ? `(+${formatEuroPrice(option.delta)})` : "";
    return `
      <label class="menu-modal-option">
        <input type="radio" name="menu-size" value="${option.id}" ${index === 0 ? "checked" : ""} />
        <span>${getLocalizedValue(option.label, getLanguage())} ${priceLabel}</span>
      </label>
    `;
  }).join("");

  extrasContainer.innerHTML = currentExtraGroups.map((group) => {
    const optionsHtml = group.options
      .map((extra) => {
        const priceLabel = extra.price > 0 ? `(+${formatEuroPrice(extra.price)})` : "";
        return `
          <label class="menu-modal-option">
            <input type="checkbox" value="${extra.id}" />
            <span>${escapeHtml(getLocalizedValue(extra.label, getLanguage()))} ${priceLabel}</span>
          </label>
        `;
      })
      .join("");
    return `
      <div class="menu-modal-group">
        <p class="menu-modal-group-title">${escapeHtml(getLocalizedValue(group.title, getLanguage()))}</p>
        ${optionsHtml}
      </div>
    `;
  }).join("");

  const enforceMaxExtras = () => {
    const checked = document.querySelectorAll("#menu-modal-extras input[type='checkbox']:checked");
    const all = document.querySelectorAll("#menu-modal-extras input[type='checkbox']");
    const atLimit = checked.length >= 10;
    all.forEach((input) => {
      if (!input.checked) input.disabled = atLimit;
    });
    updateModalAddButtonLabel();
  };

  sizesContainer.onchange = updateModalAddButtonLabel;
  extrasContainer.onchange = enforceMaxExtras;
  enforceMaxExtras();

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function setupMenuModal() {
  const modal = document.getElementById("menu-item-modal");
  const closeBtn = document.getElementById("menu-modal-close");
  const minus = document.getElementById("menu-modal-qty-minus");
  const plus = document.getElementById("menu-modal-qty-plus");
  const qtyValue = document.getElementById("menu-modal-qty-value");
  const addButton = document.getElementById("menu-modal-add-btn");
  const note = document.getElementById("menu-modal-note");
  if (!modal || !closeBtn || !minus || !plus || !qtyValue || !addButton || !note) return;

  closeBtn.addEventListener("click", closeMenuItemModal);

  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.closeModal === "true") {
      closeMenuItemModal();
    }
  });

  minus.addEventListener("click", () => {
    currentModalQuantity = Math.max(1, currentModalQuantity - 1);
    qtyValue.textContent = String(currentModalQuantity);
    updateModalAddButtonLabel();
  });

  plus.addEventListener("click", () => {
    currentModalQuantity += 1;
    qtyValue.textContent = String(currentModalQuantity);
    updateModalAddButtonLabel();
  });

  addButton.addEventListener("click", () => {
    if (!currentModalItem) return;
    const size = getSelectedSizeFromModal();
    const extras = getSelectedExtrasFromModal();
    const noteText = note.value.trim();
    const base = parseEuroPrice(currentModalItem.price);
    const unitPrice = base + size.delta + extras.reduce((sum, extra) => sum + extra.price, 0);
    const extraNames = extras.map((extra) => getLocalizedValue(extra.label, "nl"));
    const parts = [`Formaat: ${getLocalizedValue(size.label, "nl")}`];
    if (extraNames.length) parts.push(`Extras: ${extraNames.join(", ")}`);
    if (noteText) parts.push(`Wens: ${noteText}`);

    addCustomItemToCart(currentModalItem, {
      basePrice: base,
      sizeId: size.id,
      extras,
      note: noteText,
      quantity: currentModalQuantity,
      unitPrice,
      changeSummary: parts.join(" | ")
    });

    updateMenuCartCount();
    updateCartShortcut();

    if (currentMenuFeedbackNode) {
      currentMenuFeedbackNode.textContent = `${getLocalizedValue(currentModalItem.name, getLanguage())} ${tr("ui.addedToCart", "toegevoegd aan winkelmand.")}`;
    }

    closeMenuItemModal();
  });
}

function setupMenuAddButtons() {
  const menuGrid = document.querySelector("#menu-grid");
  const feedback = document.querySelector("#menu-cart-feedback");
  if (!menuGrid || menuGrid.dataset.addBound === "1") return;
  menuGrid.dataset.addBound = "1";
  currentMenuFeedbackNode = feedback;

  menuGrid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest(".menu-add-btn");
    if (!button) return;

    const index = Number(button.dataset.menuIndex);
    if (Number.isNaN(index)) return;
    const item = renderedMenuItems[index];
    if (!item || item.available === false) return;

    openMenuItemModal(item);
  });
}

if (page === "menu") {
  const renderMenu = async () => {
    try {
      menuDataCache = null;
      const [data] = await Promise.all([resolveMenuData(), loadOrderOptions()]);
      if (!data.items.length || !data.categories.length) return;
      const lang = getLanguage();
      renderMenuFilters(data.categories, lang);
      renderMenuCards(data.items, lang);
      setupMenuFiltering();
      setupMenuAddButtons();
      updateMenuCartCount();
      updateCartShortcut();
    } catch (error) {
      const menuGrid = document.querySelector("#menu-grid");
      const filterBar = document.querySelector("#menu-filters");
      if (filterBar) filterBar.innerHTML = "";
      if (menuGrid) {
        menuGrid.innerHTML = `
          <article class="menu-card sandwich-card">
            <div class="sandwich-card-head">
              <h3>${escapeHtml(tr("ui.error", "Fout"))}</h3>
            </div>
            <p>${escapeHtml(tr("menu.loadError", "Het menu kon niet geladen worden. Probeer later opnieuw."))}</p>
          </article>
        `;
      }
    }
  };

  setupMenuModal();
  renderMenu();
  document.addEventListener("languageChanged", renderMenu);
  window.addEventListener("storage", (event) => {
    if (event.key === ORDER_CART_KEY) {
      updateMenuCartCount();
      updateCartShortcut();
    }
  });
}

window.getVpOrderOptions = () => ({
  sizeOptions: getSizeOptions(),
  extraGroups: getExtraGroups(),
  extraOptions: getExtraOptions()
});
window.loadVpOrderOptions = loadOrderOptions;

ensureCartShortcut();
ensureLegalLinksInFooters();
ensureOrderLegalNotice();
setupDeferredMaps();
setupBreakfastReservationModal();
setupBreakfastOrderButtons();
updateCartShortcut();
updateOrderNavLinkCount();
loadOrderOptions();
window.addEventListener("focus", () => {
  updateCartShortcut();
  updateOrderNavLinkCount();
});
window.addEventListener("storage", (event) => {
  if (event.key === ORDER_CART_KEY) {
    updateCartShortcut();
    updateOrderNavLinkCount();
  }
});
document.addEventListener("languageChanged", ensureLegalLinksInFooters);
document.addEventListener("languageChanged", ensureOrderLegalNotice);
document.addEventListener("languageChanged", () => {
  const cartLink = document.querySelector(".header-cart-link");
  if (cartLink) {
    cartLink.setAttribute("aria-label", getI18nText("nav.cart", "Winkelwagen"));
  }
  if (currentBreakfastReservation) {
    const title = document.getElementById("breakfast-reservation-title");
    const priceBadge = document.getElementById("breakfast-reservation-price");
    if (title) {
      title.textContent = getLocalizedValue(currentBreakfastReservation.localizedName, getLanguage()) || currentBreakfastReservation.fallbackTitle;
    }
    if (priceBadge) {
      priceBadge.textContent = `${currentBreakfastReservation.price} ${tr("breakfast.perPerson", "p.p.")}`;
    }
    renderBreakfastReservationUi();
    updateBreakfastReservationButtonLabel();
  }
});

