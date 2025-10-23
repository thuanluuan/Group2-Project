import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";
import { useConfirm } from "./ConfirmDialog";

export default function AdminUserList({ onSelect, refreshKey = 0, onDeleted }) {
  const confirm = useConfirm?.();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [q, setQ] = useState("");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [autoFocusOnExact, setAutoFocusOnExact] = useState(false);
  const allNonAdmins = useMemo(() => users.filter(u => u.role !== 'admin').map(u => u._id), [users]);
  const exactLC = useMemo(() => (q || '').trim().toLowerCase(), [q]);
  const itemRefs = useRef({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/users', { params: { q: q || undefined, page, limit } });
        const payload = res.data;
        if (!cancelled) {
          const list = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
          setUsers(list);
          setTotalPages(payload?.totalPages || 1);
          setTotal(payload?.total || list.length);
        }
      } catch (e) {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey, q, page, limit]);

  // Note: Search is triggered only by Enter key or clicking the Tìm button to avoid fetching on every keystroke.

  // Auto-select and scroll exact match into view after search triggers
  useEffect(() => {
    if (!autoFocusOnExact) return;
    if (!exactLC) { setAutoFocusOnExact(false); return; }
    const target = users.find(u => (
      (u.name && String(u.name).toLowerCase() === exactLC) ||
      (u.email && String(u.email).toLowerCase() === exactLC)
    ));
    if (target) {
      onSelect?.(target);
      const el = itemRefs.current[target._id];
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    setAutoFocusOnExact(false);
  }, [autoFocusOnExact, users, exactLC, onSelect]);

  if (loading) return <div className="card"><div className="card__body">Đang tải...</div></div>;

  return (
    <div className="card">
      <div className="card__header">Danh sách tài khoản</div>
      <div className="card__body">
        <div className="row" style={{ marginBottom: 10, gap: 8 }}>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setAutoFocusOnExact(true); setQ(searchText); } }}
            type="text" className="input" placeholder="Tìm theo tên hoặc email..."
            style={{ flex: 1 }}
          />
          <button type="button" className="button button--ghost" onClick={() => { setPage(1); setAutoFocusOnExact(true); setQ(searchText); }}>Tìm</button>
        </div>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
          <div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={allNonAdmins.length > 0 && selectedIds.length === allNonAdmins.length}
                onChange={(e) => {
                  if (e.target.checked) setSelectedIds(allNonAdmins);
                  else setSelectedIds([]);
                }}
              />
              <span>Chọn tất cả (không gồm admin)</span>
            </label>
          </div>
          <div>
            <button type="button"
              className="button button--danger"
              disabled={selectedIds.length === 0}
              onClick={async () => {
                if (selectedIds.length === 0) return;
                const ok = await (confirm ? confirm(`Xóa ${selectedIds.length} tài khoản đã chọn? Hành động này không thể hoàn tác.`) : Promise.resolve(window.confirm(`Xóa ${selectedIds.length} tài khoản đã chọn? Hành động này không thể hoàn tác.`)));
                if (!ok) return;
                try {
                  const res = await api.post('/users/batch-delete', { ids: selectedIds });
                  // Refresh list and inform parent
                  setSelectedIds([]);
                  onDeleted?.(res.data);
                } catch (e) {
                  alert(e?.response?.data?.message || 'Xóa thất bại');
                }
              }}
            >Xóa đã chọn</button>
          </div>
        </div>
        <ul className="list">
          {users.map(u => {
            const isExact = !!exactLC && (
              (u.name && String(u.name).toLowerCase() === exactLC) ||
              (u.email && String(u.email).toLowerCase() === exactLC)
            );
            return (
            <li
              key={u._id}
              ref={(el) => { if (el) itemRefs.current[u._id] = el; }}
              className={`item${isExact ? ' item--highlight' : ''}`}
              style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', alignItems: 'center', gap: 10 }}
            >
              <input
                type="checkbox"
                disabled={u.role === 'admin'}
                checked={selectedIds.includes(u._id)}
                onChange={(e) => {
                  setSelectedIds((prev) => {
                    const set = new Set(prev);
                    if (e.target.checked) set.add(u._id);
                    else set.delete(u._id);
                    return Array.from(set);
                  });
                }}
              />
              <div style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', background: '#1b2230', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{String(u.name || u.email || '?').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div onClick={() => onSelect?.(u)} style={{ cursor: 'pointer' }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {u.name}
                  {isExact && <span className="chip chip--accent">trùng khớp</span>}
                </div>
                <div className="meta">{u.email}</div>
              </div>
            </li>
          );})}
        </ul>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <button className="button button--ghost" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p-1))}>Trang trước</button>
          <div className="meta">Trang {page}/{totalPages} • Tổng {total}</div>
          <button className="button button--ghost" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Trang sau</button>
        </div>
      </div>
    </div>
  );
}

