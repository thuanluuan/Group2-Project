import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import './AdminLogViewer.css';

function AdminLogViewer({ onBack }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedAccounts, setBlockedAccounts] = useState([]);
  const [unlockingEmail, setUnlockingEmail] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    action: '',
    status: '',
    email: '',
    startDate: '',
    endDate: '',
  });
  
  const [pagination, setPagination] = useState(null);
  const [actions, setActions] = useState([]);

  useEffect(() => {
    fetchActions();
    fetchLogs();
    fetchStats();
    fetchBlockedAccounts();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters.page]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      
      const res = await api.get('/logs', { params });
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const res = await api.get('/logs/stats', { params });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchActions = async () => {
    try {
      const res = await api.get('/logs/actions');
      setActions(res.data.actions || []);
    } catch (err) {
      console.error('Failed to fetch actions:', err);
    }
  };

  const fetchBlockedAccounts = async () => {
    try {
      const res = await api.get('/logs/blocked');
      setBlockedAccounts(res.data.accounts || []);
    } catch (err) {
      console.error('Failed to fetch blocked accounts:', err);
    }
  };

  const handleUnlockAccount = async (email) => {
    if (!window.confirm(`Bạn có chắc chắn muốn mở khóa tài khoản ${email}?`)) {
      return;
    }

    setUnlockingEmail(email);
    try {
      await api.post('/logs/unlock', { email });
      alert(`Đã mở khóa tài khoản ${email} thành công`);
      fetchBlockedAccounts();
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể mở khóa tài khoản');
    } finally {
      setUnlockingEmail(null);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSearch = () => {
    fetchLogs();
    fetchStats();
  };

  const handleReset = () => {
    setFilters({
      page: 1,
      limit: 50,
      action: '',
      status: '',
      email: '',
      startDate: '',
      endDate: '',
    });
    setTimeout(() => {
      fetchLogs();
      fetchStats();
    }, 100);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: 'badge-success',
      failed: 'badge-failed',
      error: 'badge-error',
    };
    return badges[status] || 'badge-default';
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="admin-log-viewer">
      <div className="log-viewer-header">
        <h2>📊 Quản lý Logs Hệ thống</h2>
        {onBack && (
          <button onClick={onBack} className="button button--ghost button--back">
            ← Quay lại
          </button>
        )}
      </div>

      {/* Blocked Accounts Section */}
      {blockedAccounts.length > 0 && (
        <div className="blocked-section">
          <h3>🔒 Tài khoản đang bị khóa ({blockedAccounts.length})</h3>
          <div className="blocked-list">
            {blockedAccounts.map((account) => (
              <div key={account.email} className="blocked-card">
                <div className="blocked-info">
                  <div className="blocked-email">{account.email}</div>
                  <div className="blocked-details">
                    <span className="badge badge-failed">{account.attempts} lần thử</span>
                    <span className="blocked-time">
                      Còn {account.remainingMinutes} phút
                    </span>
                    <span className="blocked-until">
                      Đến {formatDate(account.blockedUntil)}
                    </span>
                  </div>
                </div>
                <button
                  className="btn-unlock"
                  onClick={() => handleUnlockAccount(account.email)}
                  disabled={unlockingEmail === account.email}
                >
                  {unlockingEmail === account.email ? '⏳ Đang mở...' : '🔓 Mở khóa'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="stats-section">
          <h3>Thống kê</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Theo trạng thái</h4>
              {stats.statusStats.map(s => (
                <div key={s._id} className="stat-item">
                  <span className={`badge ${getStatusBadge(s._id)}`}>
                    {s._id || 'unknown'}
                  </span>
                  <span className="count">{s.count}</span>
                </div>
              ))}
            </div>

            <div className="stat-card">
              <h4>Top Actions</h4>
              {stats.actionStats.slice(0, 5).map(a => (
                <div key={a._id} className="stat-item">
                  <span className="action-name">{a._id}</span>
                  <span className="count">
                    {a.count} ({a.successCount}/{a.failedCount})
                  </span>
                </div>
              ))}
            </div>

            {stats.recentFailedLogins.length > 0 && (
              <div className="stat-card alert-card">
                <h4>⚠️ Login thất bại gần đây</h4>
                {stats.recentFailedLogins.slice(0, 5).map((log, idx) => (
                  <div key={idx} className="stat-item">
                    <span className="email">{log.email || log.ip}</span>
                    <span className="time">{formatDate(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-section">
        <h3>Bộ lọc</h3>
        <div className="filter-grid">
          <div className="filter-item">
            <label>Action:</label>
            <select name="action" value={filters.action} onChange={handleFilterChange}>
              <option value="">-- Tất cả --</option>
              {actions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Status:</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">-- Tất cả --</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Email:</label>
            <input
              type="text"
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
              placeholder="Tìm theo email..."
            />
          </div>

          <div className="filter-item">
            <label>Từ ngày:</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-item">
            <label>Đến ngày:</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-item">
            <label>Số bản ghi/trang:</label>
            <select name="limit" value={filters.limit} onChange={handleFilterChange}>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={handleSearch} className="btn-primary">🔍 Tìm kiếm</button>
          <button onClick={handleReset} className="btn-secondary">🔄 Reset</button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading */}
      {loading && <div className="loading">Đang tải...</div>}

      {/* Logs Table */}
      {!loading && logs.length > 0 && (
        <>
          <div className="table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Email</th>
                  <th>IP</th>
                  <th>Message</th>
                  <th>User Agent</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="date-cell">{formatDate(log.createdAt)}</td>
                    <td className="action-cell">{log.action}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="email-cell">{log.email || '-'}</td>
                    <td className="ip-cell">{log.ip || '-'}</td>
                    <td className="message-cell">{log.message || '-'}</td>
                    <td className="ua-cell" title={log.userAgent}>
                      {log.userAgent ? log.userAgent.substring(0, 50) + '...' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="btn-page"
              >
                ← Trước
              </button>
              <span className="page-info">
                Trang {pagination.page} / {pagination.pages} ({pagination.total} bản ghi)
              </span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.pages}
                className="btn-page"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}

      {!loading && logs.length === 0 && (
        <div className="no-data">Không có logs nào.</div>
      )}
    </div>
  );
}

export default AdminLogViewer;
