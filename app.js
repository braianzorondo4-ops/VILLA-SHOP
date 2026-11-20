const products = [
  { id: "taza-calma", name: "Taza Calma", category: "Hogar", price: 12900, emoji: "☕", color: "#392e12", badge: "Más vendido" },
  { id: "vela-botanica", name: "Vela Botánica", category: "Hogar", price: 8900, emoji: "🕯️", color: "#8a6c22", badge: "Hecho a mano" },
  { id: "cuaderno-ideas", name: "Cuaderno de ideas", category: "Papelería", price: 7600, emoji: "📔", color: "#211c11", badge: "" },
  { id: "bolso-nube", name: "Bolso Nube", category: "Accesorios", price: 18900, emoji: "👜", color: "#6d531b", badge: "Nuevo" },
  { id: "set-pausa", name: "Set Pausa", category: "Bienestar", price: 15500, emoji: "🌿", color: "#30260f", badge: "" },
  { id: "botella-dia", name: "Botella de todos los días", category: "Accesorios", price: 11200, emoji: "🧴", color: "#a17c20", badge: "" },
  { id: "florero-sol", name: "Florero Sol", category: "Hogar", price: 14300, emoji: "🏺", color: "#332910", badge: "Favorito" },
  { id: "kit-creativo", name: "Kit creativo", category: "Papelería", price: 9800, emoji: "🎨", color: "#72571c", badge: "" }
];

const STORAGE_KEYS = { cart: "villa-shop-cart", orders: "villa-shop-orders" };
const productGrid = document.querySelector("#product-grid");
const cartDrawer = document.querySelector("#cart-drawer");
const overlay = document.querySelector("#overlay");
const checkoutDialog = document.querySelector("#checkout-dialog");
const adminPanel = document.querySelector("#admin-panel");
const shopMain = document.querySelector("main");
const siteFooter = document.querySelector(".site-footer");
const toast = document.querySelector("#toast");
let selectedCategory = "Todos";
let cart = readStorage(STORAGE_KEYS.cart, []);
let orders = readStorage(STORAGE_KEYS.orders, []);
let toastTimer;

function readStorage(key, fallback) {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    return Array.isArray(stored) ? stored : fallback;
  } catch (error) {
    console.error(`No se pudo leer ${key} del almacenamiento local.`, error);
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`No se pudo guardar ${key} en el almacenamiento local.`, error);
    showToast("No pudimos guardar los cambios en este navegador.");
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function renderFilters() {
  const categories = ["Todos", ...new Set(products.map((product) => product.category))];
  document.querySelector("#category-filters").innerHTML = categories.map((category) => `
    <button class="filter-button ${category === selectedCategory ? "active" : ""}" type="button" data-category="${escapeHTML(category)}">${escapeHTML(category)}</button>
  `).join("");
}

