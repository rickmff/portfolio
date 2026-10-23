import type { BookStatus } from "@/db/schema";

export const LOCALES = ["en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "lang";

const en = {
  intl: "en",
  nav: { work: "Work", books: "Books", writing: "Writing", harness: "Harness", about: "About", email: "Email" },
  home: {
    now: "Now",
    latestWork: "Latest Work",
    recentlyRead: "Recently read",
    allBooks: "All books →",
    writing: "Writing",
    allWriting: "All writing →",
    noProjects: "No projects yet.",
  },
  books: {
    eyebrow: "Library",
    title: "Books that changed how I build things.",
    readAndReading: "Read & reading",
    status: { reading: "Reading", read: "Read", next: "Waitlist", wishlist: "Waitlist", abandoned: "Put down" } as Record<BookStatus, string>,
    readingNow: "Reading now",
    readIn: (y: number) => `Read in ${y}`,
    hint: "Pick a book off the shelf · click it again to open · ← → to browse · Esc to put it back",
    openBook: "Open the book →",
    openPageFor: (t: string) => `Open the page for ${t}`,
    clickAgain: "Click again to open the book",
    by: (t: string, a: string) => `${t} by ${a}`,
    synopsis: "Synopsis",
    notes: "My notes",
    readFree: "Read it free · public domain ↗",
    all: "← All books",
    coverOf: (t: string) => `Cover of ${t}`,
    model: (t: string) => `3D model of ${t}. Drag or use the arrow keys to turn it.`,
    dragHint: "Drag to turn the book",
    spoilers: "Spoilers · hidden",
    reveal: "Reveal notes",
    hide: "Hide again",
  },
  blog: {
    eyebrow: "Writing",
    title: "Notes on software, products and self‑hosting.",
    minRead: (n: number) => `${n} min read`,
    all: "← All writing",
    empty: "Nothing published yet.",
  },
  work: { visit: "Visit ↗", source: "Source ↗", all: "← All work" },
  about: { eyebrow: "About" },
  harness: { eyebrow: "Harness", title: "The tools and setup I build with.", empty: "Coming soon." },
  language: "Language",
};

export type Dict = typeof en;

const pt: Dict = {
  intl: "pt-BR",
  nav: { work: "Projetos", books: "Livros", writing: "Textos", harness: "Harness", about: "Sobre", email: "Email" },
  home: {
    now: "Agora",
    latestWork: "Trabalhos recentes",
    recentlyRead: "Lidos recentemente",
    allBooks: "Todos os livros →",
    writing: "Textos",
    allWriting: "Todos os textos →",
    noProjects: "Nenhum projeto ainda.",
  },
  books: {
    eyebrow: "Biblioteca",
    title: "Livros que mudaram o jeito como eu construo coisas.",
    readAndReading: "Lidos e lendo",
    status: { reading: "Lendo", read: "Lido", next: "Lista de espera", wishlist: "Lista de espera", abandoned: "Abandonei" },
    readingNow: "Lendo agora",
    readIn: (y: number) => `Lido em ${y}`,
    hint: "Escolha um livro da estante · clique de novo para abrir · ← → para navegar · Esc para guardar",
    openBook: "Abrir o livro →",
    openPageFor: (t: string) => `Abrir a página de ${t}`,
    clickAgain: "Clique de novo para abrir o livro",
    by: (t: string, a: string) => `${t}, de ${a}`,
    synopsis: "Sinopse",
    notes: "Minhas notas",
    readFree: "Ler grátis · domínio público ↗",
    all: "← Todos os livros",
    coverOf: (t: string) => `Capa de ${t}`,
    model: (t: string) => `Modelo 3D de ${t}. Arraste ou use as setas para girar.`,
    dragHint: "Arraste para girar o livro",
    spoilers: "Spoilers · escondido",
    reveal: "Revelar notas",
    hide: "Esconder de novo",
  },
  blog: {
    eyebrow: "Textos",
    title: "Notas sobre software, produtos e self‑hosting.",
    minRead: (n: number) => `${n} min de leitura`,
    all: "← Todos os textos",
    empty: "Nada publicado ainda.",
  },
  work: { visit: "Visitar ↗", source: "Código ↗", all: "← Todos os projetos" },
  about: { eyebrow: "Sobre" },
  harness: { eyebrow: "Harness", title: "As ferramentas e o setup com que eu construo.", empty: "Em breve." },
  language: "Idioma",
};

export const DICTS: Record<Locale, Dict> = { en, pt };

/** English unless the browser's preferred language is Brazilian Portuguese (or plain "pt"). */
export function localeFromAcceptLanguage(header: string | null): Locale {
  const first = header
    ?.split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)[0]?.tag;
  return first === "pt-br" || first === "pt" ? "pt" : "en";
}
