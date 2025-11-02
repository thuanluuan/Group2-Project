// Test script cho tính năng unlock account
// Chạy: node test-unlock-feature.js

const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test-unlock@example.com';
const WRONG_PASSWORD = 'wrong_password_123';
const CORRECT_PASSWORD = 'Test123!@#';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123'; // Thay bằng password admin thực tế

// Colors
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

async function registerTestUser() {
  try {
    log('\n📝 Đăng ký tài khoản test...', 'cyan');
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Unlock User',
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

async function blockAccount() {
  log('\n🔒 Block tài khoản bằng cách login sai 5 lần...', 'cyan');
  log('-'.repeat(60), 'cyan');

  for (let i = 1; i <= 5; i++) {
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: WRONG_PASSWORD,
      });
    } catch (error) {
      if (error.response?.status === 401) {
        log(`  [${i}/5] Login failed ✓`, 'blue');
      } else if (error.response?.status === 429) {
        log(`  [${i}/5] Already blocked!`, 'yellow');
        break;
      }
    }
    await sleep(300);
  }

  // Verify blocked
  log('\n🧪 Verify account is blocked...', 'yellow');
  try {
    await axios.post(`${API_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: WRONG_PASSWORD,
    });
    log('❌ FAIL: Account should be blocked!', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 429) {
      const data = error.response.data;
      log('✅ PASS: Account is blocked', 'green');
      log(`   Message: ${data.message}`, 'blue');
      log(`   Remaining: ${data.remainingMinutes} minutes`, 'blue');
      log(`   Admin Email: ${data.adminContactEmail}`, 'blue');
      log(`   Blocked flag: ${data.blocked}`, 'blue');

      if (!data.adminContactEmail) {
        log('⚠️  WARNING: No admin contact email in response!', 'yellow');
      }
      return true;
    } else {
      log(`❌ FAIL: Expected 429, got ${error.response?.status}`, 'red');
      return false;
    }
  }
}

async function getAdminToken() {
  log('\n🔑 Đăng nhập với admin...', 'cyan');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    const token = response.data.accessToken || response.data.token;
    log('✅ Admin login thành công', 'green');
    return token;
  } catch (error) {
    log(`❌ Admin login failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function testBlockedAccountsList(token) {
  log('\n📋 Test: Lấy danh sách blocked accounts...', 'cyan');
  log('-'.repeat(60), 'cyan');

  try {
    const response = await axios.get(`${API_URL}/logs/blocked`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { total, accounts } = response.data;
    log(`✅ PASS: Lấy được danh sách`, 'green');
    log(`   Total blocked: ${total}`, 'blue');

    if (accounts.length > 0) {
      accounts.forEach((acc, idx) => {
        log(`   [${idx + 1}] ${acc.email} - ${acc.attempts} attempts, ${acc.remainingMinutes} min left`, 'blue');
      });

      const testAccount = accounts.find(acc => acc.email === TEST_EMAIL);
      if (testAccount) {
        log(`   ✓ Test account found in blocked list`, 'green');
        return true;
      } else {
        log(`   ⚠️  Test account NOT in blocked list`, 'yellow');
        return false;
      }
    } else {
      log(`   ⚠️  No blocked accounts found`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ FAIL: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testCheckBlockStatus(token) {
  log('\n🔍 Test: Kiểm tra block status của email cụ thể...', 'cyan');
  log('-'.repeat(60), 'cyan');

  try {
    const response = await axios.get(`${API_URL}/logs/blocked/${encodeURIComponent(TEST_EMAIL)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const info = response.data;
    log(`✅ PASS: Lấy được block info`, 'green');
    log(`   Email: ${info.email}`, 'blue');
    log(`   Is Blocked: ${info.isBlocked}`, 'blue');
    log(`   Attempts: ${info.attempts}`, 'blue');
    log(`   Remaining: ${info.remainingMinutes} minutes`, 'blue');

    if (info.isBlocked) {
      log(`   ✓ Account is confirmed blocked`, 'green');
      return true;
    } else {
      log(`   ⚠️  Account should be blocked!`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ FAIL: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testUnlockAccount(token) {
  log('\n🔓 Test: Admin unlock account...', 'cyan');
  log('-'.repeat(60), 'cyan');

  try {
    const response = await axios.post(
      `${API_URL}/logs/unlock`,
      { email: TEST_EMAIL },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    log(`✅ PASS: Unlock thành công`, 'green');
    log(`   Message: ${response.data.message}`, 'blue');

    // Verify by checking block status again
    await sleep(500);
    const checkResponse = await axios.get(`${API_URL}/logs/blocked/${encodeURIComponent(TEST_EMAIL)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!checkResponse.data.isBlocked) {
      log(`   ✓ Verified: Account is no longer blocked`, 'green');
      return true;
    } else {
      log(`   ⚠️  WARNING: Account still shows as blocked!`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ FAIL: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testLoginAfterUnlock() {
  log('\n✅ Test: Login sau khi được unlock...', 'cyan');
  log('-'.repeat(60), 'cyan');

  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: CORRECT_PASSWORD,
    });

    log(`✅ PASS: Login thành công sau unlock!`, 'green');
    log(`   User: ${response.data.user?.name}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ FAIL: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testUnlockLog(token) {
  log('\n📊 Test: Kiểm tra log unlock trong database...', 'cyan');
  log('-'.repeat(60), 'cyan');

  try {
    const response = await axios.get(`${API_URL}/logs?action=account_unlocked&limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const logs = response.data.logs || [];
    log(`✅ PASS: Lấy được unlock logs`, 'green');
    log(`   Total: ${logs.length}`, 'blue');

    if (logs.length > 0) {
      const recentLog = logs[0];
      log(`   Recent unlock:`, 'blue');
      log(`     - Email: ${recentLog.email}`, 'blue');
      log(`     - Status: ${recentLog.status}`, 'blue');
      log(`     - Admin: ${recentLog.metadata?.adminEmail || 'N/A'}`, 'blue');
      return true;
    } else {
      log(`   ⚠️  No unlock logs found`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ FAIL: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n🧪 TEST UNLOCK FEATURE', 'magenta');
  log('='.repeat(60), 'magenta');

  const results = {
    register: false,
    block: false,
    adminLogin: false,
    listBlocked: false,
    checkStatus: false,
    unlock: false,
    loginAfterUnlock: false,
    unlockLog: false,
  };

  // Step 1: Register
  results.register = await registerTestUser();
  if (!results.register) {
    log('\n❌ Không thể tiếp tục test', 'red');
    return;
  }
  await sleep(1000);

  // Step 2: Block account
  results.block = await blockAccount();
  await sleep(1000);

  // Step 3: Admin login
  const adminToken = await getAdminToken();
  results.adminLogin = !!adminToken;
  if (!adminToken) {
    log('\n❌ Không thể test các tính năng admin', 'red');
  } else {
    await sleep(1000);

    // Step 4: List blocked accounts
    results.listBlocked = await testBlockedAccountsList(adminToken);
    await sleep(1000);

    // Step 5: Check block status
    results.checkStatus = await testCheckBlockStatus(adminToken);
    await sleep(1000);

    // Step 6: Unlock account
    results.unlock = await testUnlockAccount(adminToken);
    await sleep(1000);

    // Step 7: Login after unlock
    results.loginAfterUnlock = await testLoginAfterUnlock();
    await sleep(1000);

    // Step 8: Check unlock log
    results.unlockLog = await testUnlockLog(adminToken);
  }

  // Summary
  log('\n' + '='.repeat(60), 'magenta');
  log('📊 KẾT QUẢ TEST', 'magenta');
  log('='.repeat(60), 'magenta');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${icon} ${test.padEnd(20)}: ${passed ? 'PASS' : 'FAIL'}`, color);
  });

  log('\n' + '-'.repeat(60), 'cyan');
  log(`Tổng kết: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  log('='.repeat(60), 'magenta');

  if (passed === total) {
    log('\n🎉 TẤT CẢ TESTS PASSED!', 'green');
  } else {
    log('\n⚠️  Một số tests failed, kiểm tra lại!', 'yellow');
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Lỗi không mong đợi: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
