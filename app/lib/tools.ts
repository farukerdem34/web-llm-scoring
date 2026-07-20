import type { ChatCompletionTool } from "@mlc-ai/web-llm";

interface ToolImpl {
  definition: ChatCompletionTool;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

const TOOLS: ToolImpl[] = [
  {
    definition: {
      type: "function",
      function: {
        name: "web_search",
        description: "Search the web for current information. Returns a summary of search results.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query",
            },
          },
          required: ["query"],
        },
      },
    },
    execute: async (args) => {
      const query = String(args.query ?? "");
      if (!query.trim()) return "Error: No query provided";
      try {
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const res = await fetch(url);
        const data = await res.json();
        const summary = data.AbstractText || data.Answer || "";
        if (!summary) {
          const results = (data.RelatedTopics ?? [])
            .slice(0, 5)
            .map((t: { Text?: string; Result?: string }) => t.Text || t.Result || "")
            .filter(Boolean)
            .join("\n");
          return results || `No results found for "${query}"`;
        }
        return summary;
      } catch (err) {
        return `Search error: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  },
  {
    definition: {
      type: "function",
      function: {
        name: "fetch_url",
        description: "Fetch and return the content of a web page as plain text.",
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to fetch",
            },
          },
          required: ["url"],
        },
      },
    },
    execute: async (args) => {
      const url = String(args.url ?? "");
      if (!url.trim()) return "Error: No URL provided";
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "Error: URL must start with http:// or https://";
      }
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const text = await res.text();
        const stripped = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return stripped.slice(0, 4000);
      } catch (err) {
        if (err instanceof DOMException && err.name === "TimeoutError") {
          return "Error: Request timed out";
        }
        return `Fetch error: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  },
  {
    definition: {
      type: "function",
      function: {
        name: "evaluate_math",
        description: "Evaluate a mathematical expression and return the result. Supports +, -, *, /, parentheses. Use valid JS syntax.",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              description: "The mathematical expression to evaluate (e.g., '(3 + 5) * 2')",
            },
          },
          required: ["expression"],
        },
      },
    },
    execute: async (args) => {
      const expr = String(args.expression ?? "").trim();
      if (!expr) return "Error: No expression provided";
      const sanitized = expr.replace(/[^0-9+\-*/.()%\s,]/g, "");
      if (sanitized.length < expr.length) {
        return "Error: Expression contains invalid characters";
      }
      try {
        const result = Function(`"use strict"; return (${sanitized})`)();
        if (typeof result !== "number" || !isFinite(result)) {
          return `Result: ${result}`;
        }
        return String(result);
      } catch {
        return `Error: Invalid expression "${expr}"`;
      }
    },
  },
  {
    definition: {
      type: "function",
      function: {
        name: "get_current_datetime",
        description: "Get the current date and time. Returns the local date, time, and timezone.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    execute: async () => {
      const now = new Date();
      return now.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "long",
      });
    },
  },
  {
    definition: {
      type: "function",
      function: {
        name: "random_number",
        description: "Generate a random integer between min and max (inclusive).",
        parameters: {
          type: "object",
          properties: {
            min: {
              type: "number",
              description: "Minimum value (inclusive)",
            },
            max: {
              type: "number",
              description: "Maximum value (inclusive)",
            },
          },
          required: ["min", "max"],
        },
      },
    },
    execute: async (args) => {
      const min = Number(args.min ?? 0);
      const max = Number(args.max ?? 100);
      if (!isFinite(min) || !isFinite(max) || min > max) {
        return `Error: Invalid range [${min}, ${max}]`;
      }
      const result = Math.floor(Math.random() * (max - min + 1)) + min;
      return String(result);
    },
  },
];

export const BUILT_IN_TOOLS: ChatCompletionTool[] = TOOLS.map((t) => t.definition);

export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const tool = TOOLS.find((t) => t.definition.function.name === name);
  if (!tool) return `Error: Unknown tool "${name}"`;
  try {
    return await tool.execute(args);
  } catch (err) {
    return `Error executing ${name}: ${err instanceof Error ? err.message : String(err)}`;
  }
}
