import { useEffect, useRef } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (nextHtml: string) => void;
};

const commands = [
  { label: "Bold", command: "bold" },
  { label: "Italic", command: "italic" },
  { label: "Left", command: "justifyLeft" },
  { label: "Center", command: "justifyCenter" },
  { label: "Right", command: "justifyRight" },
  { label: "List", command: "insertUnorderedList" },
  { label: "Link", command: "createLink" }
] as const;

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const runCommand = (command: string) => {
    if (command === "createLink") {
      const url = window.prompt("Weka URL ya link:");
      if (!url) return;
      document.execCommand(command, false, url);
    } else {
      document.execCommand(command);
    }
    onChange(editorRef.current?.innerHTML ?? "");
  };

  return (
    <div className="rounded-xl border border-slate-300 dark:border-slate-700">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
        {commands.map((item) => (
          <button
            key={item.command}
            type="button"
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold dark:border-slate-700"
            onClick={() => runCommand(item.command)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-28 p-3 text-sm outline-none dark:bg-slate-950"
        onInput={() => onChange(editorRef.current?.innerHTML ?? "")}
      />
    </div>
  );
}
