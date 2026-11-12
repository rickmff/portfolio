import { Extension, InputRule, Mark, mergeAttributes, Node, textblockTypeInputRule, wrappingInputRule } from "@tiptap/core";
import Blockquote from "@tiptap/extension-blockquote";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details";
import Image from "@tiptap/extension-image";
import { BulletList, OrderedList, TaskItem, TaskList } from "@tiptap/extension-list";
import { TableCell, TableHeader, TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import type { EditorState } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { CalloutView, CodeBlockView, ImageView, RawMarkdownView } from "./NodeViews";
import { slashItems, type SlashItem } from "./slash";

/** Remembers whether a list was written tight or loose in Markdown, so saving doesn't reflow it. */
const tight = {
  tight: {
    default: true,
    parseHTML: (el: HTMLElement) => el.getAttribute("data-tight") !== "false",
    renderHTML: (a: { tight?: boolean }) => (a.tight === false ? { "data-tight": "false" } : {}),
  },
};

const align = {
  align: {
    default: null,
    parseHTML: (el: HTMLElement) => el.style.textAlign || null,
    renderHTML: (a: { align?: string | null }) => (a.align ? { style: `text-align: ${a.align}` } : {}),
  },
};

/** `> [!NOTE]` and friends: a coloured box with an icon, like Notion's callout. */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return { type: { default: "note", parseHTML: (el) => el.getAttribute("data-callout") ?? "note" } };
  },
  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-callout": node.attrs.type, class: "nb-callout" }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});

/** Markdown the blocks can't show (raw HTML, footnote notes): kept verbatim and editable as text. */
export const RawMarkdown = Node.create({
  name: "rawMarkdown",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { text: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "div[data-raw-markdown]", getAttrs: (el) => ({ text: (el as HTMLElement).textContent ?? "" }) }];
  },
  renderHTML({ node }) {
    return ["div", { "data-raw-markdown": "" }, node.attrs.text];
  },
  addNodeView() {
    return ReactNodeViewRenderer(RawMarkdownView);
  },
});

/** A footnote reference like `[^1]`, shown as a small superscript chip. */
export const FootnoteRef = Node.create({
  name: "footnoteRef",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return { label: { default: "1" } };
  },
  parseHTML() {
    return [{ tag: "sup[data-footnote]", getAttrs: (el) => ({ label: (el as HTMLElement).dataset.footnote }) }];
  },
  renderHTML({ node }) {
    return ["sup", { "data-footnote": node.attrs.label, class: "nb-footnote" }, String(node.attrs.label)];
  },
  renderText({ node }) {
    return `[^${node.attrs.label}]`;
  },
});

/** Inline HTML from the Markdown (<kbd>, <sup>…), written back untouched. */
export const RawInline = Mark.create({
  name: "rawInline",
  inclusive: false,
  excludes: "_",
  parseHTML() {
    return [{ tag: "span[data-raw-inline]" }];
  },
  renderHTML() {
    return ["span", { "data-raw-inline": "", class: "nb-raw-inline" }, 0];
  },
});

const ImageBlock = Image.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      uploading: { default: false, rendered: false },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
}).configure({ inline: false, allowBase64: false });

