// 从 LLM 输出里切出第一个完整的 JSON 对象，处理好转义和嵌套
function sliceBalancedJsonObject(source: string, start: number): string | null {
  if (source[start] !== "{") {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < source.length; i++) {
    const c = source[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = false;
      }
      continue;
    }

    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") {
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  return null;
}

// 从大模型原始输出里捞 JSON，带 ```json 围栏也能处理
export function extractJsonObject(raw: string): string | null {
  const jsonFenced = raw.match(/```json\s*([\s\S]*?)```/i);
  let source: string;
  if (jsonFenced?.[1] !== undefined) {
    source = jsonFenced[1].trim();
  } else {
    const anyFenced = raw.match(/```[a-z]*\s*([\s\S]*?)```/i);
    source = (anyFenced?.[1] ?? raw).trim();
  }

  const firstBrace = source.indexOf("{");
  if (firstBrace < 0) {
    return null;
  }

  return sliceBalancedJsonObject(source, firstBrace);
}
