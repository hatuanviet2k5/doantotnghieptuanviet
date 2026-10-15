import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  keyExtractor?: (row: T, index: number) => string | number;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  pageSize = 10,
  keyExtractor,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const currentData = data.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600 tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className={`px-6 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <LoadingSpinner size="md" text="Đang tải dữ liệu..." />
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-500">
                  <p className="font-medium">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              currentData.map((row, rowIdx) => {
                const rowKey = keyExtractor
                  ? keyExtractor(row, startIndex + rowIdx)
                  : ((row as any).id || startIndex + rowIdx);
                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-6 py-4 ${col.className || ''}`}>
                        {col.render
                          ? col.render(row)
                          : col.accessor
                          ? (row[col.accessor] as any)
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-t border-slate-200/70 bg-slate-50/50 gap-3">
          <p className="text-xs text-slate-500">
            Hiển thị <span className="font-semibold text-slate-700">{startIndex + 1}</span> -{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(startIndex + pageSize, data.length)}
            </span>{' '}
            trên tổng số <span className="font-semibold text-slate-700">{data.length}</span> bản ghi
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(1)}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Trang đầu"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium px-3 text-slate-700">
              Trang {safeCurrentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Trang tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Trang cuối"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
