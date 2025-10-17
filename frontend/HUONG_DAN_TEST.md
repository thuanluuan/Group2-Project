# 🧪 HƯỚNG DẪN TEST VALIDATION - HOẠT ĐỘNG 8

## Cách chạy ứng dụng để test

### 1. Khởi động Frontend
```bash
cd frontend
npm start
```
Ứng dụng sẽ mở tại: http://localhost:3001

---

## 📝 CÁC BƯỚC TEST CHI TIẾT

### ✅ TEST 1: Validation Tên Rỗng
**Bước thực hiện:**
1. Mở form "➕ Thêm User Mới"
2. Để trống ô "Tên"
3. Nhập email hợp lệ (vd: test@gmail.com)
4. Click "Thêm"

**Kết quả mong đợi:**
- ❌ Hiển thị lỗi: "Tên không được để trống"
- Border ô Tên chuyển màu đỏ
- Form KHÔNG được submit

---

### ✅ TEST 2: Validation Tên Quá Ngắn
**Bước thực hiện:**
1. Nhập tên: "A" (1 ký tự)
2. Nhập email hợp lệ
3. Click "Thêm"

**Kết quả mong đợi:**
- ❌ Hiển thị lỗi: "Tên phải có ít nhất 2 ký tự"
- Border màu đỏ
- Form KHÔNG được submit

---

### ✅ TEST 3: Validation Tên Quá Dài
**Bước thực hiện:**
1. Nhập tên > 50 ký tự (vd: copy paste đoạn text dài)
2. Nhập email hợp lệ
3. Click "Thêm"

**Kết quả mong đợi:**
- ❌ Hiển thị lỗi: "Tên không được quá 50 ký tự"
- Form KHÔNG được submit

---

### ✅ TEST 4: Validation Email Rỗng
**Bước thực hiện:**
1. Nhập tên hợp lệ (vd: John Doe)
2. Để trống email
3. Click "Thêm"

**Kết quả mong đợi:**
- ❌ Hiển thị lỗi: "Email không được để trống"
- Border ô Email màu đỏ
- Form KHÔNG được submit

---

### ✅ TEST 5: Validation Email Không Hợp Lệ
**Bước thực hiện:**
1. Nhập tên hợp lệ
2. Nhập email SAI định dạng:
   - Test 1: "test" (không có @)
   - Test 2: "test@" (không có domain)
   - Test 3: "test@domain" (không có .com)
   - Test 4: "@domain.com" (không có username)
3. Click "Thêm"

**Kết quả mong đợi:**
- ❌ Hiển thị lỗi: "Email không hợp lệ"
- Form KHÔNG được submit

---

### ✅ TEST 6: Submit Form Hợp Lệ
**Bước thực hiện:**
1. Nhập tên: "John Doe" (2-50 ký tự)
2. Nhập email: "john@example.com" (đúng format)
3. Click "Thêm"

**Kết quả mong đợi:**
- ✅ Form được submit thành công
- ✅ Notification xanh hiện lên: "Thêm user thành công!"
- ✅ Form reset về trống
- ✅ User mới xuất hiện trong danh sách
- ✅ Notification tự động biến mất sau 3 giây

---

### ✅ TEST 7: Real-time Error Clearing
**Bước thực hiện:**
1. Để trống cả 2 ô → Click "Thêm"
2. 2 lỗi xuất hiện
3. Bắt đầu gõ vào ô "Tên"

**Kết quả mong đợi:**
- ✅ Lỗi của ô "Tên" TỰ ĐỘNG biến mất khi bắt đầu gõ
- ✅ Lỗi của ô "Email" VẪN CÒN (chưa sửa)
- ✅ Border đỏ của ô "Tên" chuyển về bình thường

---

### ✅ TEST 8: Edit User với Validation
**Bước thực hiện:**
1. Click button "Sửa" ở 1 user trong danh sách
2. Form tự động điền thông tin user
3. Xóa hết tên → Click "Cập nhật"

**Kết quả mong đợi:**
- ✅ Page tự động scroll lên form
- ✅ Title đổi thành "✏️ Sửa User"
- ✅ Button đổi thành "Cập nhật"
- ❌ Hiển thị lỗi validation khi để trống
- ✅ Click "Hủy" → Form reset

---

### ✅ TEST 9: Multiple Validations
**Bước thực hiện:**
1. Nhập tên: "A" (quá ngắn)
2. Nhập email: "invalid" (sai format)
3. Click "Thêm"

**Kết quả mong đợi:**
- ❌ Hiển thị CẢ 2 lỗi cùng lúc:
  - "Tên phải có ít nhất 2 ký tự"
  - "Email không hợp lệ"
- ❌ CẢ 2 ô đều có border đỏ

---

### ✅ TEST 10: Button States
**Bước thực hiện:**
1. Nhập form hợp lệ
2. Click "Thêm"
3. Quan sát button trong quá trình submit

**Kết quả mong đợi:**
- ✅ Button text đổi thành "Đang lưu..."
- ✅ Button bị disable (không click được)
- ✅ Sau khi hoàn tất, button về trạng thái bình thường

---

## 📸 CHECKLIST CHỤP SCREENSHOT

Cần chụp các màn hình sau để nộp bài:

### Screenshot 1: Validation Errors
- [ ] Form hiển thị lỗi "Tên không được để trống"
- [ ] Form hiển thị lỗi "Email không hợp lệ"
- [ ] Border đỏ ở cả 2 ô input

### Screenshot 2: Success Notification
- [ ] Notification xanh "Thêm user thành công!" ở góc phải màn hình
- [ ] User mới xuất hiện trong danh sách

### Screenshot 3: Edit Mode
- [ ] Title "✏️ Sửa User"
- [ ] Form điền sẵn thông tin
- [ ] Button "Cập nhật" và "Hủy"

### Screenshot 4: Complete Interface
- [ ] Toàn bộ giao diện với form validation
- [ ] Danh sách users
- [ ] Design đẹp với gradient và shadow

---

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi test, bạn sẽ thấy:

✅ **Validation hoạt động 100%**
- Không thể submit form với dữ liệu không hợp lệ
- Error messages rõ ràng, dễ hiểu
- UI phản hồi tức thì

✅ **UX tốt**
- Errors tự động biến mất khi sửa
- Success notification đẹp mắt
- Smooth animations

✅ **Code quality cao**
- State management tốt với hooks
- Validation logic rõ ràng
- Clean component structure

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: Không thấy validation errors
**Giải pháp:**
- Kiểm tra xem đã save file `AddUser.jsx` chưa
- Refresh lại trang (Ctrl + R)
- Kiểm tra console có lỗi không

### Lỗi: CSS không hiển thị đúng
**Giải pháp:**
- Clear cache: Ctrl + Shift + R
- Kiểm tra file `index.css` đã save chưa

### Lỗi: Form vẫn submit được khi có lỗi
**Giải pháp:**
- Kiểm tra logic trong hàm `validateForm()`
- Đảm bảo có `if (!validateForm()) return;`

---

**Happy Testing! 🚀**
