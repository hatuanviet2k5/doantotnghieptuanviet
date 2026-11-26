# 📚 Tuanvietlibrary - Hệ Thống Quản Lý Thư Viện Số

Hệ thống quản lý thư viện số hiện đại (React + TypeScript + Express + MySQL) hỗ trợ tra cứu sách, đăng ký giữ chỗ trực tuyến (Hold 5 phút) bằng mã QR, quản lý kệ/bản sao, tính phí phạt trễ hạn và báo cáo thống kê.

## 🚀 Tính Năng

### Độc giả (BORROWER)
- 🔍 Tra cứu sách theo tên, ISBN, tác giả, thể loại và trạng thái còn sẵn
- 🔖 Đăng ký giữ sách trực tuyến (Hold 5 phút) sinh mã QR tức thì
- 🎫 Theo dõi phiếu mượn, gia hạn (+7 ngày, tối đa 1 lần) và hủy giữ chỗ
- 💰 Xem lịch sử các khoản phạt trễ hạn
- 👤 Quản lý hồ sơ cá nhân, thẻ thư viện điện tử & đổi mật khẩu
- 📝 Tự đăng ký tài khoản độc giả (tự động cấp thẻ thư viện)

### Thủ thư (LIBRARIAN)
- 📷 Quét mã QR / nhập mã phiếu xác nhận xuất sách & thu hồi sách
- 📋 Quản lý danh sách phiếu mượn, duyệt mượn, trả sách (tự động tính phạt 5.000đ/ngày/cuốn)
- 🗂️ Quản lý kệ sách và bản sao vật lý
- 💵 Thu tiền phạt (CASH / VNPAY / MOMO)
- 📊 Xem Dashboard thống kê & xuất báo cáo Excel / PDF

### Quản trị viên (ADMIN)
- 📚 CRUD Đầu sách, Tác giả, Thể loại
- 👥 Quản lý tài khoản người dùng (tạo, sửa, khóa/mở khóa)
- 🪪 Quản lý & cấp thẻ độc giả
- 📜 Xem nhật ký kiểm toán hệ thống (Audit Logs)

### Bảo mật
- 🔐 Mật khẩu hash bằng `bcryptjs`
- 🪪 Xác thực JWT + phân quyền RBAC (`ADMIN`, `LIBRARIAN`, `BORROWER`)
- 🛡️ Chống Stored XSS (`escapeHtml`) & HTTP Security Headers
- 🚫 Rate Limiting chống brute-force đăng nhập và spam giữ sách
- 🔒 Transaction & Pessimistic Locking (`SELECT ... FOR UPDATE`) tránh xung đột khi mượn sách đồng thời

## 📦 Cài Đặt

### Yêu cầu
- Node.js >= 18
- MySQL >= 8 (hoặc XAMPP MySQL)

### Bước 1: Cài đặt thư viện
```bash
# Cài đặt Frontend
npm install

# Cài đặt Backend
cd server
npm install
```

### Bước 2: Cấu hình môi trường (`server/.env`)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=library_db
DB_PORT=3306
JWT_SECRET=library_secret_key_2026
JWT_EXPIRES_IN=24h
PORT=5000
```

### Bước 3: Khởi tạo CSDL & dữ liệu mẫu
```bash
cd server
npm run seed
```

### Bước 4: Khởi chạy hệ thống
Có thể chạy nhanh bằng file `run_project.bat` hoặc mở 2 terminal:
```bash
# Terminal 1 - Backend (Port 5000)
cd server
npm start

# Terminal 2 - Frontend (Port 3000)
npm run dev
```
Truy cập: **http://localhost:3000**

### Tài khoản mặc định (từ `server/seed.js`)
| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Quản trị viên (ADMIN) | `admin` | `admin123` |
| Thủ thư (LIBRARIAN) | `librarian` | `lib123` |
| Độc giả (BORROWER) | `523100126` | `pass123` |

## 🛠️ Công Nghệ

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React |
| Backend | Express.js 4, MySQL2 (Pool & Transaction) |
| Auth & Security | JWT, bcryptjs, express-rate-limit, morgan, XSS Escape |
| Export & QR | qrcode, @zxing/browser, ExcelJS, PDFKit |
| Testing | Jest, Supertest |

## 🧪 Kiểm Thử (Automated Testing)

```bash
# Chạy toàn bộ test suite Backend
cd server
npm test

# Chạy từng nhóm test
npm run test:auth       # Xác thực, đăng ký, RBAC, đổi mật khẩu
npm run test:books      # Sách & phân quyền CRUD
npm run test:tickets    # Giữ sách, trả sách, tính phí phạt
npm run test:security   # XSS, Security Headers, bcrypt, Rate Limiting

# Kiểm tra TypeScript & Build Frontend
cd ..
npm run build
```

## 📄 License

ISC