/** Notion keys: `"` + space is a quote, `>` + space is a toggle, `[]` is a to-do. */
const NotionShortcuts = Extension.create({
  name: "notionShortcuts",
  addInputRules() {
    const { schema } = this.editor;
    return [
      wrappingInputRule({ find: /^\s*["“]\s$/, type: schema.nodes.blockquote }),
      wrappingInputRule({ find: /^\s*(\[\]|\[ \])\s$/, type: schema.nodes.taskList }),
      new InputRule({
        find: /^\s*>\s$/,
        handler: ({ range, chain }) => {
          chain().deleteRange(range).setDetails().updateAttributes("details", { open: true }).run();
        },
      }),
      new InputRule({
        find: /^\s*!>\s$/,
        handler: ({ range, chain }) => {
          chain().deleteRange(range).wrapIn("callout", { type: "note" }).run();
        },
      }),
      textblockTypeInputRule({ find: /^```([a-z0-9+#-]*)[\s\n]$/i, type: schema.nodes.codeBlock, getAttributes: (m) => ({ language: m[1] || null }) }),
    ];
  },
  addKeyboardShortcuts() {
    return {
      // Notion: Cmd+E inline code, Cmd+Shift+S strike, Cmd+D duplicate the block.
      "Mod-e": () => this.editor.commands.toggleCode(),
      "Mod-Shift-s": () => this.editor.commands.toggleStrike(),
      "Mod-d": () => duplicateBlock(this.editor.state, this.editor.view.dispatch),
      // Cmd+Alt+0 back to plain text, like Notion.
      "Mod-Alt-0": () => this.editor.commands.setParagraph(),
      // Enter on an empty last line of a callout or quote steps out of it, like leaving a list.
      Enter: () => {
        const { $from, empty } = this.editor.state.selection;
        if (!empty || $from.depth < 2 || $from.parent.type.name !== "paragraph" || $from.parent.content.size) return false;
        const wrapper = $from.node(-1);
        if (!["callout", "blockquote"].includes(wrapper.type.name)) return false;
        if ($from.index(-1) !== wrapper.childCount - 1) return false;
        return this.editor.commands.lift(wrapper.type.name);
      },
    };
  },
});

/** Duplicates the top-level block that holds the cursor, right below it. */
export function duplicateBlock(state: EditorState, dispatch?: (tr: EditorState["tr"]) => void) {
  const { $from } = state.selection;
  if ($from.depth < 1) return false;
  const pos = $from.before(1);
  const node = state.doc.nodeAt(pos);
  if (!node) return false;
  dispatch?.(state.tr.insert(pos + node.nodeSize, node.copy(node.content)).scrollIntoView());
  return true;
}

export type SlashRender = NonNullable<SuggestionOptions<SlashItem>["render"]>;

/** The "/" menu, wired to a renderer supplied by the React component. */
export function SlashCommand(render: SlashRender) {
  return Extension.create({
    name: "slashCommand",
    addProseMirrorPlugins() {
      return [
        Suggestion<SlashItem>({
          editor: this.editor,
          char: "/",
          allowSpaces: false,
          startOfLine: false,
          // Only at the start of a block or after a space, so URLs and "and/or" don't open it.
          allow: ({ state, range }) => {
            const before = state.doc.textBetween(Math.max(0, range.from - 1), range.from, "\n", "\n");
            const $pos = state.doc.resolve(range.from);
            if ($pos.parent.type.spec.code) return false;
            return range.from === $pos.start() || /\s/.test(before);
          },
          items: ({ query }) => slashItems(query),
          command: ({ editor, range, props }) => props.run(editor.chain().focus().deleteRange(range), editor),
          render,
        }),
      ];
    },
  });
}

export function editorExtensions(render: SlashRender) {
  return [
    StarterKit.configure({
      // Markdown has no underline, and the code block gets its own view below.
      underline: false,
      codeBlock: false,
      blockquote: false,
      bulletList: false,
      orderedList: false,
      code: false,
      link: { openOnClick: false, autolink: true, linkOnPaste: true, defaultProtocol: "https" },
      dropcursor: { color: "rgba(35, 131, 226, 0.5)", width: 3 },
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }),
    BlockquoteNoArrow,
    BulletListTight,
    OrderedListTight,
    CodeMark,
    CodeBlockNode,
    TaskList.extend({ addAttributes: () => tight }),
    TaskItem.configure({ nested: true }),
    TableKit.configure({
      table: { resizable: false, HTMLAttributes: { class: "nb-table" } },
      tableCell: false,
      tableHeader: false,
    }),
    TableCellAligned,
    TableHeaderAligned,
    Details.configure({ persist: true, HTMLAttributes: { class: "nb-toggle" } }),
    DetailsSummary,
    DetailsContent,
    Callout,
    RawMarkdown,
    FootnoteRef,
    RawInline,
    ImageBlock,
    NotionShortcuts,
    Placeholder.configure({
      includeChildren: true,
      showOnlyCurrent: true,
      placeholder: ({ node, pos, editor }) => {
        if (node.type.name === "heading") return `Heading ${node.attrs.level}`;
        if (node.type.name === "detailsSummary") return "Toggle";
        if (node.type.name !== "paragraph") return "";
        const parent = editor.state.doc.resolve(pos).parent.type.name;
        if (parent === "listItem" || parent === "taskItem") return "List";
        if (parent === "blockquote") return "Empty quote";
        if (parent === "tableCell" || parent === "tableHeader") return "";
        return "Write something, or press '/' for commands…";
      },
    }),
    SlashCommand(render),
  ];
}


/** The quote input rule is `"`, so `>` is free for toggles (Notion keys). */
const BlockquoteNoArrow = Blockquote.extend({ addInputRules: () => [] });
const BulletListTight = BulletList.extend({ addAttributes() { return { ...this.parent?.(), ...tight }; } });
const OrderedListTight = OrderedList.extend({ addAttributes() { return { ...this.parent?.(), ...tight }; } });
/** Markdown allows **`bold code`**, so inline code doesn't push other marks away. */
const CodeMark = Code.extend({ excludes: "rawInline" });
const CodeBlockNode = CodeBlock.extend({
  addInputRules: () => [],
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
}).configure({ defaultLanguage: null, enableTabIndentation: true, tabSize: 2 });
const TableCellAligned = TableCell.extend({ addAttributes() { return { ...this.parent?.(), ...align }; } });
const TableHeaderAligned = TableHeader.extend({ addAttributes() { return { ...this.parent?.(), ...align }; } });
