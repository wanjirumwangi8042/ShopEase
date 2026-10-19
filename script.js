// ShopEase – product catalog, filtering, sorting and a persistent cart.

const CURRENCY = "$";
const DELIVERY_FEE = 4.5;
const FREE_DELIVERY_OVER = 50;

const PRODUCTS = [
  { id: 1,  name: "Wireless Earbuds",   category: "Electronics", price: 39.99, rating: 4.5, icon: "🎧", tint: "#dbe8f5" },
  { id: 2,  name: "Smart Watch",        category: "Electronics", price: 89.0,  rating: 4.3, icon: "⌚", tint: "#e0e4f5" },
  { id: 3,  name: "Phone Charger 30W",  category: "Electronics", price: 14.5,  rating: 4.7, icon: "🔌", tint: "#dff0f2" },
  { id: 4,  name: "Cotton T-Shirt",     category: "Fashion",     price: 12.99, rating: 4.2, icon: "👕", tint: "#f7e3dc" },
  { id: 5,  name: "Running Sneakers",   category: "Fashion",     price: 54.0,  rating: 4.6, icon: "👟", tint: "#f6ecd3" },
  { id: 6,  name: "Canvas Backpack",    category: "Fashion",     price: 29.5,  rating: 4.4, icon: "🎒", tint: "#e5ecd6" },
  { id: 7,  name: "Ceramic Mug Set",    category: "Home",        price: 18.0,  rating: 4.8, icon: "☕", tint: "#f3e1d4" },
  { id: 8,  name: "Desk Lamp",          category: "Home",        price: 24.75, rating: 4.1, icon: "💡", tint: "#f8efc7" },
  { id: 9,  name: "Throw Pillow",       category: "Home",        price: 15.25, rating: 4.0, icon: "🛋️", tint: "#e4dff0" },
  { id: 10, name: "Organic Honey 500g", category: "Grocery",     price: 9.5,   rating: 4.9, icon: "🍯", tint: "#f9e8b8" },
  { id: 11, name: "Fresh Coffee Beans", category: "Grocery",     price: 13.2,  rating: 4.6, icon: "🫘", tint: "#e6d9cd" },
  { id: 12, name: "Mixed Nuts 1kg",     category: "Grocery",     price: 16.0,  rating: 4.4, icon: "🥜", tint: "#efe3cf" },
];

const state = {
  category: "All",
  query: "",
  sort: "default",
  cart: loadCart(),
};

// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);
const money = (n) => CURRENCY + n.toFixed(2);

function loadCart() {
  try { return JSON.parse(localStorage.getItem("shopease-cart")) || []; }
  catch { return []; }
}
function saveCart() {
  try { localStorage.setItem("shopease-cart", JSON.stringify(state.cart)); } catch {}
}

// ---------- Elements ----------
const grid = $("#product-grid");
const filters = $("#filters");
const drawer = $("#drawer");
const overlay = $("#overlay");
const cartItems = $("#cart-items");
const toastEl = $("#toast");

// ---------- Products ----------
function getVisibleProducts() {
  let list = PRODUCTS.filter((p) =>
    (state.category === "All" || p.category === state.category) &&
    p.name.toLowerCase().includes(state.query.toLowerCase())
  );
  if (state.sort === "low") list.sort((a, b) => a.price - b.price);
  if (state.sort === "high") list.sort((a, b) => b.price - a.price);
  if (state.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function renderFilters() {
  const cats = ["All", ...new Set(PRODUCTS.map((p) => p.category))];
  filters.innerHTML = cats.map((c) =>
    `<button class="chip" role="tab" data-cat="${c}" aria-selected="${c === state.category}">${c}</button>`
  ).join("");
}

function renderProducts() {
  const list = getVisibleProducts();
  $("#result-info").textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
  if (!list.length) {
    grid.innerHTML = `<p class="empty">No products match “${state.query}”. Try a different search or category.</p>`;
    return;
  }
  grid.innerHTML = list.map((p) => `
    <article class="card">
      <div class="thumb" style="--tint:${p.tint}" aria-hidden="true">${p.icon}</div>
      <div class="body">
        <h3>${p.name}</h3>
        <span class="cat">${p.category}</span>
        <span class="rating">★ ${p.rating.toFixed(1)}</span>
        <div class="foot">
          <span class="price">${money(p.price)}</span>
          <button class="add" data-id="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>`).join("");
}

// ---------- Cart ----------
function addToCart(id) {
  const item = state.cart.find((i) => i.id === id);
  if (item) item.qty++;
  else state.cart.push({ id, qty: 1 });
  updateCart();
  toast(`${PRODUCTS.find((p) => p.id === id).name} added to cart`);
}

function changeQty(id, delta) {
  const item = state.cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter((i) => i.id !== id);
  updateCart();
}

function removeItem(id) {
  state.cart = state.cart.filter((i) => i.id !== id);
  updateCart();
}

function updateCart() {
  saveCart();
  const lines = state.cart.map((i) => ({ ...PRODUCTS.find((p) => p.id === i.id), qty: i.qty }));
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;

  $("#cart-count").textContent = lines.reduce((s, l) => s + l.qty, 0);
  $("#subtotal").textContent = money(subtotal);
  $("#delivery").textContent = subtotal >= FREE_DELIVERY_OVER ? "Free" : money(delivery);
  $("#total").textContent = money(subtotal + delivery);
  $("#checkout").disabled = lines.length === 0;

  cartItems.innerHTML = lines.length ? lines.map((l) => `
    <li>
      <div class="ico" style="--tint:${l.tint}">${l.icon}</div>
      <div>
        <div class="name">${l.name}</div>
        <div class="qty">
          <button data-act="dec" data-id="${l.id}" aria-label="Decrease quantity">−</button>
          <span>${l.qty}</span>
          <button data-act="inc" data-id="${l.id}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div>
        <strong>${money(l.price * l.qty)}</strong><br>
        <button class="remove" data-act="rm" data-id="${l.id}">Remove</button>
      </div>
    </li>`).join("")
    : `<li class="cart-empty" style="display:block">Your cart is empty. Add something you like.</li>`;
}

function openCart(open) {
  drawer.classList.toggle("open", open);
  overlay.classList.toggle("show", open);
  drawer.setAttribute("aria-hidden", String(!open));
}

let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

// ---------- Events ----------
filters.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cat]");
  if (!btn) return;
  state.category = btn.dataset.cat;
  renderFilters();
  renderProducts();
});

$("#search").addEventListener("input", (e) => { state.query = e.target.value.trim(); renderProducts(); });
$("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderProducts(); });

grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add");
  if (btn) addToCart(Number(btn.dataset.id));
});

cartItems.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.act === "inc") changeQty(id, 1);
  if (btn.dataset.act === "dec") changeQty(id, -1);
  if (btn.dataset.act === "rm") removeItem(id);
});

$("#cart-toggle").addEventListener("click", () => openCart(true));
$("#cart-close").addEventListener("click", () => openCart(false));
overlay.addEventListener("click", () => openCart(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") openCart(false); });

$("#clear").addEventListener("click", () => { state.cart = []; updateCart(); });
$("#checkout").addEventListener("click", () => {
  state.cart = [];
  updateCart();
  openCart(false);
  toast("Order placed. Thank you for shopping with ShopEase!");
});

// ---------- Init ----------
renderFilters();
renderProducts();
updateCart();