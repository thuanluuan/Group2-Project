# Vai trò Backend - Nguyen

- Tech: Node.js + Express
- Nhiệm vụ: API, routes, middleware, auth

## Thiết lập môi trường cục bộ

1. Cài đặt dependencies trong 'backend/': `npm install`
2. Tạo file `.env` trong thư mục `backend/` dựa trên mẫu `backend/.env`
   Nội dung file '.env':
   "PORT=3000
   MONGODB_URI="mongodb+srv://group2user:abc12345@cluster0.oy7mfyg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
   DB_NAME=groupDB
   cd D:\CNTT\4\HK1\PTPMNM\test\Group2-Project\backend
   npm run start"
3. Điền các giá trị thực tế cho biến môi trường (URI MongoDB, tên database, cổng chạy server)
4. Khởi động server: `npm start`

> Lưu ý: Không commit file `.env` thật lên Git để tránh lộ thông tin nhạy cảm.
