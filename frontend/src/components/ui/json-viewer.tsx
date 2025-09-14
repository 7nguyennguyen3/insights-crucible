"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface JsonViewerProps {
  data: any;
  name?: string;
  level?: number;
  isLast?: boolean;
}

interface JsonNodeProps {
  keyName: string;
  value: any;
  level: number;
  isLast: boolean;
}

function JsonNode({ keyName, value, level, isLast }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [hasCopied, setHasCopied] = useState(false);

  const getValueType = (val: any): string => {
    if (val === null) return "null";
    if (Array.isArray(val)) return "array";
    return typeof val;
  };

  const getValuePreview = (val: any): string => {
    const type = getValueType(val);
    switch (type) {
      case "array":
        return `[${val.length} items]`;
      case "object":
        return `{${Object.keys(val).length} keys}`;
      case "string":
        return val.length > 50 ? `"${val.substring(0, 47)}..."` : `"${val}"`;
      case "null":
        return "null";
      default:
        return String(val);
    }
  };

  const copyValue = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
      setHasCopied(true);
      toast.success(`Copied ${keyName} to clipboard`);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const isExpandable = getValueType(value) === "object" || getValueType(value) === "array";
  const indent = level * 20;

  return (
    <div className="font-mono text-sm">
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 group",
          isExpandable && "cursor-pointer"
        )}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={isExpandable ? () => setIsExpanded(!isExpanded) : undefined}
      >
        {isExpandable ? (
          isExpanded ? (
            <ChevronDown className="h-3 w-3 text-slate-400" />
          ) : (
            <ChevronRight className="h-3 w-3 text-slate-400" />
          )
        ) : (
          <span className="w-3" />
        )}

        <span className="text-blue-600 dark:text-blue-400">{keyName}:</span>

        {!isExpandable && (
          <span
            className={cn(
              "ml-1",
              getValueType(value) === "string" && "text-green-600 dark:text-green-400",
              getValueType(value) === "number" && "text-purple-600 dark:text-purple-400",
              getValueType(value) === "boolean" && "text-orange-600 dark:text-orange-400",
              getValueType(value) === "null" && "text-slate-500 dark:text-slate-400"
            )}
          >
            {getValuePreview(value)}
          </span>
        )}

        {isExpandable && !isExpanded && (
          <span className="ml-1 text-slate-500 dark:text-slate-400">
            {getValuePreview(value)}
          </span>
        )}

        <Button
          onClick={(e) => {
            e.stopPropagation();
            copyValue();
          }}
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 ml-auto h-6 w-6 p-0"
        >
          {hasCopied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      {isExpandable && isExpanded && (
        <div>
          {getValueType(value) === "array" ? (
            value.map((item: any, index: number) => (
              <JsonNode
                key={index}
                keyName={`[${index}]`}
                value={item}
                level={level + 1}
                isLast={index === value.length - 1}
              />
            ))
          ) : (
            Object.entries(value).map(([key, val], index, array) => (
              <JsonNode
                key={key}
                keyName={key}
                value={val}
                level={level + 1}
                isLast={index === array.length - 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function JsonViewer({ data, name = "root", level = 0 }: JsonViewerProps) {
  if (!data) return null;

  return (
    <div className="bg-white dark:bg-slate-950 border rounded-lg p-4 max-h-[600px] overflow-auto">
      <div className="border-l-2 border-slate-200 dark:border-slate-700">
        {getValueType(data) === "object" ? (
          Object.entries(data).map(([key, value], index, array) => (
            <JsonNode
              key={key}
              keyName={key}
              value={value}
              level={0}
              isLast={index === array.length - 1}
            />
          ))
        ) : (
          <JsonNode
            keyName={name}
            value={data}
            level={0}
            isLast={true}
          />
        )}
      </div>
    </div>
  );
}

function getValueType(val: any): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val;
}