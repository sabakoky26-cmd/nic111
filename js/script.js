"use strict";

/* ---------- Data (бір ғана дерек көзі) ---------- */
const PRODUCTS = [
  {id:1,name:"Oversize T-Shirt",category:"Футболка",price:8990,img:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"},
  {id:2,name:"Classic Hoodie",category:"Худи",price:15990,img:"https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600"},
  {id:3,name:"Blue Jeans",category:"Джинсы",price:18990,img:"https://images.unsplash.com/photo-1542272604-787c3835535d?w=600"},
  {id:4,name:"Leather Jacket",category:"Куртка",price:34990,img:"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600"},
  {id:5,name:"White Shirt",category:"Жейде",price:12990,img:"https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600"},
  {id:6,name:"Cargo Pants",category:"Шалбар",price:16990,img:"https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600"}
];

const CART_KEY = "style_cart";
const $ = (id) => document.getElementById(id);
const money = (n) => n.toLocaleString("ru-RU") + " ₸";

/* ---------- Cart storage ---------- */
function getCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(cart){
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  updateCartCount();
}
function updateCartCount(){
  const el = $("cartCount");
  if (el) el.textContent = getCart().reduce((s, i) => s + i.qty, 0);
}
function toast(msg){
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 1800);
}

function addToCart(id){
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) item.qty++; else cart.push({id, qty:1});
  saveCart(cart);
  toast(`«${product.name}» себетке қосылды`);
}

/* ---------- Catalog page ---------- */
let activeCategory = "all";

function renderFilters(){
  const box = $("filters");
  const categories = ["all", ...new Set(PRODUCTS.map(p => p.category))];
  categories.forEach(cat => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = cat === "all" ? "Барлығы" : cat;
    if (cat === activeCategory) b.classList.add("active");
    b.addEventListener("click", () => {
      activeCategory = cat;
      box.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
      renderProducts();
    });
    box.appendChild(b);
  });
  $("search").addEventListener("input", renderProducts);
}

function renderProducts(){
  const grid = $("productGrid");
  const q = $("search").value.trim().toLowerCase();
  const list = PRODUCTS.filter(p =>
    (activeCategory === "all" || p.category === activeCategory) &&
    (p.name + " " + p.category).toLowerCase().includes(q)
  );

  grid.innerHTML = "";
  if (!list.length){
    grid.innerHTML = '<p class="empty">Ештеңе табылмады. Басқа сөзбен іздеп көріңіз.</p>';
    return;
  }
  list.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}" loading="lazy">
      <div class="product-info">
        <small>${p.category}</small>
        <h3>${p.name}</h3>
        <p class="price">${money(p.price)}</p>
        <button type="button">Себетке қосу</button>
      </div>`;
    card.querySelector("button").addEventListener("click", () => addToCart(p.id));
    grid.appendChild(card);
  });
}

/* ---------- Cart page ---------- */
function renderCart(){
  const box = $("cartItems");
  const footer = $("cartFooter");
  const cart = getCart().filter(i => PRODUCTS.some(p => p.id === i.id));

  if (!cart.length){
    box.innerHTML = '<p class="empty">Себет бос. <a href="index.html#products">Каталогқа өту</a></p>';
    footer.hidden = true;
    updateCartCount();
    return;
  }

  footer.hidden = false;
  box.innerHTML = "";
  let total = 0;
  cart.forEach(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    total += p.price * item.qty;
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <div><h3>${p.name}</h3><p>${p.category} · ${money(p.price)}</p></div>
      <div class="qty">
        <button type="button" data-act="minus" aria-label="Азайту">−</button>
        <span>${item.qty}</span>
        <button type="button" data-act="plus" aria-label="Көбейту">+</button>
      </div>
      <button type="button" class="remove" data-act="remove">Өшіру</button>`;
    row.addEventListener("click", e => {
      const act = e.target.dataset.act;
      if (act) changeQty(item.id, act);
    });
    box.appendChild(row);
  });
  $("cartTotal").textContent = money(total);
  updateCartCount();
}

function changeQty(id, act){
  let cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  if (act === "plus") item.qty++;
  if (act === "minus") item.qty--;
  if (act === "remove" || item.qty <= 0) cart = cart.filter(i => i.id !== id);
  saveCart(cart);
  renderCart();
}

function showNotice(text, type){
  const n = $("orderNotice");
  n.textContent = text;
  n.className = "notice " + type;
  n.hidden = false;
}

async function submitOrder(e){
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector("button");
  const data = Object.fromEntries(new FormData(form));
  data.items = getCart().map(i => ({id:i.id, qty:i.qty}));

  btn.disabled = true;
  try {
    const res = await fetch("php/order.php", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || "Қате орын алды");
    saveCart([]);
    $("cartItems").innerHTML = "";
    form.hidden = true;
    document.querySelector(".cart-total").hidden = true;
    showNotice(`Тапсырыс қабылданды! Номері: #${json.order_id}. Жақын арада хабарласамыз.`, "ok");
  } catch (err) {
    showNotice("Тапсырысты жіберу мүмкін болмады. PHP сервері қосулы екенін тексеріңіз. " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  if ($("productGrid")){ renderFilters(); renderProducts(); }
  if ($("cartItems")){ renderCart(); $("orderForm").addEventListener("submit", submitOrder); }
});
