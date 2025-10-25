# Backend (Node.js + Express)

- Tech: Node.js, Express, Mongoose, dotenv, cors
- Chức năng: REST API quản lý người dùng (GET/POST/PUT/DELETE)

## Yêu cầu môi trường

- Windows + PowerShell
- Node.js (bao gồm npm)

### Cài Node.js (kèm npm)

Bạn có thể chọn 1 trong 2 cách:

1) Dùng winget (khuyến nghị)

- Mở PowerShell Run as Administrator
- Cài Node LTS:

   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```

- Đóng PowerShell, mở lại PowerShell mới và kiểm tra:

   ```powershell
   node -v
   npm -v
   ```

2) Dùng bộ cài từ trang chủ

- Tải bản LTS từ: https://nodejs.org/en/download
- Cài đặt và giữ tuỳ chọn “Add to PATH”
- Mở PowerShell mới và kiểm tra `node -v`, `npm -v`

Nếu `node`/`npm` không được nhận diện, kiểm tra PATH có chứa `C:\Program Files\nodejs\` chưa. Cách nhanh để dùng tạm trong phiên hiện tại:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
```

Để sửa PATH vĩnh viễn, dùng “Edit the system environment variables” trong Windows và thêm `C:\Program Files\nodejs\` vào PATH của User/System.

## Thiết lập dự án Backend

1) Cài dependencies

```powershell
cd 'D:\CNTT\4\HK1\PTPMNM\Git\TH_Nhom\Group2-Project\backend'
npm install
```

2) Tạo file `.env` (chỉ chứa KEY=VALUE, không chứa lệnh shell)

Ví dụ mẫu:

```
PORT=3000
MONGODB_URI="mongodb+srv://group2user:abc12345@cluster0.oy7mfyg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME=groupDB
# Gmail SMTP for sending OTP
EMAIL_USER=thuanluuan@gmail.com
# Use Gmail App Password (16 chars) here, not your real account password
EMAIL_PASS=eeoj pqwo vxam kdyo
EMAIL_FROM="User Portal <thuanluuan@gmail.com>"
DEBUG_RETURN_OTP=true

# Cloudinary (for avatar uploads)
CLOUDINARY_CLOUD_NAME=dey48rxfa
CLOUDINARY_API_KEY=834857698129936
CLOUDINARY_API_SECRET=f6TPojqv6rEe6vI9XEc0xgdMPWI
CLOUDINARY_AVATAR_FOLDER=avatars

```

3) Chạy server

```powershell
npm run dev   # chạy với nodemon (tự reload)
# hoặc
npm start     # chạy bình thường
```

Mặc định API sẽ chạy tại: http://localhost:3000

## Các endpoint chính

- GET    `/users`          — lấy danh sách user
- POST   `/users`          — tạo user (body: { name, email })
- PUT    `/users/:id`      — cập nhật user
- DELETE `/users/:id`      — xoá user

## Troubleshooting

- npm/node không được nhận diện: cài Node LTS và kiểm tra PATH như hướng dẫn ở trên.
- Lỗi kết nối MongoDB: kiểm tra `MONGODB_URI`, `DB_NAME`, whitelist IP trên MongoDB Atlas.
- Port bận: đổi biến `PORT` trong `.env` sang cổng khác (ví dụ 3001).

## Bảo mật

- Không commit `.env` thật (đã có trong `.gitignore`).
- Nếu đã từng lộ credentials, hãy rotate mật khẩu/user trên MongoDB Atlas.
