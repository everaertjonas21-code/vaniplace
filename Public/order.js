const ORDER_CART_KEY_ORDER = "vani_order_cart_v1";
const orderStorage = (() => {
  try {
    localStorage.setItem("__vp_test__", "1");
    localStorage.removeItem("__vp_test__");
    return localStorage;
  } catch (error) {
    return sessionStorage;
  }
})();

const DEFAULT_ORDER_SIZE_OPTIONS = [
  { id: "small", label: "Klein", delta: 0 },
  { id: "large", label: "Groot", delta: 1.0 }
];

const DEFAULT_ORDER_EXTRA_GROUPS = [
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
let currentEditIndex = -1;
const pickupUiState = {
  initialized: false,
  dayOptions: [],
  activeIndex: 0
};
const PICKUP_MIN_LEAD_MINUTES = 10;
const PICKUP_MAX_DAYS_AHEAD = 2;
const PICKUP_SLOT_INTERVAL_MINUTES = 15;
const PICKUP_HOURS_BY_DAY = {
  0: null,
  1: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  2: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  3: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  4: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  5: { openMinutes: 7 * 60 + 30, closeMinutes: 14 * 60 + 30 },
  6: { openMinutes: 8 * 60, closeMinutes: 14 * 60 + 30 }
};

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

function getLocalizedOptionValue(value, lang = getLanguage()) {
  if (value && typeof value === "object") {
    return value[lang] ?? value.nl ?? value.en ?? value.fr ?? "";
  }
  return value ?? "";
}

function getOrderOptionsState() {
  if (typeof window.getVpOrderOptions === "function") {
    const state = window.getVpOrderOptions();
    if (state && Array.isArray(state.sizeOptions) && Array.isArray(state.extraGroups) && Array.isArray(state.extraOptions)) {
      return state;
    }
  }

  return {
    sizeOptions: DEFAULT_ORDER_SIZE_OPTIONS,
    extraGroups: DEFAULT_ORDER_EXTRA_GROUPS,
    extraOptions: DEFAULT_ORDER_EXTRA_GROUPS.flatMap((group) => group.options)
  };
}

function parseLinePrice(value) {
  const normalized = String(value || "").replace(",", ".");
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function formatEuroPrice(value) {
  return `EUR ${Number(value || 0).toFixed(2).replace(".", ",")}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateTimeLocalValue(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateLabel(date, dayOffset) {
  if (dayOffset === 0) return tr("order.day.today", "Vandaag");
  if (dayOffset === 1) return tr("order.day.tomorrow", "Morgen");
  if (dayOffset === 2) return tr("order.day.dayAfter", "Overmorgen");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function formatTimeFromMinutes(totalMinutes) {
  const safeMinutes = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function roundUpMinutes(minutes, step) {
  return Math.ceil(minutes / step) * step;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function parseDateTimeLocalValue(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute
  ) {
    return null;
  }

  return parsed;
}

function getPickupValidationError(dateValue) {
  const parsed = parseDateTimeLocalValue(dateValue);
  if (!parsed) return tr("order.error.invalidDate", "Kies een geldige datum en tijd voor afhaling.");

  const todayStart = startOfLocalDay(new Date());
  const pickupStart = startOfLocalDay(parsed);
  const dayDiff = Math.round((pickupStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
  if (dayDiff < 0) {
    return tr("order.error.futureOnly", "Kies een ophaaltijd in de toekomst.");
  }
  if (dayDiff > PICKUP_MAX_DAYS_AHEAD) {
    return `${tr("order.error.withinDays", "Kies een ophaaldag binnen")} ${PICKUP_MAX_DAYS_AHEAD + 1} ${tr("order.error.days", "dagen")}.`;
  }

  const now = new Date();
  const minimum = new Date(now.getTime() + PICKUP_MIN_LEAD_MINUTES * 60 * 1000);
  if (parsed.getTime() < minimum.getTime()) {
    return `${tr("order.error.minLead", "Kies een ophaaltijd minstens")} ${PICKUP_MIN_LEAD_MINUTES} ${tr("order.error.minutesFuture", "minuten in de toekomst")}.`;
  }

  const schedule = PICKUP_HOURS_BY_DAY[parsed.getDay()];
  if (!schedule) {
    return tr("order.error.sundayClosed", "Op zondag zijn we gesloten. Kies een andere dag.");
  }

  const minutesInDay = parsed.getHours() * 60 + parsed.getMinutes();
  if (minutesInDay < schedule.openMinutes || minutesInDay > schedule.closeMinutes) {
    return tr("order.error.openingHours", "Kies een ophaaltijd binnen de openingsuren.");
  }

  return "";
}

function getPickupDayOptions() {
  const now = new Date();
  const base = startOfLocalDay(now);
  const options = [];

  for (let offset = 0; offset <= PICKUP_MAX_DAYS_AHEAD; offset += 1) {
    const dayDate = new Date(base.getTime() + offset * 24 * 60 * 60 * 1000);
    options.push({
      dayOffset: offset,
      date: dayDate,
      label: formatDateLabel(dayDate, offset)
    });
  }

  return options;
}

function getPickupSlotsForDate(date) {
  const schedule = PICKUP_HOURS_BY_DAY[date.getDay()];
  if (!schedule) return [];

  let startMinutes = schedule.openMinutes;
  const now = new Date();
  if (startOfLocalDay(now).getTime() === startOfLocalDay(date).getTime()) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + PICKUP_MIN_LEAD_MINUTES;
    startMinutes = Math.max(startMinutes, roundUpMinutes(nowMinutes, PICKUP_SLOT_INTERVAL_MINUTES));
  }

  const slots = [];
  for (let minute = startMinutes; minute <= schedule.closeMinutes; minute += PICKUP_SLOT_INTERVAL_MINUTES) {
    slots.push({
      value: formatTimeFromMinutes(minute),
      label: formatTimeFromMinutes(minute)
    });
  }

  return slots;
}

function renderPickupUi() {
  const dayButtonsWrap = document.getElementById("pickup-day-buttons");
  const slotSelect = document.getElementById("pickup-slot");
  const pickupInput = document.getElementById("pickup-time");
  const helper = document.getElementById("pickup-helper");
  if (!dayButtonsWrap || !slotSelect || !pickupInput || !helper) return;

  const dayOptions = pickupUiState.dayOptions;
  if (!dayOptions.length) return;

  const firstAvailableIndex = dayOptions.findIndex((dayOption) => getPickupSlotsForDate(dayOption.date).length > 0);
  if (firstAvailableIndex >= 0 && getPickupSlotsForDate(dayOptions[pickupUiState.activeIndex].date).length === 0) {
    pickupUiState.activeIndex = firstAvailableIndex;
  }

  const activeDay = dayOptions[pickupUiState.activeIndex];
  const slots = getPickupSlotsForDate(activeDay.date);
  dayButtonsWrap.innerHTML = dayOptions
    .map((option, index) => {
      const hasSlots = getPickupSlotsForDate(option.date).length > 0;
      const active = index === pickupUiState.activeIndex ? " is-active" : "";
      const disabled = hasSlots ? "" : " disabled";
      const suffix = hasSlots ? "" : " (volzet/gesloten)";
      return `<button type="button" class="pickup-day-btn${active}" data-day-index="${index}" role="tab" aria-selected="${index === pickupUiState.activeIndex ? "true" : "false"}"${disabled}>${option.label}${suffix}</button>`;
    })
    .join("");

  if (!slots.length) {
    slotSelect.innerHTML = `<option value="">${tr("order.noSlots", "Geen uren beschikbaar")}</option>`;
    slotSelect.disabled = true;
    pickupInput.value = "";
    helper.textContent = tr("order.noSlotsDay", "Voor deze dag zijn geen afhaalmomenten meer beschikbaar.");
    return;
  }

  slotSelect.disabled = false;
  slotSelect.innerHTML = slots.map((slot) => `<option value="${slot.value}">${slot.label}</option>`).join("");
  const selectedTime = slotSelect.value || slots[0].value;
  const [hours, minutes] = selectedTime.split(":").map((value) => Number(value));
  pickupInput.value = formatDateTimeLocalValue(
    new Date(activeDay.date.getFullYear(), activeDay.date.getMonth(), activeDay.date.getDate(), hours, minutes, 0, 0)
  );
  helper.textContent = tr("order.pickupHelp", "Openingsuren afhaling: ma-vr 07:30-14:30, za 08:00-14:30, zo gesloten.");
}

function setupPickupFieldDefaults() {
  const dayButtonsWrap = document.getElementById("pickup-day-buttons");
  const slotSelect = document.getElementById("pickup-slot");
  const pickupInput = document.getElementById("pickup-time");
  const helper = document.getElementById("pickup-helper");
  if (!dayButtonsWrap || !slotSelect || !pickupInput || !helper) return;

  pickupUiState.dayOptions = getPickupDayOptions();
  pickupUiState.activeIndex = 0;
  const firstWithSlots = pickupUiState.dayOptions.findIndex((dayOption) => getPickupSlotsForDate(dayOption.date).length > 0);
  if (firstWithSlots >= 0) {
    pickupUiState.activeIndex = firstWithSlots;
  }

  if (!pickupUiState.initialized) {
    dayButtonsWrap.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest(".pickup-day-btn");
      if (!button) return;
      const index = Number(button.dataset.dayIndex);
      if (Number.isNaN(index) || !pickupUiState.dayOptions[index]) return;
      pickupUiState.activeIndex = index;
      renderPickupUi();
    });

    slotSelect.addEventListener("change", () => {
      const day = pickupUiState.dayOptions[pickupUiState.activeIndex];
      if (!day || !slotSelect.value) {
        pickupInput.value = "";
        return;
      }
      const [hours, minutes] = slotSelect.value.split(":").map((value) => Number(value));
      pickupInput.value = formatDateTimeLocalValue(
        new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), hours, minutes, 0, 0)
      );
    });

    pickupUiState.initialized = true;
  }

  renderPickupUi();
}

function getOrCreateCheckoutIntentKey() {
  const existing = orderStorage.getItem("vani_checkout_intent_key_v1");
  if (existing && existing.length >= 16) return existing;
  const generated = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 16)}`;
  orderStorage.setItem("vani_checkout_intent_key_v1", generated);
  return generated;
}

function rotateCheckoutIntentKey() {
  orderStorage.removeItem("vani_checkout_intent_key_v1");
}

function getCart() {
  try {
    const raw = orderStorage.getItem(ORDER_CART_KEY_ORDER);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
  }

  try {
    const cookieMatch = document.cookie.split("; ").find((entry) => entry.startsWith(`${ORDER_CART_KEY_ORDER}=`));
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
    orderStorage.setItem(ORDER_CART_KEY_ORDER, serialized);
  } catch (error) {
  }
  writeCartCookie(ORDER_CART_KEY_ORDER, serialized);
}

function getItemLabel(item) {
  if (item && item.name && typeof item === "object") {
    if (typeof item.name === "string") return item.name;
    return item.name.nl || item.name.en || item.name.fr || "Broodje";
  }
  return "Broodje";
}

function buildChangeSummary(size, extras, note) {
  const parts = [`Formaat: ${getLocalizedOptionValue(size.label, "nl")}`];
  if (extras.length) {
    parts.push(`Extras: ${extras.map((extra) => getLocalizedOptionValue(extra.label, "nl")).join(", ")}`);
  }
  if (note) {
    parts.push(`Wens: ${note}`);
  }
  return parts.join(" | ");
}

function getCustomization(item) {
  if (item?.customizationMode === "fixed") {
    return {
      basePrice: parseLinePrice(item.price),
      sizeId: "small",
      extraIds: [],
      note: ""
    };
  }

  const fromItem = item.customization && typeof item.customization === "object" ? item.customization : {};
  return {
    basePrice: Number(fromItem.basePrice) || parseLinePrice(item.price),
    sizeId: fromItem.sizeId || "small",
    extraIds: Array.isArray(fromItem.extraIds) ? fromItem.extraIds : [],
    note: typeof fromItem.note === "string" ? fromItem.note : ""
  };
}

function calcUnitPrice(customization) {
  const { sizeOptions, extraOptions } = getOrderOptionsState();
  const size = sizeOptions.find((option) => option.id === customization.sizeId) || sizeOptions[0];
  const extras = customization.extraIds
    .map((id) => extraOptions.find((extra) => extra.id === id))
    .filter(Boolean);
  const extraTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
  const unit = customization.basePrice + size.delta + extraTotal;
  return { unit, size, extras };
}

function isEditableOrderItem(item) {
  return item?.customizationMode !== "fixed";
}

function isQuantityAdjustableOrderItem(item) {
  return item?.customizationMode !== "fixed";
}

function getOrderItemQuantityLabel(item) {
  const quantity = Number(item?.quantity) || 1;
  if (item?.category === "ontbijtformules") {
    return `${quantity} ${tr("breakfast.personsShort", "pers.")}`;
  }
  return String(quantity);
}

function renderCart() {
  const container = document.getElementById("order-items");
  const empty = document.getElementById("order-empty");
  const subtotalNode = document.getElementById("order-subtotal");
  if (!container || !empty) return;

  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const customization = getCustomization(item);
    const unit = calcUnitPrice(customization).unit;
    return sum + unit * qty;
  }, 0);

  if (subtotalNode) {
    subtotalNode.textContent = `${tr("ui.subtotal", "Subtotaal")} ${formatEuroPrice(subtotal)}`;
  }

  if (!cart.length) {
    container.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";
  container.innerHTML = cart
    .map((item, index) => {
      const isAdjustable = isQuantityAdjustableOrderItem(item);
      const editButton = isEditableOrderItem(item)
        ? `<button type="button" class="btn btn-outline" data-action="edit" data-index="${index}">${escapeHtml(tr("order.edit", "Wijzig"))}</button>`
        : "";
      const quantityControls = isAdjustable
        ? `
            <button type="button" class="btn btn-outline" data-action="decrease" data-index="${index}">-</button>
            <span class="order-item-qty">${item.quantity || 1}</span>
            <button type="button" class="btn btn-outline" data-action="increase" data-index="${index}">+</button>
          `
        : `<span class="order-item-qty order-item-qty-fixed">${escapeHtml(getOrderItemQuantityLabel(item))}</span>`;
      const summary = String(item.changeRequest || "").trim();
      return `
        <div class="order-item-row">
          <div class="order-item-main">
            <strong>${escapeHtml(getItemLabel(item))}</strong>
            <p>${escapeHtml(item.price || "")}</p>
            ${summary ? `<p class="order-item-summary">${escapeHtml(summary)}</p>` : ""}
          </div>
          <div class="order-item-actions">
            ${quantityControls}
            ${editButton}
            <button type="button" class="btn btn-outline" data-action="remove" data-index="${index}">${escapeHtml(tr("order.remove", "Verwijder"))}</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function updateCartItem(index, updater) {
  const cart = getCart();
  const item = cart[index];
  if (!item) return;
  updater(item, cart);
  setCart(cart);
  renderCart();
}

function setupCartActions() {
  const container = document.getElementById("order-items");
  if (!container) return;

  container.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;
    const item = getCart()[index];
    if (!item) return;

    if (action === "increase") {
      if (!isQuantityAdjustableOrderItem(item)) return;
      updateCartItem(index, (item) => {
        item.quantity = (item.quantity || 1) + 1;
      });
      return;
    }

    if (action === "decrease") {
      if (!isQuantityAdjustableOrderItem(item)) return;
      updateCartItem(index, (item, cart) => {
        item.quantity = (item.quantity || 1) - 1;
        if (item.quantity <= 0) {
          cart.splice(index, 1);
        }
      });
      return;
    }

    if (action === "remove") {
      updateCartItem(index, (_, cart) => {
        cart.splice(index, 1);
      });
      return;
    }

    if (action === "edit") {
      if (!isEditableOrderItem(item)) return;
      openOrderEditModal(index);
    }
  });
}

function getCheckedExtrasForEditModal() {
  return Array.from(document.querySelectorAll("#order-edit-extras input[type='checkbox']:checked"))
    .map((input) => input.value)
    .filter(Boolean);
}

function getCheckedSizeForEditModal() {
  const checked = document.querySelector("#order-edit-sizes input[type='radio']:checked");
  return checked ? checked.value : "small";
}

function updateOrderEditPrice() {
  const badge = document.getElementById("order-edit-price");
  if (!badge) return;
  const sizeId = getCheckedSizeForEditModal();
  const extraIds = getCheckedExtrasForEditModal();
  const cart = getCart();
  const item = cart[currentEditIndex];
  if (!item) return;
  const current = getCustomization(item);
  const preview = {
    basePrice: current.basePrice,
    sizeId,
    extraIds,
    note: String(document.getElementById("order-edit-note")?.value || "").trim()
  };
  const unit = calcUnitPrice(preview).unit;
  badge.textContent = `Nieuwe prijs ${formatEuroPrice(unit)}`;
}

function closeOrderEditModal() {
  const modal = document.getElementById("order-edit-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  currentEditIndex = -1;
}

function openOrderEditModal(index) {
  const modal = document.getElementById("order-edit-modal");
  const title = document.getElementById("order-edit-title");
  const sizes = document.getElementById("order-edit-sizes");
  const extras = document.getElementById("order-edit-extras");
  const note = document.getElementById("order-edit-note");
  if (!modal || !title || !sizes || !extras || !note) return;

  const cart = getCart();
  const item = cart[index];
  if (!item) return;
  if (!isEditableOrderItem(item)) return;

  currentEditIndex = index;
  const current = getCustomization(item);
  const { sizeOptions, extraGroups } = getOrderOptionsState();

  title.textContent = `Wijzig ${getItemLabel(item)}`;

  sizes.innerHTML = sizeOptions.map((size) => {
    const priceLabel = size.delta > 0 ? `(+${formatEuroPrice(size.delta)})` : "";
    const checked = current.sizeId === size.id ? "checked" : "";
    return `
      <label class="menu-modal-option">
        <input type="radio" name="order-edit-size" value="${size.id}" ${checked} />
        <span>${getLocalizedOptionValue(size.label)} ${priceLabel}</span>
      </label>
    `;
  }).join("");

  extras.innerHTML = extraGroups.map((group) => {
    const optionsHtml = group.options
      .map((extra) => {
        const checked = current.extraIds.includes(extra.id) ? "checked" : "";
        const priceLabel = extra.price > 0 ? `(+${formatEuroPrice(extra.price)})` : "";
        return `
          <label class="menu-modal-option">
            <input type="checkbox" value="${extra.id}" ${checked} />
            <span>${escapeHtml(getLocalizedOptionValue(extra.label))} ${priceLabel}</span>
          </label>
        `;
      })
      .join("");
    return `<div class="menu-modal-group"><p class="menu-modal-group-title">${escapeHtml(getLocalizedOptionValue(group.title))}</p>${optionsHtml}</div>`;
  }).join("");

  note.value = current.note || "";

  const enforceLimit = () => {
    const checked = document.querySelectorAll("#order-edit-extras input[type='checkbox']:checked");
    const all = document.querySelectorAll("#order-edit-extras input[type='checkbox']");
    const atLimit = checked.length >= 10;
    all.forEach((input) => {
      if (!input.checked) input.disabled = atLimit;
    });
    updateOrderEditPrice();
  };

  sizes.onchange = updateOrderEditPrice;
  extras.onchange = enforceLimit;
  note.oninput = updateOrderEditPrice;
  enforceLimit();

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function setupOrderEditModal() {
  const modal = document.getElementById("order-edit-modal");
  const closeBtn = document.getElementById("order-edit-close");
  const saveBtn = document.getElementById("order-edit-save");
  const note = document.getElementById("order-edit-note");
  if (!modal || !closeBtn || !saveBtn || !note) return;

  closeBtn.addEventListener("click", closeOrderEditModal);
  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.closeOrderEdit === "true") {
      closeOrderEditModal();
    }
  });

  saveBtn.addEventListener("click", () => {
    const cart = getCart();
    const item = cart[currentEditIndex];
    if (!item) return;

    const customization = getCustomization(item);
    customization.sizeId = getCheckedSizeForEditModal();
    customization.extraIds = getCheckedExtrasForEditModal();
    customization.note = note.value.trim();

    const { unit, size, extras } = calcUnitPrice(customization);
    item.customization = customization;
    item.price = formatEuroPrice(unit);
    item.changeRequest = buildChangeSummary(size, extras, customization.note);

    setCart(cart);
    renderCart();
    closeOrderEditModal();
  });
}

async function submitOrder(payload) {
  const response = await fetch("/api/public/bestellingen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Bestelling mislukt");
  }

  return response.json();
}

async function startCheckout(payload) {
  const response = await fetch("/api/public/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Checkout mislukt");
  }

  return response.json();
}

function setupCheckout() {
  const form = document.getElementById("checkout-form");
  const feedback = document.getElementById("checkout-feedback");
  if (!form || !feedback) return;
  setupPickupFieldDefaults();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const cart = getCart();
    if (!cart.length) {
      feedback.textContent = tr("order.emptyCart", "Je winkelmand is leeg.");
      return;
    }

    const formData = new FormData(form);
    const customerName = String(formData.get("customerName") || "").trim();
    const customerPhone = String(formData.get("customerPhone") || "").trim();
    const customerEmail = String(formData.get("customerEmail") || "").trim();
    const pickupTime = String(formData.get("pickupTime") || "").trim();
    const orderNotes = String(formData.get("orderNotes") || "").trim();
    const paymentMethod = String(formData.get("paymentMethod") || "cash").trim().toLowerCase();

    if (!customerName || !customerPhone || !pickupTime) {
      feedback.textContent = tr("order.error.requiredFields", "Vul naam, telefoon en uur ophaling in.");
      return;
    }
    const pickupError = getPickupValidationError(pickupTime);
    if (pickupError) {
      feedback.textContent = pickupError;
      return;
    }

    const payload = {
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail
      },
      pickupTime,
      notes: orderNotes,
      paymentMethod,
      idempotencyKey: paymentMethod === "online" ? getOrCreateCheckoutIntentKey() : "",
      items: cart.map((item) => ({
        category: item.category,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        changeRequest: item.changeRequest || ""
      }))
    };

    feedback.textContent = tr("order.sending", "Bestelling wordt verzonden...");

    try {
      if (paymentMethod === "online") {
        const checkout = await startCheckout(payload);
        if (checkout.checkoutUrl) {
          window.location.href = checkout.checkoutUrl;
          return;
        }
        throw new Error("Online checkout niet beschikbaar");
      } else {
        await submitOrder(payload);
      }
      rotateCheckoutIntentKey();
      setCart([]);
      renderCart();
      form.reset();
      setupPickupFieldDefaults();
      feedback.textContent = tr("order.success", "Bestelling geplaatst. Je krijgt snel bevestiging.");
    } catch (error) {
      feedback.textContent = tr("order.error.generic", "Er ging iets mis. Probeer opnieuw.");
    }
  });
}

function showPaymentReturnFeedback() {
  const feedback = document.getElementById("checkout-feedback");
  if (!feedback) return;

  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get("payment");
  const orderId = params.get("orderId");
  const token = params.get("token");
  const clearUrl = () => window.history.replaceState({}, document.title, window.location.pathname);

  if (paymentStatus === "failed") {
    feedback.textContent = tr("order.payment.failed", "Online betaling mislukt. Probeer opnieuw of kies betalen bij afhaling.");
    clearUrl();
    return;
  }

  if (paymentStatus === "cancelled") {
    feedback.textContent = tr("order.payment.cancelled", "Online betaling geannuleerd. Je bestelling staat nog klaar in je winkelmand.");
    clearUrl();
    return;
  }

  if (paymentStatus !== "success") {
    return;
  }

  if (!orderId || !token) {
    rotateCheckoutIntentKey();
    setCart([]);
    renderCart();
    feedback.textContent = tr("order.payment.confirmed", "Online betaling ontvangen. Je bestelling is bevestigd.");
    clearUrl();
    return;
  }

  feedback.textContent = tr("order.payment.checking", "Betaling wordt bevestigd...");
  fetch(`/api/public/orders/status?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`, {
    method: "GET"
  })
    .then((response) => {
      if (!response.ok) throw new Error("Status niet beschikbaar");
      return response.json();
    })
    .then((statusData) => {
      if (statusData.paymentStatus === "paid") {
        rotateCheckoutIntentKey();
        setCart([]);
        renderCart();
        feedback.textContent = `${tr("order.payment.confirmed", "Online betaling ontvangen. Je bestelling is bevestigd.")} #${orderId}`;
        clearUrl();
        return;
      }

      feedback.textContent =
        tr("order.payment.processing", "Betaling nog in verwerking. Vernieuw binnen enkele seconden of controleer later opnieuw.");
      clearUrl();
    })
    .catch(() => {
      feedback.textContent =
        tr("order.payment.unknown", "We konden de betaalstatus niet controleren. Neem contact op met de zaak als het bedrag al is afgeschreven.");
      clearUrl();
    });
}

renderCart();
setupCartActions();
setupCheckout();
setupOrderEditModal();
showPaymentReturnFeedback();
if (typeof window.loadVpOrderOptions === "function") {
  window.loadVpOrderOptions().then(() => {
    renderCart();
  });
}
window.addEventListener("focus", renderCart);
window.addEventListener("storage", (event) => {
  if (event.key === ORDER_CART_KEY_ORDER) {
    renderCart();
  }
});
