# Test Log Activity và Rate Limiting

## Hướng dẫn Test

### 1. Chuẩn bị
```bash
# Cài đặt dependencies nếu chưa có
cd backend
npm install

# Khởi động backend
npm run dev
```

### 2. Test Logging Activity

#### Test 1: Register với logging
```bash
# Gửi request register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#",
    "dob": "1990-01-01"
  }'
```

Kiểm tra MongoDB:
```javascript
// Trong MongoDB shell hoặc MongoDB Compass
db.logs.find({ action: "register" }).sort({ createdAt: -1 }).limit(5)
```

#### Test 2: Login thành công
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

Kiểm tra log:
```javascript
db.logs.find({ action: "login", status: "success" }).sort({ createdAt: -1 }).limit(5)
```

#### Test 3: Login thất bại
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrong_password"
  }'
```

Kiểm tra log:
```javascript
db.logs.find({ action: "login", status: "failed" }).sort({ createdAt: -1 }).limit(5)
```

### 3. Test Rate Limiting (Brute Force Protection)

#### Test 1: Gửi 5 lần login sai liên tiếp
```bash
# Thực hiện 5 lần
for i in {1..5}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "wrong_password"
    }'
  echo "\nAttempt $i"
  sleep 1
done
```

#### Test 2: Lần thứ 6 sẽ bị block
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrong_password"
  }'
```

Response mong đợi:
```json
{
  "message": "Tài khoản bị khóa do đăng nhập sai quá nhiều. Vui lòng thử lại sau 15 phút.",
  "remainingMinutes": 15
}
```

Kiểm tra log blocked:
```javascript
db.logs.find({ action: "login_blocked" }).sort({ createdAt: -1 }).limit(5)
```

### 4. Test API Logs (Admin only)

#### Test 1: Login với tài khoản admin
```bash
# Đăng nhập admin để lấy token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "your_admin_password"
  }'

# Lưu accessToken từ response
```

#### Test 2: Lấy danh sách logs
```bash
curl -X GET "http://localhost:3000/logs?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Test 3: Lấy logs với filter
```bash
# Filter theo action
curl -X GET "http://localhost:3000/logs?action=login&status=failed" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Filter theo email
curl -X GET "http://localhost:3000/logs?email=test@example.com" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Filter theo thời gian
curl -X GET "http://localhost:3000/logs?startDate=2025-11-01&endDate=2025-11-02" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Test 4: Lấy thống kê logs
```bash
curl -X GET "http://localhost:3000/logs/stats" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Test 5: Lấy danh sách actions
```bash
curl -X GET "http://localhost:3000/logs/actions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Test Frontend Log Viewer

1. Đăng nhập với tài khoản admin
2. Click vào nút "📊 Logs" trong admin panel
3. Kiểm tra:
   - Thống kê hiển thị đúng
   - Danh sách logs hiển thị đầy đủ
   - Filter hoạt động (action, status, email, date)
   - Pagination hoạt động
   - Hiển thị failed login attempts

### 6. Test Các Hoạt Động Khác

#### Test Update Profile
```bash
curl -X PUT http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "phone": "0123456789"
  }'
```

Kiểm tra log:
```javascript
db.logs.find({ action: "update_profile" }).sort({ createdAt: -1 }).limit(5)
```

#### Test Forgot Password
```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

Kiểm tra log:
```javascript
db.logs.find({ action: "forgot_password" }).sort({ createdAt: -1 }).limit(5)
```

#### Test Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Kiểm tra log:
```javascript
db.logs.find({ action: "logout" }).sort({ createdAt: -1 }).limit(5)
```

## Kiểm tra Collection Logs trong MongoDB

### Xem tất cả logs
```javascript
db.logs.find().sort({ createdAt: -1 }).limit(10)
```

### Đếm số logs
```javascript
db.logs.countDocuments()
```

### Thống kê theo action
```javascript
db.logs.aggregate([
  {
    $group: {
      _id: "$action",
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
])
```

### Thống kê theo status
```javascript
db.logs.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  }
])
```

### Lấy login failures trong 24h
```javascript
db.logs.find({
  action: { $in: ["login", "login_blocked"] },
  status: "failed",
  createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
}).sort({ createdAt: -1 })
```

### Xóa logs cũ hơn 30 ngày
```javascript
db.logs.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
})
```

## Expected Results

### 1. Log Schema
Mỗi log entry nên có:
- `userId`: ObjectId (có thể null)
- `action`: String (vd: "login", "register", "update_profile")
- `email`: String
- `ip`: String
- `userAgent`: String
- `status`: "success" | "failed" | "error"
- `message`: String (optional)
- `metadata`: Object (optional)
- `createdAt`: Date
- `updatedAt`: Date

### 2. Rate Limiting Behavior
- Cho phép 4 lần login sai
- Lần thứ 5 sẽ bị block
- Block trong 15 phút
- Reset counter khi login thành công
- Log tất cả các attempts

### 3. Frontend Log Viewer
- Hiển thị danh sách logs với pagination
- Filter theo action, status, email, date range
- Hiển thị thống kê tổng quan
- Hiển thị recent failed logins
- Chỉ admin mới truy cập được

## Notes
- Rate limiting hiện tại lưu trong memory (sẽ mất khi restart server)
- Với production, nên dùng Redis để lưu trữ rate limit data
- Logs có thể tăng nhanh, nên có chiến lược cleanup định kỳ
- Có thể thêm alert khi có quá nhiều failed login từ cùng IP
