# GrowthPilot MVP 大模型通用化改造执行计划书（V3）

> 基于V1、V2已完成的所有修复，本次聚焦一个核心问题：线上 Cloudflare Workers 无法访问 DashScope 阿里云端点，大模型调用100%回退为规则模板。解决方案是将大模型调用层从 DashScope 硬编码改为通用 OpenAI 兼容接口，用户只需改环境变量即可切换任意全球可用提供商。

---

## 一、根因分析

DashScope 端点 `dashscope.aliyuncs.com` 是中国境内服务，Cloudflare Workers 从全球边缘节点发起请求时网络不可达。即使 V2 已将 API Key 从 Cloudflare Worker 环境正确透传，请求根本走不通阿里云。

**解决方案**：将 API 调用切换为全球可访问的 OpenAI 兼容接口（如 OpenRouter），支持任意 OpenAI 兼容提供商。当前代码已使用 `/v1/chat/completions` 格式，只需改端点URL、环境变量名、默认模型名。

---

## 二、修改文件清单

| # | 文件 | 操作 |
|---|------|------|
| 1 | `src/lib/ai/llm-config.ts` | **新建** |
| 2 | `src/lib/ai/resolve-ai-options.ts` | **新建** |
| 3 | `src/lib/ai/goal-planner.ts` | 修改 |
| 4 | `src/lib/ai/review-generator.ts` | 修改 |
| 5 | `src/lib/cloudflare/env.ts` | 修改 |
| 6 | `src/app/api/goals/route.ts` | 修改 |
| 7 | `src/app/api/reviews/generate/route.ts` | 修改 |
| 8 | `src/app/review/page.tsx` | 修改 |
| 9 | `wrangler.jsonc` | 修改 |
| 10 | `.env.example` | 修改 |
| 11 | `.env.local` | 修改（不提交） |
| 12 | `README.md` | 修改 |
| 13 | `.github/workflows/deploy-cloudflare.yml` | 修改 |

共 13 个文件（2 新建 + 11 修改）。

---

## 三、执行步骤

### Phase 1：新建 LLM 配置层

#### Step 1.1：新建 `src/lib/ai/llm-config.ts`

```typescript
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "qwen/qwen3.5-plus";

export type LlmConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export function resolveLlmConfig(options?: {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): LlmConfig | null {
  const apiKey = options?.apiKey?.trim() || process.env.LLM_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const baseUrl = options?.baseUrl?.trim() || process.env.LLM_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const model = options?.model?.trim() || process.env.LLM_MODEL?.trim() || DEFAULT_MODEL;

  return { apiKey, baseUrl, model };
}
```

#### Step 1.2：新建 `src/lib/ai/resolve-ai-options.ts`

```typescript
import type { LlmConfig } from "@/lib/ai/llm-config";
import type { CloudflareEnv } from "@/lib/cloudflare/env";

export function resolveAiOptionsFromEnv(env: Partial<CloudflareEnv> | undefined): {
  llm?: LlmConfig;
} {
  const apiKey = (env?.LLM_API_KEY as string | undefined) || process.env.LLM_API_KEY;
  if (!apiKey) {
    return {};
  }

  return {
    llm: {
      apiKey,
      baseUrl: (env?.LLM_BASE_URL as string | undefined) || process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1",
      model: (env?.LLM_MODEL as string | undefined) || process.env.LLM_MODEL || "qwen/qwen3.5-plus",
    },
  };
}
```

---

### Phase 2：改造 AI 调用层

#### Step 2.1：改造 `src/lib/ai/goal-planner.ts`

**操作要点**：

1. **新增 import**：
```typescript
import { resolveLlmConfig, type LlmConfig } from "@/lib/ai/llm-config";
```

2. **删除**：`const defaultModel = "tongyi-xiaomi-analysis-flash";`

3. **修改类型定义**：
```typescript
export type GoalPlannerOptions = {
  llm?: LlmConfig;
};
```

4. **修改函数签名**：
```typescript
export async function generatePersonalizedGoalPlan(
  input: GoalRequest,
  options?: GoalPlannerOptions,
): Promise<PersonalizedGoalPlan> {
```

5. **替换 apiKey/model 获取逻辑**（原第99-104行区域）：

