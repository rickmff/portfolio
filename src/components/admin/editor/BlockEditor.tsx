"use client";

import { computePosition, flip, offset, shift } from "@floating-ui/dom";
import type { Editor } from "@tiptap/core";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { uploadImage } from "@/app/admin/actions";
import { duplicateBlock, editorExtensions, type SlashRender } from "./extensions";
import { docToMarkdown, markdownToDoc } from "./markdown";
import { BLOCKS, PICK_IMAGE, TURN_INTO, type SlashItem } from "./slash";
import "./editor.css";

/* ------------------------------------------------------------------ */
/* Slash menu state, shared between the Suggestion plugin and React    */
/* ------------------------------------------------------------------ */

type SlashState = {
  open: boolean;
  items: SlashItem[];
  index: number;
  rect: (() => DOMRect | null) | null;
  command: ((item: SlashItem) => void) | null;
};

function createSlashStore() {
  let state: SlashState = { open: false, items: [], index: 0, rect: null, command: null };
  const listeners = new Set<() => void>();
  const set = (patch: Partial<SlashState>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  };
  const render: SlashRender = () => ({
    onStart: (p) => set({ open: true, items: p.items, index: 0, rect: p.clientRect ?? null, command: p.command }),
    onUpdate: (p) => set({ items: p.items, index: 0, rect: p.clientRect ?? null, command: p.command }),
    onExit: () => set({ open: false, items: [], command: null }),
    onKeyDown: ({ event }) => {
      if (!state.open) return false;
      const n = state.items.length;
      if (event.key === "ArrowDown") {
        set({ index: n ? (state.index + 1) % n : 0 });
        return true;
      }
      if (event.key === "ArrowUp") {
        set({ index: n ? (state.index - 1 + n) % n : 0 });
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        const item = state.items[state.index];
        if (item) state.command?.(item);
        return !!item;
      }
      if (event.key === "Escape") {
        set({ open: false });
        return true;
      }
      return false;
    },
  });
  return {
    render,
    set,
    get: () => state,
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */

export default function BlockEditor({
  name,
  label,
  initial,
  onChange,
}: {
  name: string;
  label: string;
  initial: string;
  onChange?: (markdown: string) => void;
}) {
  const slash = useMemo(createSlashStore, []);
  const hidden = useRef<HTMLInputElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const content = useMemo(() => {
    try {
      return markdownToDoc(initial);
    } catch {
      // Never lose a post the converter can't read: show it as one raw block instead.
      return { type: "doc", content: [{ type: "rawMarkdown", attrs: { text: initial } }] };
    }
    // Only the first value seeds the editor; later edits come from the editor itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadInto = useRef<(files: File[], pos?: number) => void>(() => {});

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions(slash.render),
    content,
    editorProps: {
      attributes: { class: "prose nb-doc", "aria-label": label, spellcheck: "true" },
      handlePaste: (view, event) => {
        const images = [...(event.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
        if (!images.length) return false;
        uploadInto.current(images);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const images = [...(event.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith("image/"));
        if (!images.length) return false;
        event.preventDefault();
        const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
        uploadInto.current(images, at?.pos);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const md = docToMarkdown(editor.getJSON());
      if (hidden.current) hidden.current.value = md;
      onChangeRef.current?.(md);
    },
  });

  // Uploads land as image blocks: a local preview first, the stored URL once the upload finishes.
  uploadInto.current = (files, pos) => {
    if (!editor) return;
    for (const f of files) {
      const preview = URL.createObjectURL(f);
      const at = pos ?? editor.state.selection.to;
      editor
        .chain()
        .focus()
        .insertContentAt(at, { type: "image", attrs: { src: preview, alt: f.name.replace(/\.[^.]+$/, ""), uploading: true } })
        .run();
      const fd = new FormData();
      fd.set("file", f);
      uploadImage(fd).then((res) => {
        editor.state.doc.descendants((node, p) => {
          if (node.type.name !== "image" || node.attrs.src !== preview) return;
          const tr = editor.state.tr;
          if (res.url) tr.setNodeMarkup(p, undefined, { ...node.attrs, src: res.url, uploading: false });
          else tr.delete(p, p + node.nodeSize);
          editor.view.dispatch(tr);
          return false;
        });
        URL.revokeObjectURL(preview);
        if (!res.url) alert(res.error ?? "Upload failed.");
      });
    }
  };

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const pick = () => file.current?.click();
    dom.addEventListener(PICK_IMAGE, pick);
    if (hidden.current) hidden.current.value = docToMarkdown(editor.getJSON());
    return () => dom.removeEventListener(PICK_IMAGE, pick);
  }, [editor]);

  return (
    <div className="nb-shell" ref={shell}>
      <input type="hidden" name={name} ref={hidden} defaultValue={initial} />
      <input
        ref={file}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          if (files.length) uploadInto.current(files);
          e.target.value = "";
        }}
      />
      {editor ? (
        <>
          <BlockHandle editor={editor} shell={shell} slash={slash} />
          <SelectionToolbar editor={editor} />
          <TableToolbar editor={editor} />
          <SlashMenu slash={slash} />
        </>
      ) : null}
      <EditorContent editor={editor} className="nb-content" />
      {!editor ? <div className="prose nb-doc nb-loading">Loading editor…</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "/" menu                                                            */
/* ------------------------------------------------------------------ */

function SlashMenu({ slash }: { slash: ReturnType<typeof createSlashStore> }) {
  const state = useSyncExternalStore(slash.subscribe, slash.get, slash.get);
  const menu = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = menu.current;
    const rect = state.rect?.();
    if (!state.open || !el || !rect) return;
    computePosition({ getBoundingClientRect: () => rect }, el, {
      placement: "bottom-start",
      strategy: "fixed",
      middleware: [offset(6), flip({ padding: 12 }), shift({ padding: 12 })],
    }).then(({ x, y }) => Object.assign(el.style, { left: `${x}px`, top: `${y}px` }));
  }, [state]);

  useEffect(() => {
    menu.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [state.index]);

  if (!state.open) return null;
  let group = "";
  return (
    <div ref={menu} className="nb-pop nb-slash" role="listbox" aria-label="Blocks" onMouseDown={(e) => e.preventDefault()}>
      {state.items.length ? (
        state.items.map((item, i) => {
          const header = item.group !== group ? (group = item.group) : null;
          return (
            <div key={item.id}>
              {header ? <div className="nb-slash-group">{header}</div> : null}
              <button
                type="button"
                role="option"
                aria-selected={i === state.index}
                onMouseEnter={() => slash.set({ index: i })}
                onClick={() => state.command?.(item)}
              >
                <span className="nb-slash-icon">{item.icon}</span>
                <span className="nb-slash-text">
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
                {item.hint ? <kbd>{item.hint}</kbd> : null}
              </button>
            </div>
          );
        })
      ) : (
        <div className="nb-slash-empty">No results</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Turn into                                                           */
/* ------------------------------------------------------------------ */

function currentBlockId(editor: Editor) {
  if (editor.isActive("heading", { level: 1 })) return "h1";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  if (editor.isActive("taskList")) return "todo";
  if (editor.isActive("orderedList")) return "numbered";
  if (editor.isActive("bulletList")) return "bullet";
  if (editor.isActive("codeBlock")) return "code";
  if (editor.isActive("blockquote")) return "quote";
  return "text";
}

function turnInto(editor: Editor, id: string) {
  const item = BLOCKS.find((b) => b.id === id);
  if (!item) return;
  const chain = editor.chain().focus();
  // Lists and quotes wrap; leave the current wrapper first so the change is a swap, not a nest.
  if (id !== currentBlockId(editor)) {
    if (editor.isActive("bulletList") || editor.isActive("orderedList") || editor.isActive("taskList") || editor.isActive("blockquote"))
      chain.clearNodes();
    item.run(chain, editor);
  }
}

function TurnIntoMenu({ editor, onDone }: { editor: Editor; onDone?: () => void }) {
  const current = useEditorState({ editor, selector: ({ editor }) => currentBlockId(editor) });
  return (
    <div className="nb-pop nb-turn" role="menu" onMouseDown={(e) => e.preventDefault()}>
      <div className="nb-slash-group">Turn into</div>
      {TURN_INTO.map((id) => {
        const b = BLOCKS.find((x) => x.id === id)!;
        return (
          <button
            key={id}
            type="button"
            role="menuitemradio"
            aria-checked={current === id}
            onClick={() => {
              turnInto(editor, id);
              onDone?.();
            }}
          >
            <span className="nb-slash-icon small">{b.icon}</span>
            {b.title}
            {current === id ? <span className="nb-check">✓</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Selection toolbar                                                   */
/* ------------------------------------------------------------------ */

function SelectionToolbar({ editor }: { editor: Editor }) {
  const [panel, setPanel] = useState<"none" | "turn" | "link">("none");
  const [href, setHref] = useState("");
  const s = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      link: editor.isActive("link"),
      href: (editor.getAttributes("link").href as string | undefined) ?? "",
      block: BLOCKS.find((b) => b.id === currentBlockId(editor))?.title ?? "Text",
    }),
  });

  useEffect(() => {
    const reset = () => setPanel("none");
    editor.on("selectionUpdate", reset);
    return () => {
      editor.off("selectionUpdate", reset);
    };
  }, [editor]);

  // Cmd+K opens the link field, like Notion.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && editor.isFocused && !editor.state.selection.empty) {
        e.preventDefault();
        setHref(editor.getAttributes("link").href ?? "");
        setPanel("link");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor]);

  const applyLink = () => {
    const url = href.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (url) chain.setLink({ href: url }).run();
    else chain.unsetLink().run();
    setPanel("none");
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="selectionToolbar"
      options={{ placement: "top-start", offset: 8, flip: true, shift: { padding: 12 } }}
      shouldShow={({ editor, state }) => {
        const { selection } = state;
        if (selection.empty || selection instanceof NodeSelection) return false;
        if (editor.isActive("codeBlock") || editor.isActive("image")) return false;
        return editor.isEditable && editor.isFocused;
      }}
      className="nb-toolbar"
    >
      <div className="nb-toolbar-row" onMouseDown={(e) => e.target instanceof HTMLInputElement || e.preventDefault()}>
        <button type="button" className="nb-tb-turn" aria-expanded={panel === "turn"} onClick={() => setPanel(panel === "turn" ? "none" : "turn")}>
          {s.block} <span aria-hidden>▾</span>
        </button>
        <span className="nb-tb-sep" />
        <button type="button" title="Link (⌘K)" aria-pressed={s.link} onClick={() => {
          setHref(s.href);
          setPanel(panel === "link" ? "none" : "link");
        }}>
          <span aria-hidden>↗</span> Link
        </button>
        <span className="nb-tb-sep" />
        <button type="button" title="Bold (⌘B)" aria-pressed={s.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <b>B</b>
        </button>
        <button type="button" title="Italic (⌘I)" aria-pressed={s.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i>i</i>
        </button>
        <button type="button" title="Strikethrough (⌘⇧S)" aria-pressed={s.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <s>S</s>
        </button>
        <button type="button" title="Inline code (⌘E)" aria-pressed={s.code} onClick={() => editor.chain().focus().toggleCode().run()}>
          <code>{"</>"}</code>
        </button>
      </div>
      {panel === "turn" ? <TurnIntoMenu editor={editor} onDone={() => setPanel("none")} /> : null}
      {panel === "link" ? (
        <div className="nb-pop nb-link">
          <input
            autoFocus
            value={href}
            placeholder="Paste a link…"
            aria-label="Link"
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") {
                setPanel("none");
                editor.commands.focus();
              }
            }}
          />
          <button type="button" onClick={applyLink}>
            {href.trim() ? "Apply" : "Remove"}
          </button>
        </div>
      ) : null}
    </BubbleMenu>
  );
}

/* ------------------------------------------------------------------ */
/* Table toolbar                                                       */
/* ------------------------------------------------------------------ */

function TableToolbar({ editor }: { editor: Editor }) {
  const run = (fn: (c: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => fn(editor.chain().focus()).run();
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableToolbar"
      options={{ placement: "top", offset: 12 }}
      shouldShow={({ editor, state }) => state.selection.empty && editor.isActive("table") && editor.isFocused}
      getReferencedVirtualElement={() => {
        const { $from } = editor.state.selection;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === "table") {
            const dom = editor.view.nodeDOM($from.before(d)) as HTMLElement | null;
            const el = dom?.querySelector("table") ?? dom;
            if (el) return { getBoundingClientRect: () => el.getBoundingClientRect() };
          }
        }
        return null;
      }}
      className="nb-toolbar"
    >
      <div className="nb-toolbar-row" onMouseDown={(e) => e.preventDefault()}>
        <button type="button" onClick={() => run((c) => c.addRowAfter())}>+ Row</button>
        <button type="button" onClick={() => run((c) => c.addColumnAfter())}>+ Column</button>
        <span className="nb-tb-sep" />
        <button type="button" onClick={() => run((c) => c.deleteRow())}>− Row</button>
        <button type="button" onClick={() => run((c) => c.deleteColumn())}>− Column</button>
        <span className="nb-tb-sep" />
        <button type="button" className="danger" onClick={() => run((c) => c.deleteTable())}>Delete table</button>
      </div>
    </BubbleMenu>
  );
}

/* ------------------------------------------------------------------ */
/* Block handle: "+" and "⋮⋮" on hover, drag to move, click for menu    */
/* ------------------------------------------------------------------ */

type Hover = { pos: number; top: number; height: number };

function BlockHandle({
  editor,
  shell,
  slash,
}: {
  editor: Editor;
  shell: React.RefObject<HTMLDivElement | null>;
  slash: ReturnType<typeof createSlashStore>;
}) {
  const [hover, setHover] = useState<Hover | null>(null);
  const [menu, setMenu] = useState<number | null>(null);
  const handle = useRef<HTMLDivElement>(null);
  const frozen = menu !== null;

  const blockAt = useCallback(
    (y: number): Hover | null => {
      const root = shell.current;
      if (!root) return null;
      const base = root.getBoundingClientRect();
      const children = [...editor.view.dom.children] as HTMLElement[];
      for (const el of children) {
        const r = el.getBoundingClientRect();
        if (y < r.top - 4 || y > r.bottom + 4) continue;
        let pos: number;
        try {
          pos = editor.view.posAtDOM(el, 0) - 1;
        } catch {
          return null;
        }
        const $pos = editor.state.doc.resolve(Math.max(0, pos));
        const top = $pos.depth === 0 ? pos : $pos.before(1);
        // Line up with the first line of text, not the block's top margin.
        const line = parseFloat(getComputedStyle(el).lineHeight) || 24;
        return { pos: top, top: r.top - base.top, height: Math.min(r.height, line) };
      }
      return null;
    },
    [editor, shell],
  );

  useEffect(() => {
    const root = shell.current;
    if (!root) return;
    const move = (e: MouseEvent) => {
      if (frozen || slash.get().open) return;
      const h = blockAt(e.clientY);
      if (h) setHover(h);
    };
    const leave = (e: MouseEvent) => {
      if (frozen) return;
      if (handle.current?.contains(e.relatedTarget as Node)) return;
      setHover(null);
    };
    const hide = () => !frozen && setHover(null);
    root.addEventListener("mousemove", move);
    root.addEventListener("mouseleave", leave);
    editor.on("update", hide);
    return () => {
      root.removeEventListener("mousemove", move);
      root.removeEventListener("mouseleave", leave);
      editor.off("update", hide);
    };
  }, [blockAt, editor, frozen, shell, slash]);

  const node = hover ? editor.state.doc.nodeAt(hover.pos) : null;

  const addBelow = () => {
    if (!hover || !node) return;
    const empty = node.type.name === "paragraph" && node.content.size === 0;
    const chain = editor.chain().focus();
    if (empty) chain.setTextSelection(hover.pos + 1);
    else chain.insertContentAt(hover.pos + node.nodeSize, { type: "paragraph" }).setTextSelection(hover.pos + node.nodeSize + 1);
    chain.insertContent("/").run();
  };

  const select = (pos: number) => {
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)));
  };

  const onDragStart = (e: React.DragEvent) => {
    if (!hover) return;
    const { view } = editor;
    select(hover.pos);
    const slice = view.state.selection.content();
    const dom = view.nodeDOM(hover.pos) as HTMLElement | null;
    if (dom) e.dataTransfer.setDragImage(dom, 0, 0);
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("text/plain", view.state.doc.textBetween(hover.pos, hover.pos + (node?.nodeSize ?? 0), "\n"));
    // ProseMirror moves the slice itself on drop.
    view.dragging = { slice, move: true } as typeof view.dragging;
  };

  if (!hover) return null;
  return (
    <div
      ref={handle}
      className="nb-handle"
      style={{ top: hover.top, height: hover.height }}
      onMouseLeave={(e) => {
        if (!frozen && !shell.current?.querySelector(".nb-content")?.contains(e.relatedTarget as Node)) setHover(null);
      }}
    >
      <button type="button" title="Click to add a block below" aria-label="Add block" onClick={addBelow}>
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        draggable
        title="Drag to move, click to open menu"
        aria-label="Block menu"
        onDragStart={onDragStart}
        onDragEnd={() => setHover(null)}
        onClick={() => {
          select(hover.pos);
          setMenu(menu === null ? hover.pos : null);
        }}
      >
        <svg viewBox="0 0 10 16" width="10" height="16" aria-hidden>
          {[3, 8, 13].flatMap((y) => [<circle key={`a${y}`} cx="2.5" cy={y} r="1.3" />, <circle key={`b${y}`} cx="7.5" cy={y} r="1.3" />])}
        </svg>
      </button>
      {menu !== null ? <BlockMenu editor={editor} pos={menu} onClose={() => {
        setMenu(null);
        setHover(null);
      }} /> : null}
    </div>
  );
}

function BlockMenu({ editor, pos, onClose }: { editor: Editor; pos: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [turn, setTurn] = useState(false);
  useEffect(() => {
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  const node = editor.state.doc.nodeAt(pos);
  if (!node) return null;
  const textual = node.isTextblock || ["bulletList", "orderedList", "taskList", "blockquote"].includes(node.type.name);

  const placeCursor = () => {
    const inside = Math.min(pos + 1, editor.state.doc.content.size);
    editor.view.dispatch(editor.state.tr.setSelection(TextSelection.near(editor.state.doc.resolve(inside))));
  };

  return (
    <div ref={ref} className="nb-pop nb-block-menu" role="menu">
      {turn ? (
        <TurnIntoMenu editor={editor} onDone={onClose} />
      ) : (
        <>
          {textual ? (
            <button type="button" role="menuitem" onMouseDown={(e) => e.preventDefault()} onClick={() => {
              placeCursor();
              setTurn(true);
            }}>
              <span className="nb-slash-icon small">↻</span> Turn into <span className="nb-check">›</span>
            </button>
          ) : null}
          <button type="button" role="menuitem" onClick={() => {
            placeCursor();
            duplicateBlock(editor.state, editor.view.dispatch);
            onClose();
          }}>
            <span className="nb-slash-icon small">⧉</span> Duplicate <kbd>⌘D</kbd>
          </button>
          <button type="button" role="menuitem" className="danger" onClick={() => {
            editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
            onClose();
          }}>
            <span className="nb-slash-icon small">🗑</span> Delete
          </button>
        </>
      )}
    </div>
  );
}
