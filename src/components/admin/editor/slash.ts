import type { ChainedCommands, Editor } from "@tiptap/core";

export type SlashItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  group: "Basic blocks" | "Media" | "Advanced";
  keywords: string[];
  /** Markdown shortcut shown on the right, like Notion's menu. */
  hint?: string;
  run: (chain: ChainedCommands, editor: Editor) => void;
};

/** Asks the editor component to open its file picker (it owns the upload action). */
export const PICK_IMAGE = "nb:pick-image";

export const BLOCKS: SlashItem[] = [
  {
    id: "text",
    title: "Text",
    description: "Just start writing with plain text.",
    icon: "Aa",
    group: "Basic blocks",
    keywords: ["paragraph", "plain", "texto"],
    run: (c) => c.setParagraph().run(),
  },
  {
    id: "h1",
    title: "Heading 1",
    description: "Big section heading.",
    icon: "H1",
    group: "Basic blocks",
    keywords: ["title", "h1", "titulo", "título"],
    hint: "#",
    run: (c) => c.setHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    title: "Heading 2",
    description: "Medium section heading.",
    icon: "H2",
    group: "Basic blocks",
    keywords: ["subtitle", "h2", "subtitulo"],
    hint: "##",
    run: (c) => c.setHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    title: "Heading 3",
    description: "Small section heading.",
    icon: "H3",
    group: "Basic blocks",
    keywords: ["h3"],
    hint: "###",
    run: (c) => c.setHeading({ level: 3 }).run(),
  },
  {
    id: "bullet",
    title: "Bulleted list",
    description: "Create a simple bulleted list.",
    icon: "•",
    group: "Basic blocks",
    keywords: ["ul", "unordered", "lista", "bullet"],
    hint: "-",
    run: (c) => c.toggleBulletList().run(),
  },
  {
    id: "numbered",
    title: "Numbered list",
    description: "Create a list with numbering.",
    icon: "1.",
    group: "Basic blocks",
    keywords: ["ol", "ordered", "numerada"],
    hint: "1.",
    run: (c) => c.toggleOrderedList().run(),
  },
  {
    id: "todo",
    title: "To-do list",
    description: "Track tasks with a to-do list.",
    icon: "☑",
    group: "Basic blocks",
    keywords: ["task", "checkbox", "check", "tarefa"],
    hint: "[]",
    run: (c) => c.toggleTaskList().run(),
  },
  {
    id: "toggle",
    title: "Toggle list",
    description: "Toggles can hide and show content inside.",
    icon: "▸",
    group: "Basic blocks",
    keywords: ["details", "collapse", "accordion", "summary"],
    hint: ">",
    run: (c) => c.setDetails().updateAttributes("details", { open: true }).run(),
  },
  {
    id: "quote",
    title: "Quote",
    description: "Capture a quote.",
    icon: "❝",
    group: "Basic blocks",
    keywords: ["blockquote", "citação", "citacao"],
    hint: '"',
    run: (c) => c.toggleBlockquote().run(),
  },
  {
    id: "callout",
    title: "Callout",
    description: "Make writing stand out.",
    icon: "💡",
    group: "Basic blocks",
    keywords: ["note", "tip", "warning", "alert", "aviso", "nota"],
    run: (c) => c.wrapIn("callout", { type: "note" }).run(),
  },
  {
    id: "divider",
    title: "Divider",
    description: "Visually divide blocks.",
    icon: "—",
    group: "Basic blocks",
    keywords: ["hr", "rule", "separator", "line", "divisor"],
    hint: "---",
    run: (c) => c.setHorizontalRule().run(),
  },
  {
    id: "image",
    title: "Image",
    description: "Upload an image from your computer.",
    icon: "🖼",
    group: "Media",
    keywords: ["picture", "photo", "upload", "imagem", "foto"],
    run: (c, editor) => {
      c.run();
      editor.view.dom.dispatchEvent(new CustomEvent(PICK_IMAGE));
    },
  },
  {
    id: "code",
    title: "Code",
    description: "Capture a code snippet.",
    icon: "</>",
    group: "Advanced",
    keywords: ["snippet", "pre", "codigo", "código"],
    hint: "```",
    run: (c) => c.setCodeBlock().run(),
  },
  {
    id: "table",
    title: "Table",
    description: "Add a simple table.",
    icon: "⊞",
    group: "Advanced",
    keywords: ["grid", "tabela"],
    run: (c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: "markdown",
    title: "Markdown",
    description: "Write raw Markdown or HTML, kept as is.",
    icon: "M↓",
    group: "Advanced",
    keywords: ["html", "raw", "embed", "footnote"],
    run: (c) => c.insertContent({ type: "rawMarkdown", attrs: { text: "" } }).run(),
  },
];

/** "Turn into" targets for the block menu and the selection toolbar. */
export const TURN_INTO = ["text", "h1", "h2", "h3", "bullet", "numbered", "todo", "quote", "code"];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function slashItems(query: string) {
  const q = norm(query.trim());
  if (!q) return BLOCKS;
  return BLOCKS.filter((b) => [b.title, b.id, ...b.keywords].some((k) => norm(k).includes(q))).sort(
    (a, b) => Number(!norm(a.title).startsWith(q)) - Number(!norm(b.title).startsWith(q)),
  );
}
