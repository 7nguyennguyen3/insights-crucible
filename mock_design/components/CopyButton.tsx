import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  className = "",
  label,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`group flex items-center justify-center transition-all duration-200 ${
        copied
          ? "text-emerald-600 bg-emerald-50"
          : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
      } rounded-lg p-2 ${className}`}
      title="Copy to clipboard"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {label && (
        <span className="ml-2 text-xs font-medium">
          {copied ? "Copied" : label}
        </span>
      )}
    </button>
  );
};
