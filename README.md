# AetherAI Shop

Website bán sản phẩm số/AI với:

- Trang chủ + sản phẩm
- Giỏ hàng
- Checkout
- VietQR chuyển khoản
- Tự tạo mã đơn hàng
- Kiểm tra trạng thái đơn
- Webhook SePay để tự động xác nhận giao dịch
- Tự động giao mã/license hoặc tài khoản hàng hóa từ kho
- Trang admin đơn giản
- Không lưu thông tin thẻ ngân hàng của khách

## 1. Chạy trên máy

Cài Node.js 18+.

```bash
npm install
copy .env.example .env
npm start
```

Mở:

http://localhost:3000

## 2. Cấu hình ngân hàng

Mở `.env` và điền:

```env
BANK_NAME=Techcombank
BANK_ACCOUNT_NAME=NGUYEN DINH THANH LONG
BANK_ACCOUNT_NUMBER=...
```

Không đưa `.env` lên GitHub.

## 3. Tự động xác nhận thanh toán

Website dùng SePay Webhook.

Luồng:

Khách tạo đơn
→ website hiển thị số tiền + mã đơn
→ khách chuyển khoản
→ SePay gửi webhook
→ server kiểm tra giao dịch tiền vào + mã đơn
→ đơn chuyển PAID
→ server lấy một item chưa bán trong kho
→ giao item cho khách.

Endpoint:

POST /sepay-webhook

Trong SePay Dashboard, cấu hình webhook trỏ tới:

https://YOUR-BACKEND-DOMAIN/sepay-webhook

Nên dùng API Key hoặc HMAC-SHA256/secret theo cấu hình của SePay.

## 4. Thêm hàng vào kho

Mở:

data/inventory/

Mỗi sản phẩm có một file JSON. Ví dụ:

```json
[
  {
    "id": "AI-001",
    "type": "license",
    "value": "LICENSE-EXAMPLE-001",
    "used": false
  }
]
```

Có thể dùng `type: "account"` nếu sản phẩm của bạn là tài khoản hợp pháp do bạn sở hữu/phân phối.

KHÔNG đưa mật khẩu, cookie, token quản trị hoặc API secret vào GitHub.

## 5. Admin

Mở:

/admin.html

Nhập ADMIN_KEY trong `.env`.

Admin có thể:

- xem đơn hàng
- xem trạng thái thanh toán
- xem hàng tồn
- kiểm tra webhook

## 6. GitHub Pages

GitHub Pages chỉ host frontend tĩnh. Nó KHÔNG chạy được Node.js backend/webhook.

Vì vậy:

- `public/` có thể đưa lên GitHub Pages.
- `server.js` phải chạy trên một máy chủ/backend có URL HTTPS.
- SePay webhook phải gọi được URL backend đó.

Nếu muốn tự động thanh toán + giao hàng thật, phải deploy backend riêng.

## Lưu ý

Đây là hệ thống mẫu cho sản phẩm số hợp pháp. Không dùng để bán tài khoản lấy từ nguồn trái phép, đánh cắp credential, hoặc vượt điều khoản dịch vụ của nhà cung cấp AI.
