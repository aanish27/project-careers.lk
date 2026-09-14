"use client";
import "./tiptap.css";
import { cn } from "@/lib/utils";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { MinimalToolbar } from "./minimal-toolbar";

interface MinimalRichTextEditorProps {
  className?: string;
  placeholder?: string;
  /** Initial HTML content — only read on mount, not re-synced on change. */
  value?: string;
  onChange?: (html: string) => void;
}

export function MinimalRichTextEditor({
  className,
  placeholder,
  value,
  onChange,
}: MinimalRichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        // Registered separately below — StarterKit already bundles its own
        // Underline in tiptap v3, which duplicates ours if left enabled.
        underline: false,
        orderedList: { HTMLAttributes: { class: "list-decimal" } },
        bulletList: { HTMLAttributes: { class: "list-disc" } },
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder ?? "Write a description…",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "max-w-full focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div
      className={cn(
        "minimal-tiptap-editor w-full overflow-hidden rounded-md border bg-card",
        className,
      )}
    >
      <MinimalToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="w-full min-w-full cursor-text p-3"
      />
    </div>
  );
}
