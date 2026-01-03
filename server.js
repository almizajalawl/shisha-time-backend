import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ==================
// الإعدادات الأساسية
// ==================
const STORE_LAT = parseFloat(process.env.STORE_LAT);
const STORE_LNG = parseFloat(process.env.STORE_LNG);
const PRICE_PER_KM = parseFloat(process.env.PRICE_PER_KM);
const MIN_DELIVERY = parseFloat(process.env.MIN_DELIVERY);
const WHATSAPP = process.env.WHATSAPP_NUMBER;
const JWT_SECRET = process.env.JWT_SECRET;

// ==================
// منتجات (مؤقتة)
// لاحقًا نربطها بقاعدة بيانات
// ==================
const products = [
  { id: 1, name: "فحم مكعبات", price: 35 },
  { id: 2, name: "معسل تفاحتين", price: 25 },
  { id: 3, name: "راس شيشة", price: 15 }
];

// ==================
// اختبار السيرفر
// ==================
app.get("/", (req, res) => {
  res.json({ status: "Shisha Time backend running ✅" });
});

// ==================
// جلب المنتجات ✅ (هذا كان ناقص)
// ==================
app.get("/products", (req, res) => {
  res.json(products);
});

// ==================
// حساب التوصيل بالكيلومتر
// ==================
app.post("/delivery-price", (req, res) => {
  const { distanceKm } = req.body;

  if (!distanceKm) {
    return res.status(400).json({ error: "distanceKm required" });
  }

  let price = distanceKm * PRICE_PER_KM;
  if (price < MIN_DELIVERY) price = MIN_DELIVERY;

  res.json({
    distanceKm,
    deliveryPrice: price
  });
});

// ==================
// إنشاء طلب (إرسال واتساب)
// ==================
app.post("/order", (req, res) => {
  const { name, phone, total } = req.body;

  const message = `
طلب جديد 🔔
الاسم: ${name}
الجوال: ${phone}
الإجمالي: ${total} ريال
`;

  const whatsappUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

  res.json({
    success: true,
    whatsappUrl
  });
});

// ==================
// تشغيل السيرفر
// ==================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
