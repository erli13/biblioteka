"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type BookFormData = {
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  quantity: number;
  location: string;
  genre: string;
};

export async function createBook(
  data: BookFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.title.trim()) return { success: false, error: "Title is required." };
    if (!data.location.trim()) return { success: false, error: "Location is required." };

    await prisma.book.create({
      data: {
        title: data.title.trim(),
        author: data.author.trim() || null,
        description: data.description.trim() || null,
        coverUrl: data.coverUrl.trim() || null,
        quantity: data.quantity,
        location: data.location.trim(),
        genre: data.genre.trim() || null,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to create book. Please try again." };
  }
}

export async function updateBook(
  id: number,
  data: BookFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.title.trim()) return { success: false, error: "Title is required." };
    if (!data.location.trim()) return { success: false, error: "Location is required." };

    await prisma.book.update({
      where: { id },
      data: {
        title: data.title.trim(),
        author: data.author.trim() || null,
        description: data.description.trim() || null,
        coverUrl: data.coverUrl.trim() || null,
        quantity: data.quantity,
        location: data.location.trim(),
        genre: data.genre.trim() || null,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update book. Please try again." };
  }
}

export async function deleteBook(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.book.delete({ where: { id } });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete book. Please try again." };
  }
}
