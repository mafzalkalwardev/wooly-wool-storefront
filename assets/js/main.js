/* ===========================
   Wooly Wool - Main JS
=========================== */

/* ---------- Toast ---------- */
function showToast(message = "Done ✅") {
  let toast = document.getElementById("wwToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "wwToast";
    toast.style.position = "fixed";
    toast.style.right = "20px";
    toast.style.bottom = "20px";
    toast.style.zIndex = "99999";
    toast.style.padding = "12px 16px";
    toast.style.borderRadius = "14px";
    toast.style.fontWeight = "900";
    toast.style.background = "rgba(20,14,10,0.92)";
    toast.style.color = "#fff";
    toast.style.boxShadow = "0 25px 60px rgba(0,0,0,0.25)";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = ".25s ease";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  clearTimeout(window.__wwToastTimer);
  window.__wwToastTimer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
  }, 1400);
}
window.showToast = showToast;

/* ---------- LocalStorage ---------- */
const LS_KEYS = {
  PRODUCTS: "woolywool_products",
  SETTINGS: "woolywool_settings",
  CART: "woolywool_cart",
  ORDERS: "woolywool_orders"
};

function setLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function getLS(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

/* ---------- Helpers ---------- */
function formatPKR(amount) {
  return "Rs. " + Number(amount || 0).toLocaleString("en-PK");
}

/* ✅ Safe Image Helper */
function getProductThumb(p) {
  if (p?.images && p.images.length) return p.images[0];
  if (p?.image) return p.image;
  return "assets/img/placeholder.png";
}

/* ===========================
   SETTINGS + CONTACT FIX
=========================== */
function seedSettings() {
  // if already exist -> update whatsapp only (so old users fix ho jaye)
  const existing = getLS(LS_KEYS.SETTINGS, null);

  const updated = {
    brandName: "Wooly Wool",
    whatsapp: "+92 333 0945633", // ✅ NEW NUMBER
    instagram: "https://www.instagram.com/wooly_wool_?igsh=MnB4NzNkaWI1N2pu",
    delivery: "Delivery across all over Pakistan",
    advanceThreshold: 3000,
    advancePercent: 30
  };

  if (!existing) {
    setLS(LS_KEYS.SETTINGS, updated);
    return;
  }

  // ✅ update whatsapp always if old number stored
  existing.whatsapp = "+92 333 0945633";
  if (!existing.brandName) existing.brandName = updated.brandName;
  if (!existing.instagram) existing.instagram = updated.instagram;
  if (!existing.delivery) existing.delivery = updated.delivery;
  if (!existing.advanceThreshold) existing.advanceThreshold = updated.advanceThreshold;
  if (!existing.advancePercent) existing.advancePercent = updated.advancePercent;

  setLS(LS_KEYS.SETTINGS, existing);
}

function getSettings() {
  return getLS(LS_KEYS.SETTINGS, {});
}

/* ✅ Convert +92 / 03xx formats to wa.me number */
function normalizeWhatsAppNumber(numberStr) {
  let n = String(numberStr || "").trim();

  // remove spaces & dashes
  n = n.replace(/[\s-]/g, "");

  // +92xxx -> 92xxx
  if (n.startsWith("+")) n = n.substring(1);

  // 03xx -> 92 3xx
  if (n.startsWith("03")) n = "92" + n.substring(1);

  return n;
}

function buildWhatsAppLink(text = "") {
  const s = getSettings();
  const wa = normalizeWhatsAppNumber(s.whatsapp || "+92 333 0945633");

  let url = `https://wa.me/${wa}`;
  if (text) url += `?text=${encodeURIComponent(text)}`;
  return url;
}

function applyGlobalLinks() {
  const waLink = buildWhatsAppLink("Assalam o Alaikum! I want to place an order from Wooly Wool.");
  const s = getSettings();
  const igLink = s.instagram || "https://www.instagram.com/wooly_wool_?igsh=MnB4NzNkaWI1N2pu";

  // ✅ FIX floating whatsapp everywhere
  const floating = document.getElementById("floatingWhatsApp");
  if (floating) {
    floating.href = waLink;
    floating.target = "_blank";
  }

  // ✅ Any element marked as WhatsApp link
  document.querySelectorAll("[data-wa='true']").forEach(el => {
    el.href = waLink;
    el.target = "_blank";
  });

  // ✅ Buttons with known IDs
  const ids = ["customWA", "policyWA", "welcomeWA", "contactWA"];
  ids.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.href = waLink;
      btn.target = "_blank";
    }
  });

  // ✅ Any element marked as Instagram link
  document.querySelectorAll("[data-ig='true']").forEach(el => {
    el.href = igLink;
    el.target = "_blank";
  });
}
window.applyGlobalLinks = applyGlobalLinks;

