"use client";

import { useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { Editor } from "codemirror";
import "easymde/dist/easymde.min.css";

const SimpleMDE = dynamic(() => import("react-simplemde-editor"), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const cmRef = useRef<Editor | null>(null);

  function uploadImageAndInsert(file: File, cm: Editor) {
    const placeholderId = `uploading-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const placeholder = `![${placeholderId}]()`;

    cm.replaceSelection(placeholder);

    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/upload", { method: "POST", body: formData })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "上传失败");
        }
        const currentValue = cm.getValue();
        const newValue = currentValue.replace(placeholder, `![image](${data.url})`);
        if (currentValue !== newValue) {
          cm.setValue(newValue);
        }
      })
      .catch(() => {
        const currentValue = cm.getValue();
        const newValue = currentValue.replace(placeholder, "<!-- 图片上传失败，请重试 -->");
        if (currentValue !== newValue) {
          cm.setValue(newValue);
        }
      });
  }

  const handlePaste = useCallback((_instance: Editor, event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageItems: DataTransferItem[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        imageItems.push(items[i]);
      }
    }

    if (imageItems.length === 0) return;

    event.preventDefault();

    const cm = cmRef.current;
    if (!cm) return;

    imageItems.forEach((item) => {
      const blob = item.getAsFile();
      if (!blob) return;
      const file = new File([blob], `pasted-image.png`, { type: blob.type });
      uploadImageAndInsert(file, cm);
    });
  }, []);

  const handleDrop = useCallback((_instance: Editor, event: DragEvent) => {
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith("image/")) {
        imageFiles.push(files[i]);
      }
    }

    if (imageFiles.length === 0) return;

    event.preventDefault();

    const cm = cmRef.current;
    if (!cm) return;

    imageFiles.forEach((file) => {
      uploadImageAndInsert(file, cm);
    });
  }, []);

  return (
    <div className="markdown-editor">
      <SimpleMDE
        value={value}
        onChange={onChange}
        options={{
          spellChecker: false,
          placeholder: "Write your post in Markdown...",
        }}
        getCodemirrorInstance={(instance: Editor) => {
          cmRef.current = instance;
        }}
        events={{ paste: handlePaste, drop: handleDrop }}
      />
    </div>
  );
}