原代码：
```typescript
const apiKey = options?.apiKey?.trim() || process.env.DASHSCOPE_API_KEY?.trim();
const model = options?.model?.trim() || process.env.DASHSCOPE_MODEL?.trim() || defaultModel;

if (!apiKey) {
  return fallback;
}
```

替换为：
```typescript
const config = resolveLlmConfig(
  options?.llm ? { apiKey: options.llm.apiKey, baseUrl: options.llm.baseUrl, model: options.llm.model } : undefined,
);

if (!config) {
  return fallback;
}
```

6. **替换 fetch 调用**（原第121-136行区域）：

原代码：
```typescript
const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model,
    messages: [
      { role: "system", content: "你只输出合法 JSON 对象一行或多行均可，禁止 markdown 与任何非 JSON 内容。" },
      { role: "user", content: prompt },
    ],
    temperature: 0,
    top_k: 1,
  }),
});
```

替换为：
```typescript
const response = await fetch(`${config.baseUrl}/chat/completions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  },
  body: JSON.stringify({
    model: config.model,
    messages: [
      { role: "system", content: "你只输出合法 JSON 对象一行或多行均可，禁止 markdown 与任何非 JSON 内容。" },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  }),
});
```

7. **修改 console.error 前缀**：`"DashScope API Error (goal-planner):"` → `"LLM API Error (goal-planner):"`

8. **修改 catch 中的 console.error**：`"Fetch Exception (goal-planner):"` → `"LLM Fetch Exception (goal-planner):"`

#### Step 2.2：改造 `src/lib/ai/review-generator.ts`

**操作要点**：

1. **新增 import**：
```typescript
import { resolveLlmConfig, type LlmConfig } from "@/lib/ai/llm-config";
```

2. **删除**：`const defaultModel = "tongyi-xiaomi-analysis-flash";`

3. **修改类型定义**：
```typescript
export type ReviewGeneratorOptions = {
  llm?: LlmConfig;
};
```

4. **修改 `generatePersonalizedReview` 函数签名**：
```typescript
async function generatePersonalizedReview(
  input: WeeklyReviewFallbackInput,
  options?: ReviewGeneratorOptions,
): Promise<WeeklyReviewFallback> {
```

5. **替换 apiKey/model 获取逻辑**（原第50-55行区域）：

原代码：
```typescript
const apiKey = options?.apiKey?.trim() || process.env.DASHSCOPE_API_KEY?.trim();
const model = options?.model?.trim() || process.env.DASHSCOPE_MODEL?.trim() || defaultModel;

if (!apiKey) {
  return fallback;
}
```

替换为：
```typescript
const config = resolveLlmConfig(
  options?.llm ? { apiKey: options.llm.apiKey, baseUrl: options.llm.baseUrl, model: options.llm.model } : undefined,
);

if (!config) {
  return fallback;
}
```

6. **替换 fetch 调用**（原第75-93行区域）：

原代码：
```typescript
const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model,
    messages: [
      {
        role: "system",
        content:
          "Act as an empathetic Growth Coach for a Chinese college student. Return ONLY a valid JSON object with two fields: summary (a warm, brief paragraph summarizing the week) and advice (1-2 actionable tips for next week based on the delay reasons). Write summary and advice in Chinese.",
      },
      { role: "user", content: userPayload },
    ],
    temperature: 0,
    top_k: 1,
  }),
});
```

替换为：
```typescript
const response = await fetch(`${config.baseUrl}/chat/completions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  },
  body: JSON.stringify({
    model: config.model,
    messages: [
      {
        role: "system",
        content:
          "Act as an empathetic Growth Coach for a Chinese college student. Return ONLY a valid JSON object with two fields: summary (a warm, brief paragraph summarizing the week) and advice (1-2 actionable tips for next week based on the delay reasons). Write summary and advice in Chinese.",
      },
      { role: "user", content: userPayload },
    ],
    temperature: 0,
  }),
});
```

7. **修改 console.error 前缀**：`"DashScope API Error (review-generator):"` → `"LLM API Error (review-generator):"`

8. **修改 catch 中的 console.error**：`"Fetch Exception (review-generator):"` → `"LLM Fetch Exception (review-generator):"`

9. **`generateWeeklyReview` 签名不变**，透传 `options` 参数。

---

### Phase 3：改造调用方

#### Step 3.1：修改 `src/lib/cloudflare/env.ts`

将类型定义从：
```typescript
export type CloudflareEnv = {
  DB: AnyD1Database;
  DASHSCOPE_API_KEY?: string;
  DASHSCOPE_MODEL?: string;
};
```

改为：
```typescript
export type CloudflareEnv = {
  DB: AnyD1Database;
  LLM_API_KEY?: string;
  LLM_BASE_URL?: string;
  LLM_MODEL?: string;
};
```

#### Step 3.2：修改 `src/app/api/goals/route.ts`

1. **修改 import**：

删除：
```typescript
import { type GoalPlannerOptions, generatePersonalizedGoalPlan } from "@/lib/ai/goal-planner";
```

改为：
```typescript
import { generatePersonalizedGoalPlan } from "@/lib/ai/goal-planner";
import { resolveAiOptionsFromEnv } from "@/lib/ai/resolve-ai-options";
```

2. **将 aiOptions 构造逻辑**（约第16-19行）从：
```typescript
const aiOptions: GoalPlannerOptions = {
  apiKey: (env?.DASHSCOPE_API_KEY as string | undefined) || process.env.DASHSCOPE_API_KEY,
  model: (env?.DASHSCOPE_MODEL as string | undefined) || process.env.DASHSCOPE_MODEL,
};
```

改为：
```typescript
const aiOptions = resolveAiOptionsFromEnv(env);
```

#### Step 3.3：修改 `src/app/api/reviews/generate/route.ts`

1. **修改 import**：

删除：
```typescript
import { type ReviewGeneratorOptions, generateWeeklyReview } from "@/lib/ai/review-generator";
```

改为：
```typescript
import { generateWeeklyReview } from "@/lib/ai/review-generator";
import { resolveAiOptionsFromEnv } from "@/lib/ai/resolve-ai-options";
```

2. **将 aiOptions 构造逻辑**（约第22-25行）从：
```typescript
const aiOptions: ReviewGeneratorOptions = {
  apiKey: (env?.DASHSCOPE_API_KEY as string | undefined) || process.env.DASHSCOPE_API_KEY,
  model: (env?.DASHSCOPE_MODEL as string | undefined) || process.env.DASHSCOPE_MODEL,
};
```

改为：
```typescript
const aiOptions = resolveAiOptionsFromEnv(env);
```

#### Step 3.4：修改 `src/app/review/page.tsx`

1. **修改 import**：

删除：
```typescript
import { type ReviewGeneratorOptions, generateWeeklyReview } from "@/lib/ai/review-generator";
```

改为：
```typescript
import { generateWeeklyReview } from "@/lib/ai/review-generator";
import { resolveAiOptionsFromEnv } from "@/lib/ai/resolve-ai-options";
```

2. **将 aiOptions 构造逻辑**（约第21-24行）从：
```typescript
const aiOptions: ReviewGeneratorOptions = {
  apiKey: (env?.DASHSCOPE_API_KEY as string | undefined) || process.env.DASHSCOPE_API_KEY,
  model: (env?.DASHSCOPE_MODEL as string | undefined) || process.env.DASHSCOPE_MODEL,
};
```

改为：
```typescript
const aiOptions = resolveAiOptionsFromEnv(env);
```

---

### Phase 4：环境变量与文档更新

#### Step 4.1：修改 `wrangler.jsonc`

将 `"vars"` 段从：
```jsonc
"vars": {
  "DASHSCOPE_MODEL": "tongyi-xiaomi-analysis-flash"
}
```

改为：
```jsonc
"vars": {
  "LLM_BASE_URL": "https://openrouter.ai/api/v1",
  "LLM_MODEL": "qwen/qwen3.5-plus"
}
```

#### Step 4.2：修改 `.env.example`

将全部内容替换为：
```
NEXT_PUBLIC_APP_NAME=GrowthPilot
NEXT_PUBLIC_DEFAULT_LOCALE=zh-CN
LLM_API_KEY=
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=qwen/qwen3.5-plus
```

#### Step 4.3：修改 `.env.local`

将全部内容替换为（Key 由使用者填写）：
```
LLM_API_KEY=你的API Key
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=qwen/qwen3.5-plus
```

#### Step 4.4：修改 `README.md`

将 `## 环境变量` 段（从该标题开始到 `## 推荐部署方式` 之前）替换为：

```markdown
## 环境变量

复制 `.env.example` 到 `.env.local` 后填写：

- `LLM_API_KEY`：大模型 API 密钥（必填，缺失则回退为规则模板）
- `LLM_BASE_URL`：API 端点，默认 `https://openrouter.ai/api/v1`
- `LLM_MODEL`：模型名称，默认 `qwen/qwen3.5-plus`

### Cloudflare 线上部署

线上部署除配置 GitHub Secrets 外，还需在 Cloudflare 设置 Worker 环境变量：

1. 在 Cloudflare Dashboard → Workers → growthpilot → Settings → Variables 中设置：
   - `LLM_API_KEY`（选择 Encrypt 加密存储）
   - `LLM_BASE_URL`（已在 `wrangler.jsonc` 的 `vars` 中默认配置，可覆盖）
   - `LLM_MODEL`（已在 `wrangler.jsonc` 的 `vars` 中默认配置，可覆盖）
2. 或通过命令行：
   ```bash
   npx wrangler secret put LLM_API_KEY
   ```
```

#### Step 4.5：修改 `.github/workflows/deploy-cloudflare.yml`

将 `Verify required secrets` 步骤中的提示从 `DASHSCOPE_API_KEY` 改为 `LLM_API_KEY`：

原代码：
```yaml
- name: Verify required secrets
  run: |
    echo "::notice::DASHSCOPE_API_KEY must be set as Cloudflare Worker secret before deployment."
    echo "::notice::Run: npx wrangler secret put DASHSCOPE_API_KEY"
```

改为：
```yaml
- name: Verify required secrets
  run: |
    echo "::notice::LLM_API_KEY must be set as Cloudflare Worker secret before deployment."
    echo "::notice::Run: npx wrangler secret put LLM_API_KEY"
```

---

### Phase 5：验证

#### Step 5.1：构建验证

```bash
npm run build
```

确认无类型错误。

#### Step 5.2：测试

```bash
npm run test:unit
npm run test:component
```

#### Step 5.3：全局搜索确认

| 搜索目标 | 预期结果 |
|----------|----------|
| `DASHSCOPE` | 0 个引用 |
| `dashscope.aliyuncs.com` | 0 个引用 |
| `tongyi-xiaomi` | 0 个引用 |
| `top_k` | 0 个引用 |
| `LLM_API_KEY` | 在 `llm-config.ts`、`resolve-ai-options.ts`、`env.ts`、`.env.example`、README、CI 中出现 |
| `resolveLlmConfig` | 在 `goal-planner.ts` 和 `review-generator.ts` 中调用 |
| `resolveAiOptionsFromEnv` | 在 `goals/route.ts`、`reviews/generate/route.ts`、`review/page.tsx` 中调用 |

#### Step 5.4：本地功能验证

1. 在 `.env.local` 填入有效的 LLM API Key
2. `npm run dev` 启动
3. 访问 `/onboarding`，创建目标，确认显示「生成方式：大模型个性化」
4. 访问 `/review`，确认显示个性化复盘内容
5. 确认 Focus 页面离线视图正常

---

## 四、不修改项

| 项目 | 原因 |
|------|------|
| AI prompt 内容 | 与提供商无关 |
| `extractJsonObject` | 通用 JSON 提取工具 |
| `buildGoalPlan`/`buildWeeklyReviewFallback` | 规则 fallback 逻辑 |
| Cloudflare Worker env 透传机制 | V2 已实现，仅改字段名 |
| localStorage 离线存储 | V2 已实现 |
| `userId: "growthpilot-demo-user"` 硬编码 | MVP 不做用户认证 |

---

## 五、关键设计决策

1. **`LLM_*` 命名而非 `OPENROUTER_*`**：保持通用性，换服务商只改 Key 和 baseUrl，代码零改动。
2. **`baseUrl` 做成环境变量**：不同提供商端点不同（OpenRouter: `https://openrouter.ai/api/v1`，OpenAI: `https://api.openai.com/v1`），一行配置搞定。
3. **移除 `top_k: 1`**：DashScope 特有参数，非 OpenAI 兼容标准。
4. **URL 拼接为 `${baseUrl}/chat/completions`**：所有 OpenAI 兼容提供商都是 `/v1/chat/completions`，baseUrl 已含 `/v1` 前缀，拼接即可。
5. **`resolveLlmConfig` 与 `resolveAiOptionsFromEnv` 分离**：前者是纯逻辑（可单元测试），后者是环境感知（Cloudflare + process.env 复合），职责清晰。