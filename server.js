const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const PRODUCTS = path.join(DATA, "products.json");
const ORDERS = path.join(DATA, "orders.json");
const INVENTORY = path.join(DATA, "inventory");

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}
function money(n) {
  return Math.round(Number(n) || 0);
}
function makeOrderId() {
  return "AET" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString("hex").toUpperCase();
}
function safeEqual(a, b) {
  if (!a || !b) return false;
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function extractOrderCode(text) {
  const s = String(text || "").toUpperCase();
  const m = s.match(/AET[A-Z0-9]+/);
  return m ? m[0] : null;
}
function getProduct(id) {
  return readJson(PRODUCTS, []).find(p => p.id === id);
}
function getInventoryFile(product) {
  return path.join(INVENTORY, product.stockFile);
}
function countAvailable(product) {
  const items = readJson(getInventoryFile(product), []);
  return items.filter(x => !x.used).length;
}
function deliver(product, orderId) {
  const file = getInventoryFile(product);
  const items = readJson(file, []);
  const idx = items.findIndex(x => !x.used);
  if (idx < 0) return null;
  items[idx].used = true;
  items[idx].soldAt = new Date().toISOString();
  items[idx].orderId = orderId;
  writeJson(file, items);
  return items[idx];
}

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(ROOT, "public")));

app.get("/api/config", (req, res) => {
  res.json({
    bankName: process.env.BANK_NAME || "Techcombank",
    bankAccountName: process.env.BANK_ACCOUNT_NAME || "NGUYEN DINH THANH LONG",
    bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
    currency: "VND"
  });
});

app.get("/api/products", (req, res) => {
  const products = readJson(PRODUCTS, []).map(p => ({
    ...p,
    stock: countAvailable(p)
  }));
  res.json(products);
});

app.post("/api/orders", (req, res) => {
  const { productId, customerName, customerEmail } = req.body || {};
  const product = getProduct(productId);

  if (!product) return res.status(400).json({ error: "Sản phẩm không tồn tại." });
  if (countAvailable(product) < 1) return res.status(409).json({ error: "Sản phẩm đang hết hàng." });
  if (!customerName || !customerEmail) return res.status(400).json({ error: "Vui lòng nhập tên và email." });

  const orders = readJson(ORDERS, []);
  const order = {
    id: makeOrderId(),
    productId: product.id,
    productName: product.name,
    amount: money(product.price),
    customerName: String(customerName).trim().slice(0, 100),
    customerEmail: String(customerEmail).trim().slice(0, 160),
    status: "PENDING",
    createdAt: new Date().toISOString(),
    paidAt: null,
    delivery: null
  };

  orders.push(order);
  writeJson(ORDERS, orders);

  res.json({
    orderId: order.id,
    amount: order.amount,
    status: order.status,
    paymentContent: order.id + " THANH TOAN AETHERAI"
  });
});

app.get("/api/orders/:id", (req, res) => {
  const orders = readJson(ORDERS, []);
  const order = orders.find(o => o.id === String(req.params.id).toUpperCase());
  if (!order) return res.status(404).json({ error: "Không tìm thấy đơn." });

  // Never expose the delivery secret until payment is confirmed.
  res.json({
    id: order.id,
    productName: order.productName,
    amount: order.amount,
    status: order.status,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    delivery: order.status === "PAID" ? order.delivery : null
  });
});

function markPaid(order, transaction) {
  if (order.status === "PAID") return order;

  const product = getProduct(order.productId);
  if (!product) return null;

  const item = deliver(product, order.id);
  if (!item) {
    order.status = "PAID_NO_STOCK";
    order.paidAt = new Date().toISOString();
    order.payment = {
      transactionId: transaction.id || transaction.referenceCode || null,
      amount: transaction.transferAmount
    };
    return order;
  }

  order.status = "PAID";
  order.paidAt = new Date().toISOString();
  order.payment = {
    transactionId: transaction.id || transaction.referenceCode || null,
    amount: transaction.transferAmount,
    gateway: transaction.gateway || null
  };
  order.delivery = {
    type: item.type || "digital",
    value: item.value,
    deliveredAt: new Date().toISOString()
  };
  return order;
}

app.post("/sepay-webhook", (req, res) => {
  // Configure SePay to send the secret/API key. This simple example supports X-Secret-Key.
  const secret = process.env.SEPAY_WEBHOOK_SECRET;
  if (secret && !safeEqual(req.get("X-Secret-Key"), secret)) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const tx = req.body || {};
  const transferType = String(tx.transferType || "").toLowerCase();
  if (transferType && transferType !== "in") {
    return res.json({ success: true, ignored: true });
  }

  const amount = money(tx.transferAmount);
  const code = extractOrderCode(tx.content);
  if (!code || amount <= 0) {
    return res.json({ success: true, ignored: true });
  }

  const orders = readJson(ORDERS, []);
  const order = orders.find(o => o.id === code);
  if (!order) return res.json({ success: true, ignored: true });
  if (order.status === "PAID") return res.json({ success: true, duplicate: true });

  if (amount < money(order.amount)) {
    return res.json({ success: true, ignored: true, reason: "amount_too_low" });
  }

  const updated = markPaid(order, tx);
  if (!updated) return res.status(500).json({ success: false });

  writeJson(ORDERS, orders);
  res.json({ success: true, orderId: order.id, status: order.status });
});

function admin(req, res, next) {
  const key = req.get("X-Admin-Key") || req.query.key;
  const configured = process.env.ADMIN_KEY;
  if (!configured || !safeEqual(key, configured)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/api/admin/orders", admin, (req, res) => {
  const orders = readJson(ORDERS, []);
  res.json(orders);
});

app.get("/api/admin/stock", admin, (req, res) => {
  const products = readJson(PRODUCTS, []);
  res.json(products.map(p => ({ id: p.id, name: p.name, stock: countAvailable(p) })));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(ROOT, "public", "admin.html"));
});

app.listen(PORT, () => {
  console.log(`AetherAI Shop running on http://localhost:${PORT}`);
});
