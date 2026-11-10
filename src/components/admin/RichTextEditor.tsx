"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useState } from "react";
import StarterKit from "@tiptap/starter-kit";

function Btn({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`btn btn-xs ${active ? "btn-primary" : "btn-ghost"}`}
      aria-pressed={!!active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

type Props = { value: string; onChange: (html: string) => void; label?: string };

export function RichTextEditor({ value, onChange, label = "Body" }: Props) {
  // TipTap owns the document after mount. Feeding `value` back in on every
  // keystroke resets the editor to a stale copy and drops fast typing.
  const [initialContent] = useState(value);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false } }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        class:
          "min-h-48 rounded-b border border-base-300 p-3 focus:outline-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-semibold [&_ol]:ml-6 [&_ol]:list-decimal [&_ul]:ml-6 [&_ul]:list-disc",
      },
    },
  });

  if (!editor) return <p role="status">Loading editor…</p>;

  const chain = () => editor.chain().focus();

  return (
    <div>
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex flex-wrap gap-1 rounded-t border border-b-0 border-base-300 bg-base-200 p-1"
      >
        <Btn
          label="H2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => chain().toggleHeading({ level: 2 }).run()}
        />
        <Btn
          label="H3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => chain().toggleHeading({ level: 3 }).run()}
        />
        <Btn
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => chain().toggleBold().run()}
        />
        <Btn
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => chain().toggleItalic().run()}
        />
        <Btn
          label="Bullets"
          active={editor.isActive("bulletList")}
          onClick={() => chain().toggleBulletList().run()}
        />
        <Btn
          label="Numbered"
          active={editor.isActive("orderedList")}
          onClick={() => chain().toggleOrderedList().run()}
        />
        <Btn
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => chain().toggleBlockquote().run()}
        />
        <Btn
          label="Link"
          active={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("Link URL (https://…)");
            if (url === null) return;
            if (url === "") chain().unsetLink().run();
            else chain().extendMarkRange("link").setLink({ href: url }).run();
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