/* ---------- Seeds Products ---------- */
function seedProducts() {
  const existing = getLS(LS_KEYS.PRODUCTS, []);
  if (existing.length) return;

  setLS(LS_KEYS.PRODUCTS, [
    {
      id: "P001",
      name: "Baby Wool Set (Bubble Love)",
      category: "Handmade Wool Items",
      description: "Handmade baby wool set. Soft, warm & customizable.",
      images: [
        "assets/img/p1.png",
        "assets/img/p1b.png",
        "assets/img/p1c.png"
      ],
      colors: ["Cream", "Sky Blue", "Purple"],
      sizes: [
        { label: "0–3 Months", price: 2500 },
        { label: "3–6 Months", price: 2700 },
        { label: "6–9 Months", price: 3000 },
        { label: "9–12 Months", price: 3200 },
        { label: "12–18 Months", price: 3400 },
        {label: "18-24 Months", price: 3600}
      ],
      active: true
    }
  ]);
}

function seedOrders() {
  if (getLS(LS_KEYS.ORDERS, null)) return;
  setLS(LS_KEYS.ORDERS, []);
}

/* ---------- Cart Badge ---------- */
function updateCartBadge() {
  const cart = getLS(LS_KEYS.CART, []);
  const count = cart.reduce((s, i) => s + Number(i.qty || 0), 0);

  const badge = document.getElementById("cartBadge");
  if (!badge) return;

  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-block" : "none";
}
window.updateCartBadge = updateCartBadge;

/* ---------- Add to Cart ---------- */
function addToCart(productId, sizeLabel = "") {
  const products = getLS(LS_KEYS.PRODUCTS, []);
  const p = products.find(x => x.id === productId);
  if (!p) return;

  if (p.sizes?.length && !sizeLabel) {
    showToast("Please select size first ✅");
    return;
  }

  const cart = getLS(LS_KEYS.CART, []);
  const found = cart.find(i =>
    i.productId === productId &&
    (i.sizeLabel || "") === (sizeLabel || "")
  );

  if (found) found.qty += 1;
  else cart.push({ productId, sizeLabel, qty: 1 });

  setLS(LS_KEYS.CART, cart);
  updateCartBadge();
}
window.addToCart = addToCart;

