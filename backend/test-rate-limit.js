// Test script để kiểm tra rate limiting
// Chạy: node test-rate-limit.js

const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test-ratelimit@example.com';
const WRONG_PASSWORD = 'wrong_password_123';
const CORRECT_PASSWORD = 'Test123!@#';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLoginAttempt(attemptNumber, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: password,
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      message: error.response?.data?.message,
      remainingMinutes: error.response?.data?.remainingMinutes,
    };
  }
}

async function registerTestUser() {
  try {
    log('\n📝 Đăng ký tài khoản test...', 'cyan');
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Rate Limit User',
      email: TEST_EMAIL,
      password: CORRECT_PASSWORD,
      dob: '1990-01-01',
    });
    log('✅ Đăng ký thành công', 'green');
    return true;
  } catch (error) {
    if (error.response?.status === 409) {
      log('⚠️  Tài khoản đã tồn tại, tiếp tục test...', 'yellow');
      return true;
    }
    log(`❌ Lỗi đăng ký: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testRateLimiting() {
  log('\n🧪 BẮT ĐẦU TEST RATE LIMITING', 'magenta');
  log('='.repeat(60), 'magenta');

  // Step 1: Register test user
  const registered = await registerTestUser();
  if (!registered) {
    log('❌ Không thể tiếp tục test', 'red');
    return;
  }

  await sleep(1000);

  // Step 2: Test failed login attempts
  log('\n🔐 Test 1: Thử đăng nhập sai 5 lần', 'cyan');
  log('-'.repeat(60), 'cyan');

  for (let i = 1; i <= 5; i++) {
    log(`\n[Attempt ${i}/5] Đăng nhập với password sai...`, 'yellow');
    const result = await testLoginAttempt(i, WRONG_PASSWORD);

    if (result.success) {
      log('❌ Test failed: Login không nên thành công!', 'red');
      return;
    }

    if (result.status === 429) {
      log(`⚠️  Đã bị block sau ${i - 1} lần thử!`, 'yellow');
      log(`   Message: ${result.message}`, 'yellow');
      break;
    } else if (result.status === 401) {
      log(`✅ Attempt ${i}: Login failed như mong đợi`, 'green');
      log(`   Message: ${result.message}`, 'blue');
    }

    await sleep(500);
  }

  // Step 3: Test blocking
  log('\n🚫 Test 2: Thử đăng nhập lần thứ 6 (nên bị block)', 'cyan');
  log('-'.repeat(60), 'cyan');

  const blockedResult = await testLoginAttempt(6, WRONG_PASSWORD);

  if (blockedResult.status === 429) {
    log('✅ PASS: Tài khoản đã bị block!', 'green');
    log(`   Message: ${blockedResult.message}`, 'green');
    if (blockedResult.remainingMinutes) {
      log(`   Thời gian còn lại: ${blockedResult.remainingMinutes} phút`, 'green');
    }
  } else {
    log('❌ FAIL: Tài khoản không bị block như mong đợi!', 'red');
  }

  // Step 4: Test với password đúng (vẫn bị block)
  log('\n🔐 Test 3: Thử đăng nhập với password đúng (vẫn bị block)', 'cyan');
  log('-'.repeat(60), 'cyan');

  const correctPasswordResult = await testLoginAttempt(7, CORRECT_PASSWORD);

  if (correctPasswordResult.status === 429) {
    log('✅ PASS: Vẫn bị block ngay cả khi dùng password đúng!', 'green');
    log(`   Message: ${correctPasswordResult.message}`, 'green');
  } else if (correctPasswordResult.success) {
    log('❌ FAIL: Login thành công - Block không hoạt động!', 'red');
  }

  // Step 5: Test logs API
  log('\n📊 Test 4: Kiểm tra logs API', 'cyan');
  log('-'.repeat(60), 'cyan');

  // First login with admin to get token
  log('Đăng nhập với admin...', 'yellow');
  try {
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin123', // Thay bằng password admin thực tế
    });

    const token = adminLogin.data.accessToken || adminLogin.data.token;

    if (token) {
      log('✅ Đăng nhập admin thành công', 'green');

      // Get logs
      log('Lấy danh sách logs...', 'yellow');
      const logsResponse = await axios.get(`${API_URL}/logs?action=login&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const logs = logsResponse.data.logs || [];
      log(`✅ Lấy được ${logs.length} logs`, 'green');

      const failedLogins = logs.filter(l => l.status === 'failed');
      log(`   - Failed logins: ${failedLogins.length}`, 'blue');

      // Get stats
      log('Lấy thống kê logs...', 'yellow');
      const statsResponse = await axios.get(`${API_URL}/logs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      log('✅ Lấy stats thành công:', 'green');
      log(`   - Status stats: ${JSON.stringify(statsResponse.data.statusStats)}`, 'blue');
      log(`   - Recent failed logins: ${statsResponse.data.recentFailedLogins?.length || 0}`, 'blue');
    }
  } catch (error) {
    log(`⚠️  Không thể test logs API: ${error.response?.data?.message || error.message}`, 'yellow');
    log('   (Có thể do admin credentials không đúng)', 'yellow');
  }

  // Summary
  log('\n' + '='.repeat(60), 'magenta');
  log('🎉 HOÀN THÀNH TEST RATE LIMITING', 'magenta');
  log('='.repeat(60), 'magenta');

  log('\n📋 Kết quả mong đợi:', 'cyan');
  log('1. ✅ 5 lần đăng nhập sai đầu tiên: Status 401', 'green');
  log('2. ✅ Lần thứ 6 trở đi: Status 429 (blocked)', 'green');
  log('3. ✅ Logs được ghi vào MongoDB', 'green');
  log('4. ✅ Admin có thể xem logs qua API', 'green');

  log('\n📌 Kiểm tra MongoDB:', 'cyan');
  log('   db.logs.find({ action: "login", status: "failed" }).sort({ createdAt: -1 }).limit(10)', 'blue');
  log('   db.logs.find({ action: "login_blocked" }).sort({ createdAt: -1 }).limit(5)', 'blue');
}

// Run test
testRateLimiting().catch(error => {
  log(`\n❌ Lỗi không mong đợi: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
