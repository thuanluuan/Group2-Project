import axios from "axios";

// Đọc URL backend từ biến môi trường CRA: REACT_APP_API_URL
// Ví dụ: REACT_APP_API_URL=http://192.168.1.10:3000
// Nếu không có, mặc định dùng http://localhost:3000
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
