import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ====== ENV ======
const PRICE_PER_KM = parseFloat(process.env.PRICE_PER_KM || "2.5");
const MIN_DELIVERY = parseFloat(process.env.MIN_DELIVERY || "15");
const WHATSAPP = (process.env.WHATSAPP_NUMBER || "966566700298").replace(/\D/g, "");
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_NOW_123";
const ADMIN_PIN = process.env.ADMIN_PIN || "2484";

// ====== بيانات مؤقتة (تقدر نضيف لها من لوحة الإدارة لاحقاً) ======
let products = [
  { id: "p1", name: "فحم مكعبات", price: 35, image: "" },
  { id: "p2", name: "رأس سيليكون", price: 25, image: "" },
  { id: "p3", name: "نكهة تفاحتين", price: 45, image: "" }
];

// ====== Helpers ======
function requireUser(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload?.isAdmin) return res.status(403).json({ error: "Not admin" });
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ====== Health ======
app.get("/", (req, res) => {
  res.json({ status: "Shisha Time backend running ✅" });
});

// ====== Auth (عميل) ======
app.post("/auth/login", (req, res) => {
  const { name, phone } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: "name & phone required" });

  const cleanPhone = String(phone).replace(/\D/g, "");
  const token = jwt.sign(
    { name: String(name).trim(), phone: cleanPhone, isAdmin: false },
    JWT_SECRET,
    { expiresIn: "14d" }
  );

  res.json({ token });
});

// ====== Auth (إدارة) ======
app.post("/admin/login", (req, res) => {
  const { pin } = req.body || {};
  if (!pin) return res.status(400).json({ error: "pin required" });
  if (String(pin) !== String(ADMIN_PIN)) return res.status(401).json({ error: "Wrong pin" });

  const token = jwt.sign({ isAdmin: true }, JWT_SECRET, { expiresIn: "14d" });
  res.json({ token });
});

// ====== Products (للمتجر) ======
app.get("/products", (req, res) => {
  res.json(products);
});

// ====== Products (للإدارة) ======
app.post("/admin/products", requireAdmin, (req, res) => {
  const { name, price, image } = req.body || {};
  if (!name || price == null) return res.status(400).json({ error: "name & price required" });

  const p = {
    id: "p" + Date.now(),
    name: String(name).trim(),
    price: Number(price),
    image: image ? String(image) : ""
  };

  products.unshift(p);
  res.json({ success: true, product: p });
});

app.delete("/admin/products/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  products = products.filter(p => p.id !== id);
  res.json({ success: true });
});

// ====== Delivery price (بالكيلو) ======
app.post("/delivery-price", (req, res) => {
  const { distanceKm } = req.body || {};
  const d = Number(distanceKm);
  if (!Number.isFinite(d) || d <= 0) return res.status(400).json({ error: "distanceKm required" });

  let price = d * PRICE_PER_KM;
  if (price < MIN_DELIVERY) price = MIN_DELIVERY;

  res.json({ distanceKm: d, deliveryPrice: Math.round(price * 100) / 100 });
});

// ====== Order (يرسل واتساب) ======
app.post("/order", requireUser, (req, res) => {
  const { items, total, deliveryPrice } = req.body || {};
  const name = req.user?.name || "";
  const phone = req.user?.phone || "";

  const lines = (items || []).map(i => `- ${i.name} × ${i.qty} = ${i.price * i.qty} ريال`).join("\n");

  const message =
`طلب جديد 🔔
الاسم: ${name}
جوال العميل: ${phone}

${lines || "(لا توجد عناصر)"}

التوصيل: ${deliveryPrice ?? 0} ريال
الإجمالي: ${total ?? 0} ريال
`;

  const whatsappUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  res.json({ success: true, whatsappUrl });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server running on port", PORT));
