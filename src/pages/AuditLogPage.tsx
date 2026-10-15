import React, { useState, useEffect } from 'react';
import { AuditLog } from '@/types';
import { auditLogService } from '@/services/auditLogService';
import { DataTable, Column } from '@/components/DataTable';
import {
  ShieldAlert,
  Search,
  Calendar,
  Filter,
  User,
  RotateCcw,
  Clock,
  Terminal,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditLogService.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      toast.error('Không thể tải nhật ký: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('DUYỆT') || act.includes('THÊM') || act.includes('TẠO')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {action}
        </span>
      );
    }
    if (act.includes('XOÁ') || act.includes('HUỶ') || act.includes('KHOÁ')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          {action}
        </span>
      );
    }
    if (act.includes('SỬA') || act.includes('CẬP_NHẬT') || act.includes('TRẢ')) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          {action}
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        {action}
      </span>
    );
  };

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      log.actorName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      log.entityId.toLowerCase().includes(q);

    const matchesAction = !actionFilter || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const columns: Column<AuditLog>[] = [
    {
      header: 'Thời gian',
      accessor: 'timestamp',
      render: (l) => (
        <div className="text-xs text-slate-600">
          <p className="font-semibold text-slate-800">
            {new Date(l.timestamp).toLocaleDateString('vi-VN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" />
            {new Date(l.timestamp).toLocaleTimeString('vi-VN')}
          </p>
        </div>
      ),
    },
    {
      header: 'Người thực hiện',
      render: (l) => (
        <div>
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {l.actorName}
          </span>
          <span className="text-[11px] text-primary-700 font-semibold font-mono">
            [{l.actorRole}]
          </span>
        </div>
      ),
    },
    {
      header: 'Hành động',
      accessor: 'action',
      render: (l) => getActionBadge(l.action),
    },
    {
      header: 'Đối tượng tác động',
      render: (l) => (
        <div className="text-xs font-mono">
          <span className="text-slate-500">{l.entityType}: </span>
          <span className="font-bold text-slate-800">{l.entityId}</span>
        </div>
      ),
    },
    {
      header: 'Chi tiết thao tác',
      accessor: 'details',
      render: (l) => <span className="text-xs text-slate-600 line-clamp-2">{l.details || '-'}</span>,
    },
    {
      header: 'Địa chỉ IP',
      accessor: 'ipAddress',
      render: (l) => (
        <span className="font-mono text-xs text-slate-400">{l.ipAddress || '127.0.0.1'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary-600" />
            <span>Nhật Ký Hệ Thống (Audit Logs)</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi và ghi nhận toàn bộ các thao tác nghiệp vụ, bảo mật trong thư viện
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          Làm mới nhật ký
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo người thực hiện, hành động, đối tượng tác động..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Tất cả loại hành động --</option>
            <option value="DUYỆT_PHIẾU_MƯỢN">DUYỆT_PHIẾU_MƯỢN</option>
            <option value="NHẬN_TRẢ_SÁCH">NHẬN_TRẢ_SÁCH</option>
            <option value="GIỮ_SÁCH_ONLINE">GIỮ_SÁCH_ONLINE</option>
            <option value="CẬP_NHẬT_KỆ_SÁCH">CẬP_NHẬT_KỆ_SÁCH</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        loading={loading}
        emptyMessage="Không có nhật ký nào phù hợp"
        pageSize={10}
      />
    </div>
  );
};
