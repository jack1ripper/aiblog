"use client";

import dynamic from "next/dynamic";
import "easymde/dist/easymde.min.css";

const SimpleMDE = dynamic(() => import("react-simplemde-editor"), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div className="markdown-editor">
      <SimpleMDE
        value={value}
        onChange={onChange}
        options={{
          spellChecker: false,
          placeholder: "Write your post in Markdown...",
        }}
      />
    </div>
  );
}