function renderProducts() {
  const visibleProducts = selectedCategory === "Todos"
    ? products
    : products.filter((product) => product.category === selectedCategory);

  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-image" style="background:${product.color}">
        ${product.badge ? `<span class="product-badge">${escapeHTML(product.badge)}</span>` : ""}
        <span class="art" role="img" aria-label="${escapeHTML(product.name)}">${product.emoji}</span>
        <button class="quick-add" type="button" data-add="${product.id}" aria-label="Agregar ${escapeHTML(product.name)} al carrito">+</button>
      </div>
      <div class="product-info">
        <p class="product-category">${escapeHTML(product.category)}</p>
        <h3 class="product-name">${escapeHTML(product.name)}</h3>
        <div class="product-bottom"><span class="product-price">${formatPrice(product.price)}</span><span class="product-stock">Disponible</span></div>
      </div>
    </article>
  `).join("");
}

function cartQuantity() {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function cartTotal() {
  return cart.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
}

function renderCart() {
  cart = cart.filter((item) => products.some((product) => product.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0);
  document.querySelector("#cart-count").textContent = cartQuantity();
  document.querySelector("#drawer-count").textContent = `(${cartQuantity()})`;
  document.querySelector("#cart-subtotal").textContent = formatPrice(cartTotal());
  document.querySelector("#checkout-total").textContent = formatPrice(cartTotal());
  const empty = cart.length === 0;
  document.querySelector("#cart-empty").hidden = !empty;
  document.querySelector("#cart-footer").hidden = empty;
  document.querySelector("#cart-items").innerHTML = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return `
      <div class="cart-item">
        <div class="cart-thumb" style="background:${product.color}" aria-hidden="true">${product.emoji}</div>
        <div>
          <p class="cart-item-name">${escapeHTML(product.name)}</p>
          <span class="cart-item-price">${formatPrice(product.price)}</span>
          <div class="quantity-control">
            <button type="button" data-quantity="${product.id}" data-change="-1" aria-label="Quitar una unidad de ${escapeHTML(product.name)}">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-quantity="${product.id}" data-change="1" aria-label="Agregar una unidad de ${escapeHTML(product.name)}">+</button>
          </div>
        </div>
        <button class="remove-item" type="button" data-remove="${product.id}" aria-label="Eliminar ${escapeHTML(product.name)}">×</button>
      </div>
    `;
  }).join("");
  saveStorage(STORAGE_KEYS.cart, cart);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  document.querySelector("#cart-close").focus();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  document.body.style.overflow = "";
  document.querySelector("#cart-open").focus();
}

function addToCart(productId) {
  const item = cart.find((entry) => entry.id === productId);
  if (item) item.quantity += 1;
  else cart.push({ id: productId, quantity: 1 });
  renderCart();
  showToast("¡Agregado a tu bolsa!");
}

function renderAdmin() {
  const pending = orders.filter((order) => order.status === "pending").length;
  const accepted = orders.filter((order) => order.status === "accepted").length;
  document.querySelector("#admin-stats").innerHTML = `
    <div class="stat-card"><span>Pedidos en espera</span><strong>${pending}</strong></div>
    <div class="stat-card"><span>Pedidos aceptados</span><strong>${accepted}</strong></div>
    <div class="stat-card"><span>Total de pedidos</span><strong>${orders.length}</strong></div>
  `;
  const ordersList = document.querySelector("#orders-list");
  if (!orders.length) {
    ordersList.innerHTML = '<div class="orders-empty">Todavía no hay pedidos. Cuando alguien compre, aparecerán acá.</div>';
    return;
  }
  const statusLabels = { pending: "Pendiente", accepted: "Aceptado", rejected: "Rechazado" };
  ordersList.innerHTML = [...orders].reverse().map((order) => {
    const date = new Date(order.createdAt);
    const formattedDate = Number.isNaN(date.getTime()) ? "" : date.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
    const itemText = order.items.map((item) => `${item.quantity} × ${escapeHTML(item.name)} — ${formatPrice(item.price * item.quantity)}`).join("<br>");
    return `
      <article class="order-card">
        <div class="order-topline">
          <div><p class="order-id">Pedido #${escapeHTML(order.id)}</p><span class="order-date">${escapeHTML(formattedDate)}</span></div>
          <span class="status status-${order.status}">${statusLabels[order.status] || "Pendiente"}</span>
        </div>
        <div class="order-details">
          <p><strong>Cliente</strong>${escapeHTML(order.customer.name)}<br>${escapeHTML(order.customer.phone)}</p>
          <p><strong>Entrega</strong>${escapeHTML(order.customer.address)}</p>
          ${order.customer.note ? `<p><strong>Nota</strong>${escapeHTML(order.customer.note)}</p>` : ""}
        </div>
        <div class="order-products">${itemText}</div>
        <div class="order-bottom">
          <span class="order-total">Total: ${formatPrice(order.total)}</span>
          <div class="order-actions">
            <button class="accept-order" type="button" data-order="${escapeHTML(order.id)}" data-status="accepted" ${order.status !== "pending" ? "disabled" : ""}>Aceptar pedido</button>
            <button type="button" data-order="${escapeHTML(order.id)}" data-status="rejected" ${order.status !== "pending" ? "disabled" : ""}>Rechazar</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function showAdmin() {
  shopMain.hidden = true;
  siteFooter.hidden = true;
  adminPanel.hidden = false;
  renderAdmin();
  window.scrollTo(0, 0);
}

function showShop() {
  adminPanel.hidden = true;
  shopMain.hidden = false;
  siteFooter.hidden = false;
  window.scrollTo(0, 0);
}

document.querySelector("#category-filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  selectedCategory = button.dataset.category;
  renderFilters();
  renderProducts();
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(button.dataset.add);
});

document.querySelector("#cart-items").addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");
  if (quantityButton) {
    const item = cart.find((entry) => entry.id === quantityButton.dataset.quantity);
    if (item) item.quantity += Number(quantityButton.dataset.change);
    cart = cart.filter((entry) => entry.quantity > 0);
    renderCart();
  }
  if (removeButton) {
    cart = cart.filter((item) => item.id !== removeButton.dataset.remove);
    renderCart();
  }
});

document.querySelector("#cart-open").addEventListener("click", openCart);
document.querySelector("#cart-close").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartDrawer.classList.contains("open")) closeCart();
});

document.querySelector("#checkout-open").addEventListener("click", () => {
  if (!cart.length) return;
  checkoutDialog.showModal();
});
document.querySelector("#checkout-close").addEventListener("click", () => checkoutDialog.close());

document.querySelector("#checkout-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!cart.length) {
    checkoutDialog.close();
    showToast("Tu bolsa está vacía.");
    return;
  }
  const formData = new FormData(event.currentTarget);
  const items = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return { id: product.id, name: product.name, price: product.price, quantity: item.quantity };
  });
  const order = {
    id: `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    customer: {
      name: String(formData.get("name")).trim(),
      phone: String(formData.get("phone")).trim(),
      address: String(formData.get("address")).trim(),
      note: String(formData.get("note")).trim()
    },
    items,
    total: cartTotal()
  };
  orders.push(order);
  saveStorage(STORAGE_KEYS.orders, orders);
  cart = [];
  renderCart();
  event.currentTarget.reset();
  checkoutDialog.close();
  closeCart();
  showToast(`¡Pedido enviado! Código ${order.id}.`);
});

document.querySelector("#admin-toggle").addEventListener("click", showAdmin);
document.querySelector("#back-to-shop").addEventListener("click", showShop);
document.querySelector("#orders-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-order][data-status]");
  if (!button || button.disabled) return;
  const order = orders.find((entry) => entry.id === button.dataset.order);
  if (!order || order.status !== "pending") return;
  order.status = button.dataset.status;
  saveStorage(STORAGE_KEYS.orders, orders);
  renderAdmin();
  showToast(button.dataset.status === "accepted" ? "Pedido aceptado." : "Pedido rechazado.");
});
document.querySelector("#clear-orders").addEventListener("click", () => {
  if (!orders.length) return;
  if (!window.confirm("¿Querés eliminar todos los pedidos guardados en este navegador?")) return;
  orders = [];
  saveStorage(STORAGE_KEYS.orders, orders);
  renderAdmin();
  showToast("Se limpiaron los pedidos de este navegador.");
});

document.querySelector("#current-year").textContent = new Date().getFullYear();
renderFilters();
renderProducts();
renderCart();
