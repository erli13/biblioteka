"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createBook, updateBook, type BookFormData } from "../actions";

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

type Props = {
  book: Book | null; // null = create new, Book = edit existing
  onClose: () => void;
  onSuccess: () => void;
};

const INPUT =
  "w-full border-2 border-black bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 outline-none focus:border-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const LABEL = "block text-[10px] font-black uppercase tracking-widest text-black mb-1";

export default function BookFormModal({ book, onClose, onSuccess }: Props) {
  const isEdit = book !== null;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BookFormData>({
    title: book?.title ?? "",
    author: book?.author ?? "",
    description: book?.description ?? "",
    coverUrl: book?.coverUrl ?? "",
    quantity: book?.quantity ?? 1,
    location: book?.location ?? "",
    genre: book?.genre ?? "",
  });

  useEffect(() => {
    titleRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, isPending]);

  const field =
    (key: keyof BookFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({
        ...prev,
        [key]: key === "quantity" ? Math.max(0, parseInt(e.target.value) || 0) : e.target.value,
      }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateBook(book.id, form)
        : await createBook(form);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="bg-white border-2 border-black w-full max-w-lg max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-black text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-black text-sm tracking-widest uppercase text-yellow-400">
              {isEdit ? "Edit Book" : "Add New Book"}
            </h2>
            {isEdit && (
              <p className="text-[10px] text-gray-400 mt-0.5 font-mono">ID #{book.id}</p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 p-5 space-y-4"
        >
          {/* Title */}
          <div>
            <label className={LABEL}>Title *</label>
            <input
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={field("title")}
              placeholder="Book title"
              disabled={isPending}
              className={INPUT}
            />
          </div>

          {/* Author + Genre */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Author</label>
              <input
                type="text"
                value={form.author}
                onChange={field("author")}
                placeholder="Author name"
                disabled={isPending}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Genre</label>
              <input
                type="text"
                value={form.genre}
                onChange={field("genre")}
                placeholder="e.g. Roman"
                disabled={isPending}
                className={INPUT}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={LABEL}>Description</label>
            <textarea
              value={form.description}
              onChange={field("description")}
              placeholder="Short synopsis or description…"
              disabled={isPending}
              rows={3}
              className={`${INPUT} resize-none`}
            />
          </div>

          {/* Cover URL */}
          <div>
            <label className={LABEL}>Cover URL</label>
            <input
              type="text"
              value={form.coverUrl}
              onChange={field("coverUrl")}
              placeholder="https://…"
              disabled={isPending}
              className={INPUT}
            />
            {form.coverUrl && (
              <div className="mt-2 border-2 border-black w-14 h-20 overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.coverUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            )}
          </div>

          {/* Quantity + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={field("quantity")}
                min={0}
                disabled={isPending}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Shelf Location *</label>
              <input
                type="text"
                value={form.location}
                onChange={field("location")}
                placeholder="e.g. A-12"
                disabled={isPending}
                className={INPUT}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="border-2 border-red-500 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 flex items-center gap-2">
              <span>⚠</span>
              {error}
            </div>
          )}
        </form>

        {/* Footer actions — outside scroll area */}
        <div className="flex border-t-2 border-black shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 text-sm font-black uppercase tracking-widest border-r-2 border-black bg-white text-black hover:-translate-y-0.5 transition-transform duration-100 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="book-form"
            disabled={isPending}
            onClick={handleSubmit}
            className="flex-1 py-3 text-sm font-black uppercase tracking-widest bg-yellow-400 text-black hover:-translate-y-0.5 transition-transform duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Book"}
          </button>
        </div>
      </div>
    </div>
  );
}
