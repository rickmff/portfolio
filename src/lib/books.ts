import type { Book } from "@/db/schema";
import type { StageBook } from "@/components/BookStage";

export function toStageBook(b: Book): StageBook {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    status: b.status,
    finishedYear: b.finishedYear,
    color: b.color,
    ink: b.ink,
    coverUrl: b.coverUrl,
    thickness: b.thickness,
    note: b.note,
  };
}

export function statusLabel(b: Pick<Book, "status" | "finishedYear">) {
  if (b.status === "reading") return "Reading now";
  if (b.status === "next") return "Up next";
  return b.finishedYear ? `Read in ${b.finishedYear}` : "Read";
}
