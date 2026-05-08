"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BookFormModal from "./_components/BookFormModal";
import { deleteBook } from "./actions";

type Book = {
  id: number;
  title: string;
  author: string | null;
  location: string;
  quantity: number;
  coverUrl: string | null;
  description: string | null;
  genre: string | null;
};

type ApiResponse = {
  books: Book[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
};

// ── shared button variants ────────────────────────────────────────────────────

const BTN_BASE =
  "border-2 border-black font-black uppercase tracking-wide transition-all duration-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
const BTN_YELLOW = `${BTN_BASE} bg-yellow-400 text-black hover:-translate-y-0.5`;
const BTN_WHITE = `${BTN_BASE} bg-white text-black hover:bg-yellow-400 hover:-translate-y-0.5`;
const BTN_RED = `${BTN_BASE} bg-white text-black hover:bg-red-500 hover:text-white hover:border-red-500 hover:-translate-y-0.5`;
const BTN_GHOST_WHITE = `border-2 border-white font-black uppercase tracking-wide text-white hover:-translate-y-0.5 transition-transform duration-100`;
const BTN_GHOST_YELLOW = `border-2 border-yellow-400 font-black uppercase tracking-wide text-yellow-400 hover:-translate-y-0.5 transition-transform duration-100`;

// ── main dashboard ────────────────────────────────────────────────────────────

function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const initialPage = parseInt(searchParams.get("page") ?? "1", 10);

  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // modal state: false = closed, null = create, Book = edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBooks = useCallback(async (q: string, page: number) => {
    setTableLoading(true);
    setSelected(new Set());
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/books?${params}`);
    const json: ApiResponse = await res.json();
    setData(json);
    setTableLoading(false);
  }, []);

  useEffect(() => {
    fetchBooks(initialQuery, initialPage);
  }, []); // eslint-disable-line

  const pushParams = useCallback(
    (q: string, page: number) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (page > 1) params.set("page", String(page));
      router.push(`?${params}`, { scroll: false });
    },
    [router]
  );

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams(value, 1);
      fetchBooks(value, 1);
    }, 350);
  };

  const handlePage = (page: number) => {
    pushParams(query, page);
    fetchBooks(query, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"?\n\nThis action cannot be undone.`)) return;
    setDeletingId(id);
    const result = await deleteBook(id);
    setDeletingId(null);
    if (result.success) {
      fetchBooks(query, data?.page ?? 1);
    } else {
      alert(result.error ?? "Delete failed.");
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (
      !window.confirm(
        `Delete ${selected.size} selected book${selected.size > 1 ? "s" : ""}?\n\nThis action cannot be undone.`
      )
    )
      return;

    setBulkDeleting(true);
    await fetch("/api/admin/books", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setBulkDeleting(false);
    fetchBooks(query, data?.page ?? 1);
  };

  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (!data) return;
    const ids = data.books.map((b) => b.id);
    const allChecked = ids.every((id) => selected.has(id));
    setSelected(allChecked ? new Set() : new Set(ids));
  };

  const allChecked =
    !!data && data.books.length > 0 && data.books.every((b) => selected.has(b.id));

  const openCreate = () => {
    setEditingBook(null);
    setModalOpen(true);
  };

  const openEdit = (book: Book) => {
    setEditingBook(book);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleModalSuccess = () => {
    setModalOpen(false);
    fetchBooks(query, data?.page ?? 1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="bg-black border-b-4 border-yellow-400">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-black text-lg tracking-widest uppercase text-yellow-400">
              Admin Dashboard
            </h1>
            <p className="text-[11px] font-mono text-gray-400 mt-0.5">
              {data
                ? `${data.total.toLocaleString()} books · page ${data.page} of ${data.totalPages}`
                : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="/admin/enrich" className={`${BTN_GHOST_YELLOW} text-xs px-3 py-1.5`}>
              Enrich →
            </a>
            <a href="/" className={`${BTN_GHOST_WHITE} text-xs px-3 py-1.5`}>
              ← Catalog
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-4">
        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex-1 flex items-center border-2 border-black bg-white max-w-sm">
            <svg
              className="ml-3 w-4 h-4 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by title or author…"
              className="flex-1 px-3 py-2 text-sm text-black bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            {/* Bulk delete — only appears when rows are selected */}
            {selected.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className={`${BTN_RED} text-xs px-3 py-2`}
              >
                {bulkDeleting ? "Deleting…" : `Delete (${selected.size})`}
              </button>
            )}

            {/* Add button */}
            <button onClick={openCreate} className={`${BTN_YELLOW} text-sm px-4 py-2`}>
              + Add New Book
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="border-2 border-black overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="accent-yellow-400 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 text-left font-black text-[10px] uppercase tracking-widest text-yellow-400 w-14">
                  ID
                </th>
                <th className="px-3 py-3 text-left font-black text-[10px] uppercase tracking-widest text-yellow-400">
                  Title
                </th>
                <th className="px-3 py-3 text-left font-black text-[10px] uppercase tracking-widest text-yellow-400 hidden sm:table-cell">
                  Author
                </th>
                <th className="px-3 py-3 text-left font-black text-[10px] uppercase tracking-widest text-yellow-400 hidden lg:table-cell">
                  Genre
                </th>
                <th className="px-3 py-3 text-left font-black text-[10px] uppercase tracking-widest text-yellow-400 hidden md:table-cell">
                  Location
                </th>
                <th className="px-3 py-3 text-center font-black text-[10px] uppercase tracking-widest text-yellow-400 hidden md:table-cell w-12">
                  Qty
                </th>
                <th className="px-3 py-3 text-right font-black text-[10px] uppercase tracking-widest text-yellow-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {tableLoading
                ? Array.from({ length: 12 }).map((_, i) => (
                    <tr key={i} className="border-t border-black/10">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="h-3.5 animate-pulse bg-gray-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.books.map((book, i) => {
                    const isSelected = selected.has(book.id);
                    const isDeleting = deletingId === book.id;
                    return (
                      <tr
                        key={book.id}
                        className={`border-t border-black/10 transition-colors ${
                          isSelected
                            ? "bg-yellow-50"
                            : i % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50/60"
                        } hover:bg-yellow-50`}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(book.id)}
                            className="accent-yellow-400 cursor-pointer"
                          />
                        </td>

                        {/* ID */}
                        <td className="px-3 py-2.5 font-mono text-[11px] text-gray-400">
                          {book.id}
                        </td>

                        {/* Title */}
                        <td className="px-3 py-2.5 font-bold text-black max-w-[180px]">
                          <span className="block truncate" title={book.title}>
                            {book.title}
                          </span>
                          {/* Author visible on mobile */}
                          <span className="block text-xs text-gray-400 font-normal sm:hidden truncate">
                            {book.author ?? "—"}
                          </span>
                        </td>

                        {/* Author */}
                        <td className="px-3 py-2.5 text-gray-600 hidden sm:table-cell max-w-[140px]">
                          <span className="block truncate">{book.author ?? "—"}</span>
                        </td>

                        {/* Genre */}
                        <td className="px-3 py-2.5 hidden lg:table-cell">
                          {book.genre ? (
                            <span className="border border-black px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide">
                              {book.genre}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-600 hidden md:table-cell">
                          {book.location}
                        </td>

                        {/* Qty */}
                        <td className="px-3 py-2.5 text-center hidden md:table-cell">
                          <span
                            className={`inline-block min-w-[24px] text-center font-black text-sm border-2 border-black px-1 ${
                              book.quantity === 0 ? "bg-red-100 text-red-700" : "bg-white"
                            }`}
                          >
                            {book.quantity}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(book)}
                              className={`${BTN_WHITE} text-[10px] px-2.5 py-1`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(book.id, book.title)}
                              disabled={isDeleting}
                              className={`${BTN_RED} text-[10px] px-2.5 py-1`}
                            >
                              {isDeleting ? "…" : "Del"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>

          {!tableLoading && data?.books.length === 0 && (
            <div className="py-16 text-center border-t-2 border-black">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                No books found
              </p>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-gray-500">
              {data.total.toLocaleString()} books · page {data.page}/{data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePage(data.page - 1)}
                disabled={data.page <= 1}
                className={`${BTN_WHITE} text-xs px-3 py-1.5`}
              >
                ← Prev
              </button>
              <button
                onClick={() => handlePage(data.page + 1)}
                disabled={data.page >= data.totalPages}
                className={`${BTN_WHITE} text-xs px-3 py-1.5`}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Modal ── */}
      {modalOpen && (
        <BookFormModal
          book={editingBook}
          onClose={closeModal}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminDashboard />
    </Suspense>
  );
}
