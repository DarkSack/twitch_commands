import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useState } from "react";

export function CodeBlock({ language = "bash", code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative rounded-md overflow-hidden border bg-muted"
      onClick={handleCopy}
    >
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          padding: "1rem",
          borderRadius: "0.5rem",
          margin: 0,
          cursor: "pointer",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