/* ---------- Shop & Featured ---------- */
function renderShopProducts(gridId = "shopGrid") {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  const products = getLS(LS_KEYS.PRODUCTS, []).filter(p => p.active);

  if (!products.length) {
    grid.innerHTML = `
      <div class="col-12">
        <div class="product-card p-4 text-center text-muted-custom">
          No products available.
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(p => {
    const img = getProductThumb(p);
    let minPrice = 0;
    if (p.sizes && p.sizes.length) minPrice = Math.min(...p.sizes.map(s => s.price));
    else minPrice = Number(p.price || 0);

    return `
      <div class="col-md-4">
        <div class="product-card h-100 hover-lift">

          <a href="product.html?id=${p.id}">
            <img class="product-thumb" src="${img}" alt="${p.name}"
              onerror="this.src='assets/img/placeholder.png'">
          </a>

          <div class="p-3">
            <a href="product.html?id=${p.id}" class="text-decoration-none">
              <div class="fw-bold text-dark">${p.name}</div>
            </a>

            <div class="text-muted-custom small">${p.category || ""}</div>

            <div class="mt-2 fw-bold">
              ${p.sizes?.length ? `From ${formatPKR(minPrice)}` : formatPKR(minPrice)}
            </div>

            <div class="small text-muted-custom mt-2" style="min-height:44px;">
              ${p.description || ""}
            </div>

            <div class="mt-3">
              <a class="btn btn-primary w-100" href="product.html?id=${p.id}">
                <i class="bi bi-cart-plus me-2"></i> Add to Cart
              </a>
            </div>
          </div>

        </div>
      </div>
    `;
  }).join("");
}
window.renderShopProducts = renderShopProducts;

function renderFeaturedProducts(gridId = "featuredGrid", limit = 3) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  const products = getLS(LS_KEYS.PRODUCTS, []).filter(p => p.active).slice(0, limit);

  grid.innerHTML = products.map(p => {
    const img = getProductThumb(p);
    let minPrice = 0;
    if (p.sizes && p.sizes.length) minPrice = Math.min(...p.sizes.map(s => s.price));
    else minPrice = Number(p.price || 0);

    return `
      <div class="col-md-4">
        <div class="product-card h-100 hover-lift">

          <a href="product.html?id=${p.id}">
            <img class="product-thumb" src="${img}" alt="${p.name}"
              onerror="this.src='assets/img/placeholder.png'">
          </a>

          <div class="p-3">
            <a href="product.html?id=${p.id}" class="text-decoration-none">
              <div class="fw-bold text-dark">${p.name}</div>
            </a>

            <div class="mt-2 fw-bold">
              ${p.sizes?.length ? `From ${formatPKR(minPrice)}` : formatPKR(minPrice)}
            </div>

            <div class="mt-3">
              <a class="btn btn-primary w-100" href="product.html?id=${p.id}">
                <i class="bi bi-cart-plus me-2"></i> Add to Cart
              </a>
            </div>
          </div>

        </div>
      </div>
    `;
  }).join("");
}
window.renderFeaturedProducts = renderFeaturedProducts;

/* ---------- Cart Page ---------- */
function getCartDetailed() {
  const cart = getLS(LS_KEYS.CART, []);
  const products = getLS(LS_KEYS.PRODUCTS, []);

  const items = cart.map(ci => {
    const p = products.find(x => x.id === ci.productId);
    if (!p) return null;

    let unitPrice = 0;
    if (p.sizes && p.sizes.length) {
      const found = p.sizes.find(s => String(ci.sizeLabel || "").includes(s.label));
      unitPrice = found ? Number(found.price || 0) : 0;
    } else {
      unitPrice = Number(p.price || 0);
    }

    return {
      ...ci,
      product: p,
      unitPrice,
      thumb: getProductThumb(p)
    };
  }).filter(Boolean);

  const subtotal = items.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0);
  return { items, subtotal };
}

function renderCartPage() {
  const table = document.getElementById("cartTable");
  const totalBox = document.getElementById("cartTotal");
  if (!table || !totalBox) return;

  const { items, subtotal } = getCartDetailed();

  if (!items.length) {
    table.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">
          Your cart is empty. <a href="shop.html">Go to shop</a>
        </td>
      </tr>
    `;
    totalBox.textContent = formatPKR(0);
    return;
  }

  table.innerHTML = items.map(i => `
    <tr>
      <td style="width:90px">
        <img src="${i.thumb}" style="width:75px;height:60px;border-radius:12px;object-fit:cover"
          onerror="this.src='assets/img/placeholder.png'">
      </td>

      <td>
        <div class="fw-bold">${i.product.name}</div>
        ${i.sizeLabel ? `<div class="small text-muted">Variant: <b>${i.sizeLabel}</b></div>` : ""}
      </td>

      <td class="fw-bold">${formatPKR(i.unitPrice)}</td>

      <td style="width:130px">
        <input type="number" min="1" class="form-control form-control-sm"
          value="${i.qty}"
          onchange="updateCartQty('${i.product.id}','${i.sizeLabel || ""}', this.value)">
      </td>

      <td class="text-end">
        <div class="fw-bold">${formatPKR(i.unitPrice * i.qty)}</div>
        <button class="btn btn-sm btn-danger mt-2"
          onclick="removeFromCart('${i.product.id}','${i.sizeLabel || ""}')">
          Remove
        </button>
      </td>
    </tr>
  `).join("");

  totalBox.textContent = formatPKR(subtotal);
}
window.renderCartPage = renderCartPage;

function updateCartQty(productId, sizeLabel, qty) {
  qty = Math.max(1, Number(qty || 1));

  let cart = getLS(LS_KEYS.CART, []);
  cart = cart.map(i => {
    if (i.productId === productId && (i.sizeLabel || "") === (sizeLabel || "")) {
      return { ...i, qty };
    }
    return i;
  });

  setLS(LS_KEYS.CART, cart);
  updateCartBadge();
  renderCartPage();
}
window.updateCartQty = updateCartQty;

function removeFromCart(productId, sizeLabel) {
  let cart = getLS(LS_KEYS.CART, []);
  cart = cart.filter(i => !(i.productId === productId && (i.sizeLabel || "") === (sizeLabel || "")));
  setLS(LS_KEYS.CART, cart);

  updateCartBadge();
  renderCartPage();
  showToast("Removed from cart ✅");
}
window.removeFromCart = removeFromCart;

/* ---------- INIT ---------- */
function init() {
  seedSettings();
  seedProducts();
  seedOrders();

  updateCartBadge();
  applyGlobalLinks(); // ✅ THIS FIXES ALL WHATSAPP LINKS
}
document.addEventListener("DOMContentLoaded", init);
