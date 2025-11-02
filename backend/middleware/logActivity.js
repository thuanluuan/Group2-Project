const Log = require("../models/Log");

/**
 * Middleware để ghi lại hoạt động người dùng
 * @param {string} action - Tên hành động (vd: 'login', 'register', 'update_profile')
 * @param {object} options - Các tùy chọn bổ sung
 * @returns {Function} Express middleware
 */
function logActivity(action, options = {}) {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Capture response để biết kết quả
    res.send = function (data) {
      res.locals.responseData = data;
      originalSend.call(this, data);
    };
    
    res.json = function (data) {
      res.locals.responseData = data;
      originalJson.call(this, data);
    };
    
    // Ghi log sau khi response được gửi
    res.on('finish', async () => {
      try {
        const logData = {
          action,
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent'),
          status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 
                  res.statusCode >= 400 && res.statusCode < 500 ? 'failed' : 'error',
        };
        
        // Thông tin người dùng nếu có (từ token hoặc request body)
        if (req.user) {
          logData.userId = req.user.sub;
          logData.email = req.user.email;
        } else if (req.body?.email) {
          logData.email = req.body.email;
        }
        
        // Message từ response
        if (res.locals.responseData) {
          try {
            const responseObj = typeof res.locals.responseData === 'string' 
              ? JSON.parse(res.locals.responseData) 
              : res.locals.responseData;
            if (responseObj.message) {
              logData.message = responseObj.message;
            }
          } catch (e) {
            // Ignore parse error
          }
        }
        
        // Metadata tùy chọn
        if (options.metadata) {
          logData.metadata = typeof options.metadata === 'function' 
            ? options.metadata(req, res) 
            : options.metadata;
        }
        
        await Log.create(logData);
      } catch (err) {
        console.error('Error logging activity:', err);
      }
    });
    
    next();
  };
}

/**
 * Ghi log trực tiếp (không qua middleware)
 * @param {object} data - Dữ liệu log
 */
async function createLog(data) {
  try {
    await Log.create({
      ...data,
      timestamp: data.timestamp || new Date(),
    });
  } catch (err) {
    console.error('Error creating log:', err);
  }
}

module.exports = { logActivity, createLog };
