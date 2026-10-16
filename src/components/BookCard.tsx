import React from 'react';
import { Book as BookType } from '@/types';
import { BookOpen, Bookmark, User as UserIcon, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BookCoverImage } from './BookCoverImage';

interface BookCardProps {
  book: BookType;
  onHold?: (book: BookType) => void;
  showHoldButton?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onHold,
  showHoldButton = true,
}) => {
  const isAvailable = book.availableCopies > 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
        <BookCoverImage
          src={book.coverImage}
          bookId={book.id}
          alt={book.title}
          title={book.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Status Badge Overlay */}
        <div className="absolute top-3 right-3">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Còn {book.availableCopies} cuốn
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/90 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <XCircle className="w-3.5 h-3.5" />
              Đã hết sách
            </span>
          )}
        </div>

        {/* Category tag */}
        {book.categoryName && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-block rounded-lg bg-slate-900/75 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white">
              {book.categoryName}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <Link
            to={`/books/${book.id}`}
            className="line-clamp-2 text-base font-bold text-slate-900 hover:text-primary-600 transition"
            title={book.title}
          >
            {book.title}
          </Link>

          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            <UserIcon className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span className="truncate">{book.authorName || 'Không rõ tác giả'}</span>
          </p>

          <p className="mt-1 text-xs text-slate-400">
            ISBN: <span className="font-mono">{book.isbn}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <Link
            to={`/books/${book.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Chi tiết
          </Link>

          {showHoldButton && (
            <button
              onClick={() => onHold && onHold(book)}
              disabled={!isAvailable}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Đăng ký mượn
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
