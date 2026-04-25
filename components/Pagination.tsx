
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100],
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Build visible page numbers: always show first, last, current ±1, with ellipsis
  const getPages = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (page > 3) pages.push('ellipsis');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
      <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <span>
          {total === 0 ? 'No results' : `${from}–${to} of ${total}`}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
            className="border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black text-slate-600 bg-white outline-none cursor-pointer"
          >
            {pageSizeOptions.map(s => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {getPages().map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="h-8 w-8 flex items-center justify-center text-slate-300 text-[10px] font-black">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`h-8 w-8 rounded-lg text-[10px] font-black transition-colors ${
                p === page
                  ? 'bg-brand text-white border border-brand'
                  : 'border border-slate-200 text-slate-500 hover:border-brand hover:text-brand'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
