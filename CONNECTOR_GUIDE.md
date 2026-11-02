# AIWebCrafter.com - Store Connection Guide
# دليل ربط المتجر بمنصة AIWebCrafter

## 1. API Configuration / إعدادات الواجهة البرمجية

Your platform provides a secure API for your store to fetch products and submit orders.
توفر المنصة واجهة برمجية آمنة لمتجرك لجلب المنتجات وإرسال الطلبات.

### Endpoint URLs / الروابط الأساسية:
- **Products / المنتجات**: `https://www.aiwebcrafter.com/api/v1/products`
- **Orders / الطلبات**: `https://www.aiwebcrafter.com/api/v1/orders`

---

## 2. Security Headers / مفاتيح الأمان

Every request from your store to AIWebCrafter must include the following header:
يجب أن يتضمن كل طلب من متجرك إلى المنصة المفتاح التالي في الـ Headers:

```http
X-AWC-STOREFRONT-KEY: [YOUR_STOREFRONT_KEY]
```

*Note: You can find your `AWC_STOREFRONT_KEY` in your `.env` file.*
*ملاحظة: يمكنك العثور على المفتاح الخاص بك في ملف `.env`.*

---

## 3. Implementation Example (JavaScript/React) / مثال للتنفيذ

### Fetching Products / جلب المنتجات:
```javascript
const fetchProducts = async () => {
  const response = await fetch('https://www.aiwebcrafter.com/api/v1/products', {
    headers: {
      'X-AWC-STOREFRONT-KEY': 'YOUR_STOREFRONT_KEY'
    }
  });
  const result = await response.json();
  if (result.success) {
    return result.data; // Array of products
  }
};
```

### Submitting an Order / إرسال طلب جديد:
```javascript
const submitOrder = async (orderData) => {
  const response = await fetch('https://www.aiwebcrafter.com/api/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AWC-STOREFRONT-KEY': 'YOUR_STOREFRONT_KEY',
      'X-Idempotency-Key': `ord_${Date.now()}` // Prevents double submission
    },
    body: JSON.stringify(orderData)
  });
  return await response.json();
};
```

---

## 4. Required Order Format / صيغة الطلب المطلوبة

When sending an order, use the following structure:
عند إرسال طلب، استخدم الهيكل التالي:

```json
{
  "customer_name": "الاسم الكامل",
  "customer_phone": "0600000000",
  "customer_email": "email@example.com",
  "shipping_address": "العنوان الكامل",
  "city": "المدينة",
  "payment_method": "Cash On Delivery (COD)",
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 5, "quantity": 1 }
  ]
}
```

---

## 5. Deployment / النشر
Ensure your GitHub Token and other environment variables are set in your **Vercel Dashboard** under **Settings > Environment Variables**.
تأكد من ضبط مفتاح GitHub ومتغيرات البيئة الأخرى في لوحة تحكم Vercel الخاصة بك.
