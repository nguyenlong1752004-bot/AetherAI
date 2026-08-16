# AetherAI Store — GitHub Pages Ready

Bản này đã sửa đường dẫn tài nguyên thành đường dẫn tương đối (`./style.css`, `./app.js`) để chạy đúng khi repo được host tại:

`https://USERNAME.github.io/AetherAI/`

## Có gì trong bản này

- Trang cửa hàng responsive
- Sản phẩm + tìm kiếm
- Giỏ hàng bằng LocalStorage
- Đăng ký / đăng nhập demo
- Trang thanh toán
- Trang kiểm tra đơn hàng
- Trang admin demo
- Backend Node/Express starter
- `.env.example` và `.gitignore`
- Không chứa thông tin ngân hàng thật

## Upload GitHub

Upload toàn bộ file trong thư mục này vào **root** của repository, cùng cấp với `index.html`.

Sau đó:

1. GitHub → Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main`
4. Folder: `/ (root)`
5. Save

## Quan trọng về backend và thanh toán

GitHub Pages chỉ host frontend tĩnh. `server.js` không chạy trên GitHub Pages.

Để có:
- xác nhận thanh toán tự động,
- webhook,
- cấp sản phẩm tự động,
- đăng nhập thật,
- cơ sở dữ liệu,

cần deploy backend lên một dịch vụ Node.js và cấu hình secret bằng Environment Variables.

Không đưa mật khẩu, API key, webhook secret hoặc file `.env` thật lên GitHub.

Bản này cố tình để thông tin ngân hàng là placeholder. Hãy cấu hình thông tin thanh toán ở backend/hosting trước khi nhận giao dịch thật.
