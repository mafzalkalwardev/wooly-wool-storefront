const Admin = (() => {

  const LS_KEYS = {
    PRODUCTS: "woolywool_products",
    SETTINGS: "woolywool_settings",
    ORDERS: "woolywool_orders",
    ADMIN_AUTH: "woolywool_admin_auth"
  };

  let ordersChart = null;

  // ✅ Size rows for variant pricing (Add Product)
  let sizeRows = [];

  function setLS(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function getLS(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  function formatPKR(amount) {
    return "Rs. " + Number(amount || 0).toLocaleString("en-PK");
  }

  function seedSettings() {
    const existing = getLS(LS_KEYS.SETTINGS, null);

    const base = {
      brandName: "Wooly Wool",
      whatsapp: "+92 333 0945633", // ✅ updated
      instagram: "https://www.instagram.com/wooly_wool_?igsh=MnB4NzNkaWI1N2pu",
      delivery: "Delivery across all over Pakistan",
      advanceThreshold: 3000,
      advancePercent: 30,
      announcement: "Custom handmade orders available."
    };

    if (!existing) {
      setLS(LS_KEYS.SETTINGS, base);
      return;
    }

    // ✅ always fix whatsapp in settings
    existing.whatsapp = "+92 333 0945633";
    if (!existing.brandName) existing.brandName = base.brandName;
    if (!existing.instagram) existing.instagram = base.instagram;
    if (!existing.delivery) existing.delivery = base.delivery;
    if (existing.advanceThreshold == null) existing.advanceThreshold = base.advanceThreshold;
    if (existing.advancePercent == null) existing.advancePercent = base.advancePercent;
    if (!existing.announcement) existing.announcement = base.announcement;

    setLS(LS_KEYS.SETTINGS, existing);
  }

  function seedProducts() {
    const existing = getLS(LS_KEYS.PRODUCTS, []);
    if (existing.length) return;

    setLS(LS_KEYS.PRODUCTS, [
      {
        id: "P001",
        name: "Handmade Wool Cap",
        category: "Handmade Wool Items",
        price: 1200,
        stockQty: 10,
        colors: ["Cream", "Brown"],
        stockType: "In Stock",
        description: "Warm handmade wool cap.",
        images: [
          "https://via.placeholder.com/1000x700?text=Wooly+Wool"
        ],
        image: "https://via.placeholder.com/1000x700?text=Wooly+Wool",
        active: true,
        createdAt: new Date().toISOString()
      }
    ]);
  }

  function seedOrders() {
    const existing = getLS(LS_KEYS.ORDERS, null);
    if (existing) return;
    setLS(LS_KEYS.ORDERS, []);
  }

  // ✅ normalize products schema
  function normalizeProducts() {
    const products = getLS(LS_KEYS.PRODUCTS, []);
    let changed = false;

    products.forEach(p => {
      // ensure images array
      if (!p.images || !Array.isArray(p.images) || !p.images.length) {
        if (p.image) p.images = [p.image];
        else p.images = ["https://via.placeholder.com/1000x700?text=Wooly+Wool"];
        changed = true;
      }

      // ensure image thumbnail
      if (!p.image) {
        p.image = p.images[0];
        changed = true;
      }

      // ensure colors
      if (!p.colors || !Array.isArray(p.colors)) {
        p.colors = [];
        changed = true;
      }

      // ensure stockQty
      if (p.stockQty === undefined || p.stockQty === null) {
        p.stockQty = 0;
        changed = true;
      }

      // ensure price
      if (p.price === undefined || p.price === null) {
        // if sizes exist use min price
        if (p.sizes && p.sizes.length) {
          p.price = Math.min(...p.sizes.map(s => Number(s.price || 0)));
        } else {
          p.price = 0;
        }
        changed = true;
      }
    });

    if (changed) setLS(LS_KEYS.PRODUCTS, products);
  }

  // ✅ normalize orders (eta support)
  function normalizeOrders() {
    const orders = getLS(LS_KEYS.ORDERS, []);
    let changed = false;

    orders.forEach(o => {
      if (o.etaDays === undefined || o.etaDays === null) {
        o.etaDays = 5;
        changed = true;
      }
      if (!o.status) o.status = "Pending";
    });

    if (changed) setLS(LS_KEYS.ORDERS, orders);
  }

  // AUTH
  function isLoggedIn() {
    return getLS(LS_KEYS.ADMIN_AUTH, false) === true;
  }

  function login() {
    const u = document.getElementById("adminUser").value.trim();
    const p = document.getElementById("adminPass").value.trim();

    if (u === "admin" && p === "woolywaal123") {
      setLS(LS_KEYS.ADMIN_AUTH, true);
      showDashboard();
    } else {
      alert("Invalid login ❌");
    }
  }

  function logout() {
    setLS(LS_KEYS.ADMIN_AUTH, false);
    location.reload();
  }

  function showDashboard() {
    document.getElementById("loginBox")?.classList.add("d-none");
    document.getElementById("dashboard")?.classList.remove("d-none");
    refresh();
  }

  // STATS
  function renderStats() {
    const products = getLS(LS_KEYS.PRODUCTS, []);
    const orders = getLS(LS_KEYS.ORDERS, []);

    const activeProducts = products.filter(p => p.active).length;

    const pending = orders.filter(o => o.status === "Pending").length;
    const confirmed = orders.filter(o => o.status === "Confirmed").length;
    const making = orders.filter(o => o.status === "In Making").length;
    const delivered = orders.filter(o => o.status === "Delivered").length;
    const cancelled = orders.filter(o => o.status === "Cancelled").length;

    const revenue = orders
      .filter(o => o.status !== "Cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    document.getElementById("statProducts").textContent = products.length;
    document.getElementById("statActive").textContent = activeProducts;
    document.getElementById("statOrders").textContent = orders.length;

    document.getElementById("statRevenue").textContent = formatPKR(revenue);

    document.getElementById("statPending").textContent = pending;
    document.getElementById("statConfirmed").textContent = confirmed;
    document.getElementById("statMaking").textContent = making;
    document.getElementById("statDelivered").textContent = delivered;
    document.getElementById("statCancelled").textContent = cancelled;
  }

  // CHART
  function renderChart() {
    const orders = getLS(LS_KEYS.ORDERS, []);

    const labels = ["Pending", "Confirmed", "In Making", "Ready", "Shipped", "Delivered", "Cancelled"];
    const counts = labels.map(l => orders.filter(o => o.status === l).length);

    const canvas = document.getElementById("ordersChart");
    if (!canvas) return;

    if (ordersChart) ordersChart.destroy();

    ordersChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Orders",
          data: counts,
          borderWidth: 2,
          borderRadius: 14
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }

  // PRODUCTS
  function nextProductId(products) {
    let max = 0;
    products.forEach(p => {
      const n = parseInt(String(p.id).replace("P", ""), 10);
      if (!isNaN(n)) max = Math.max(max, n);
    });
    return "P" + String(max + 1).padStart(3, "0");
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ✅ Size Variants UI
  function addSizeRow() {
    sizeRows.push({ label: "", price: "" });
    renderSizesBox();
  }
  function removeSizeRow(index) {
    sizeRows.splice(index, 1);
    renderSizesBox();
  }
  function setSizeLabel(index, value) {
    sizeRows[index].label = value;
  }
  function setSizePrice(index, value) {
    sizeRows[index].price = value;
  }

  function renderSizesBox() {
    const box = document.getElementById("sizesBox");
    if (!box) return;

    if (!sizeRows.length) {
      box.innerHTML = `<div class="text-muted small">No sizes added.</div>`;
      return;
    }

    box.innerHTML = sizeRows.map((r, i) => `
      <div class="d-flex gap-2 align-items-center mb-2 flex-wrap">
        <input class="form-control form-control-sm"
          style="max-width:240px"
          placeholder="Size label e.g 0–3 Months"
          value="${r.label}"
          onchange="Admin.setSizeLabel(${i}, this.value)">

        <input type="number" min="1"
          style="max-width:140px"
          class="form-control form-control-sm"
          placeholder="Price"
          value="${r.price}"
          onchange="Admin.setSizePrice(${i}, this.value)">

        <button class="btn btn-sm btn-danger" type="button"
          onclick="Admin.removeSizeRow(${i})">
          Remove
        </button>
      </div>
    `).join("");
  }

  // ✅ add product (multiple images + colors + stock qty)
  async function addProduct() {
    const name = document.getElementById("pName").value.trim();
    const category = document.getElementById("pCategory").value;
    const price = Number(document.getElementById("pPrice").value);
    const stockType = document.getElementById("pStock").value;
    const description = document.getElementById("pDesc").value.trim();

    const stockQty = Number(document.getElementById("pStockQty").value || 0);
    const colors = (document.getElementById("pColors").value || "")
      .split(",").map(c => c.trim()).filter(Boolean);

    const imgInput = document.getElementById("pImgUrl").value.trim();
    //const imgFiles = document.getElementById("pImgFiles")?.files || [];

    if (!name || !category || !price) {
      alert("Fill Name, Category, Price.");
      return;
    }

    // sizes
    let sizes = [];
    if (sizeRows.length) {
      sizes = sizeRows
        .map(r => ({
          label: String(r.label || "").trim(),
          price: Number(r.price || 0)
        }))
        .filter(s => s.label && s.price > 0);
    }

    // images
let images = [];

if (imgInput) {
  const names = imgInput.split(","); // split by comma

  names.forEach(name => {
    const clean = name.trim();
    if (clean) {
      images.push("assets/img/products/" + clean);
    }
  });
}

// fallback image if empty
if (!images.length) {
  images.push("assets/img/products/placeholder.jpg");
}

    const products = getLS(LS_KEYS.PRODUCTS, []);
    const id = nextProductId(products);

    products.unshift({
      id, name, category,
      price,
      stockQty,
      colors,
      stockType,
      description,
      images,
      image: images[0],
      active: true,
      sizes: sizes.length ? sizes : [],
      createdAt: new Date().toISOString()
    });

    setLS(LS_KEYS.PRODUCTS, products);
    alert("Product added ✅");

    // reset form
    document.getElementById("pName").value = "";
    document.getElementById("pPrice").value = "";
    document.getElementById("pDesc").value = "";
    document.getElementById("pStockQty").value = "0";
    document.getElementById("pColors").value = "";
    document.getElementById("pImgUrl").value = "";
    document.getElementById("pImgFiles").value = "";

    // reset sizes
    sizeRows = [];
    renderSizesBox();

    // reset previews
    const imagePreview = document.getElementById("imagePreview");
    if (imagePreview) imagePreview.innerHTML = "";

    refresh();
  }

  function toggleActive(productId) {
    const products = getLS(LS_KEYS.PRODUCTS, []);
    const p = products.find(x => x.id === productId);
    if (!p) return;
    p.active = !p.active;
    setLS(LS_KEYS.PRODUCTS, products);
    refresh();
  }

  function deleteProduct(productId) {
    if (!confirm("Delete this product?")) return;
    let products = getLS(LS_KEYS.PRODUCTS, []);
    products = products.filter(p => p.id !== productId);
    setLS(LS_KEYS.PRODUCTS, products);
    refresh();
  }

  // ✅ render products
  function renderProductsTable() {
    const tbody = document.getElementById("productsTable");
    if (!tbody) return;

    const q = (document.getElementById("productSearch")?.value || "").toLowerCase().trim();
    let products = getLS(LS_KEYS.PRODUCTS, []);

    if (q) {
      products = products.filter(p =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      );
    }

    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No products</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr>
        <td style="width:70px">
          <img src="${p.image}" style="width:58px;height:48px;object-fit:cover;border-radius:12px;">
        </td>
        <td>
          <div class="fw-bold">${p.name}</div>
          <div class="small text-muted">
            ${p.stockType || ""}
            ${p.sizes && p.sizes.length ? ` • <b>${p.sizes.length}</b> sizes` : ""}
            ${p.colors && p.colors.length ? ` • <b>${p.colors.length}</b> colors` : ""}
          </div>
        </td>
        <td>${p.category}</td>
        <td>${formatPKR(p.price)}</td>
        <td>
          <span class="badge ${p.active ? "text-bg-success" : "text-bg-secondary"}">
            ${p.active ? "Active" : "Hidden"}
          </span>

          <span class="badge ms-1 ${Number(p.stockQty || 0) > 0 ? "text-bg-success" : "text-bg-danger"}">
            ${Number(p.stockQty || 0) > 0 ? "In Stock" : "Out of Stock"}
          </span>
        </td>

        <td class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-dark" onclick="Admin.editProduct('${p.id}')">Edit</button>
          <button class="btn btn-sm btn-outline-dark" onclick="Admin.toggleActive('${p.id}')">Toggle</button>
          <button class="btn btn-sm btn-danger" onclick="Admin.deleteProduct('${p.id}')">Delete</button>
        </td>
      </tr>
    `).join("");
  }

  // ORDERS
  function updateOrderStatus(orderId, newStatus) {
    const orders = getLS(LS_KEYS.ORDERS, []);
    const o = orders.find(x => x.orderId === orderId);
    if (!o) return;
    o.status = newStatus;
    setLS(LS_KEYS.ORDERS, orders);
    refresh();
  }

  function updateOrderETA(orderId, days) {
    const orders = getLS(LS_KEYS.ORDERS, []);
    const o = orders.find(x => x.orderId === orderId);
    if (!o) return;

    const d = Number(days || 0);
    if (d < 1) {
      alert("ETA must be at least 1 day.");
      return;
    }

    o.etaDays = d;
    setLS(LS_KEYS.ORDERS, orders);
    renderOrdersTable();
  }

  function renderOrdersTable() {
    const tbody = document.getElementById("ordersTable");
    if (!tbody) return;

    const q = (document.getElementById("orderSearch")?.value || "").toLowerCase().trim();
    const filter = document.getElementById("orderStatusFilter")?.value || "all";

    let orders = getLS(LS_KEYS.ORDERS, []);

    if (q) {
      orders = orders.filter(o =>
        (o.orderId || "").toLowerCase().includes(q) ||
        (o.customer?.phone || "").toLowerCase().includes(q)
      );
    }

    if (filter !== "all") {
      orders = orders.filter(o => o.status === filter);
    }

    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No orders</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td class="fw-bold">${o.orderId}</td>
        <td>
          <div class="fw-bold">${o.customer?.name || "-"}</div>
          <div class="small text-muted">${o.customer?.phone || "-"}</div>
        </td>
        <td class="fw-bold">${formatPKR(o.total)}</td>
        <td>${o.paymentMethod || "-"}</td>

        <td style="width:120px;">
          <input type="number" min="1" class="form-control form-control-sm"
            value="${o.etaDays ?? 5}"
            onchange="Admin.updateOrderETA('${o.orderId}', this.value)">
        </td>

        <td><span class="badge text-bg-warning">${o.status}</span></td>

        <td style="min-width:200px;">
          <select class="form-select form-select-sm"
            onchange="Admin.updateOrderStatus('${o.orderId}', this.value)">
            ${["Pending", "Confirmed", "In Making", "Ready", "Shipped", "Delivered", "Cancelled"]
      .map(s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>

        <td>
          <button class="btn btn-sm btn-outline-dark" onclick="Admin.openOrder('${o.orderId}')">
            View
          </button>
        </td>
      </tr>
    `).join("");
  }

  function openOrder(orderId) {
    const orders = getLS(LS_KEYS.ORDERS, []);
    const o = orders.find(x => x.orderId === orderId);
    if (!o) return;

    const body = document.getElementById("orderModalBody");
    if (!body) return;

    body.innerHTML = `
      <div class="row g-3">
        <div class="col-md-6">
          <div class="fw-bold mb-1">Customer</div>
          <div class="text-muted">${o.customer?.name || "-"}</div>
          <div class="text-muted">${o.customer?.phone || "-"}</div>
          <div class="text-muted">${o.customer?.city || "-"}</div>
        </div>

        <div class="col-md-6">
          <div class="fw-bold mb-1">Order</div>
          <div class="text-muted">Order ID: <b>${o.orderId}</b></div>
          <div class="text-muted">Payment: <b>${o.paymentMethod || "-"}</b></div>
          <div class="text-muted">Status: <b>${o.status}</b></div>
          <div class="text-muted">ETA: <b>${o.etaDays ?? 5} day(s)</b></div>
        </div>

        <div class="col-12">
          <div class="fw-bold mb-2">Update ETA</div>
          <input type="number" min="1" class="form-control"
            value="${o.etaDays ?? 5}"
            onchange="Admin.updateOrderETA('${o.orderId}', this.value)">
          <div class="text-muted small mt-2">
            ETA updates will reflect on customer Track Order page.
          </div>
        </div>

        <div class="col-12">
          <div class="fw-bold mb-2">Items</div>
          <ul class="mb-0">
            ${(o.items || []).map(it => `
              <li>${it.name} × ${it.qty} ${it.sizeLabel ? `(<b>${it.sizeLabel}</b>)` : ""} (Rs. ${it.unitPrice})</li>
            `).join("")}
          </ul>
        </div>

        <div class="col-12">
          <div class="fw-bold mb-1">Address</div>
          <div class="text-muted">${o.customer?.address || "-"}</div>
        </div>

        <div class="col-12">
          <div class="fw-bold mb-1">Note</div>
          <div class="text-muted">${o.note || "-"}</div>
        </div>

        <div class="col-12">
          <div class="fw-bold mb-1">Total</div>
          <div class="fs-5 fw-bold">${formatPKR(o.total)}</div>
        </div>
      </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById("orderModal"));
    modal.show();
  }

  // SETTINGS
  function renderSettings() {
    const s = getLS(LS_KEYS.SETTINGS, {});
    document.getElementById("sBrand").value = s.brandName || "";
    document.getElementById("sWhatsapp").value = s.whatsapp || "";
    document.getElementById("sInstagram").value = s.instagram || "";
    document.getElementById("sDelivery").value = s.delivery || "";
    document.getElementById("sThreshold").value = s.advanceThreshold ?? 3000;
    document.getElementById("sPercent").value = s.advancePercent ?? 30;
    document.getElementById("sAnnouncement").value = s.announcement || "";
  }

  function saveSettings() {
    const settings = {
      brandName: document.getElementById("sBrand").value.trim(),
      whatsapp: document.getElementById("sWhatsapp").value.trim(),
      instagram: document.getElementById("sInstagram").value.trim(),
      delivery: document.getElementById("sDelivery").value.trim(),
      advanceThreshold: Number(document.getElementById("sThreshold").value),
      advancePercent: Number(document.getElementById("sPercent").value),
      announcement: document.getElementById("sAnnouncement").value.trim()
    };

    if (!settings.brandName || !settings.whatsapp || !settings.instagram) {
      alert("Brand name, WhatsApp and Instagram required.");
      return;
    }

    setLS(LS_KEYS.SETTINGS, settings);
    alert("Settings saved ✅");
    refresh();
  }

  // ✅ EDIT PRODUCT
  function editProduct(id) {
    const products = getLS(LS_KEYS.PRODUCTS, []);
    const p = products.find(x => x.id === id);
    if (!p) return;

    document.getElementById("editId").value = p.id;
    document.getElementById("editName").value = p.name || "";
    document.getElementById("editCategory").value = p.category || "";
    document.getElementById("editPrice").value = Number(p.price || 0);
    document.getElementById("editStockQty").value = Number(p.stockQty || 0);
    document.getElementById("editColors").value = (p.colors || []).join(", ");
    document.getElementById("editDesc").value = p.description || "";

    renderEditImagesPreview(p.images || []);

    new bootstrap.Modal(document.getElementById("editProductModal")).show();
  }

  // ✅ preview existing images in edit modal
  function renderEditImagesPreview(images = []) {
    const preview = document.getElementById("editImagesPreview");
    if (!preview) return;

    if (!images.length) {
      preview.innerHTML = `<div class="text-muted">No images</div>`;
      return;
    }

    preview.innerHTML = images.map((src, idx) => `
      <div class="col-6 col-md-4">
        <div class="border rounded-3 p-2 position-relative">
          <img src="${src}" style="width:100%;height:120px;object-fit:cover;border-radius:12px">
          <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
            onclick="Admin.removeEditImage(${idx})">
            ✖
          </button>
        </div>
      </div>
    `).join("");
  }

  function removeEditImage(index) {
    const id = document.getElementById("editId").value;
    const products = getLS(LS_KEYS.PRODUCTS, []);
    const p = products.find(x => x.id === id);
    if (!p) return;

    p.images = (p.images || []).filter((_, i) => i !== index);
    if (!p.images.length) {
      p.images = ["https://via.placeholder.com/1000x700?text=Wooly+Wool"];
    }
    p.image = p.images[0];

    setLS(LS_KEYS.PRODUCTS, products);
    renderEditImagesPreview(p.images);
    renderProductsTable();
  }

  async function saveEditProduct() {
    const id = document.getElementById("editId").value;
    const products = getLS(LS_KEYS.PRODUCTS, []);
    const p = products.find(x => x.id === id);
    if (!p) return;

    p.name = document.getElementById("editName").value.trim();
    p.category = document.getElementById("editCategory").value.trim();
    p.price = Number(document.getElementById("editPrice").value || 0);
    p.stockQty = Number(document.getElementById("editStockQty").value || 0);
    p.description = document.getElementById("editDesc").value.trim();

    p.colors = document.getElementById("editColors")
      .value.split(",").map(c => c.trim()).filter(Boolean);

    // replace images if new upload
    const files = document.getElementById("editImages")?.files || [];
    if (files.length) {
      p.images = [];
      for (const f of files) {
        p.images.push(await fileToBase64(f));
      }
      p.image = p.images[0];
    }

    setLS(LS_KEYS.PRODUCTS, products);
    alert("Product updated ✅");

    refresh();
    bootstrap.Modal.getInstance(document.getElementById("editProductModal"))?.hide();
  }

  function refresh() {
    seedSettings();
    seedProducts();
    seedOrders();

    normalizeProducts();
    normalizeOrders();

    renderStats();
    renderChart();
    renderProductsTable();
    renderOrdersTable();
    renderSettings();
    renderSizesBox();
  }

  function init() {
    seedSettings();
    seedProducts();
    seedOrders();

    normalizeProducts();
    normalizeOrders();

    renderSizesBox();

    if (isLoggedIn()) showDashboard();
  }

  return {
    init,
    login,
    logout,
    refresh,

    addProduct,
    toggleActive,
    deleteProduct,
    renderProductsTable,

    renderOrdersTable,
    updateOrderStatus,
    updateOrderETA,
    openOrder,

    saveSettings,

    // edit product
    editProduct,
    saveEditProduct,
    removeEditImage,

    // size variants (add product)
    addSizeRow,
    removeSizeRow,
    renderSizesBox,
    setSizeLabel,
    setSizePrice
  };

})();

document.addEventListener("DOMContentLoaded", Admin.init);
