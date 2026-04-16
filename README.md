# GrowthPilot

GrowthPilot 是一个面向中国大陆大学生的成长驾驶舱产品。核心闭环是：

`目标拆解 -> 每日执行 -> 行为记录 -> 周期复盘 -> 数据反馈`

当前仓库保留的是可运行、可测试、可继续开发的最小交付版本。

## 当前能力

- 中文首页与品牌展示
- 目标引导页 `/onboarding`
- 成长驾驶舱 `/dashboard`
- 目标详情 `/goals/[goalId]`
- 今日行动 `/focus`
- 周复盘 `/review`
- 个人页 `/profile`
- D1 + Drizzle 数据层
- GitHub Actions -> Cloudflare 自动部署链路

## 本地开发

```bash
npm run dev
```

默认访问：

```text
http://127.0.0.1:3000
```

## 当前验证方式

- `npm run test:unit`
- `npm run test:component`
- `npm run build`

当前项目不再保留 E2E 自动化测试，改为人工手测。

## 环境变量

复制 `.env.example` 到 `.env.local` 后填写：

- `LLM_API_KEY`：大模型 API 密钥（必填，缺失则回退为规则模板）。若使用 **[OpenCode Go](https://opencode.ai/docs/zh-cn/go/)**，在 Zen 控制台订阅 Go 后复制密钥，与 TUI 里 `/connect` → **OpenCode Go** 相同来源（见 [Go 文档 · 工作原理](https://opencode.ai/docs/zh-cn/go/)）。
- `LLM_BASE_URL`：OpenAI 兼容 API 根路径，默认 **`https://opencode.ai/zen/go/v1`**。这与 [Go · API 端点](https://opencode.ai/docs/zh-cn/go/) 表中 **Qwen3.5 Plus** 的 `https://opencode.ai/zen/go/v1/chat/completions` 一致（代码会再拼 `/chat/completions`）。若改用其他全球可用 OpenAI 兼容服务，只改此三项即可。
- `LLM_MODEL`：请求体里的模型 ID，默认 **`qwen3.5-plus`**（与 Go 文档表格一致）。说明：OpenCode 应用内配置会用 `opencode-go/<model-id>` 形式，**本项目的 HTTP 请求仍使用表格中的短 ID**（如 `qwen3.5-plus`），除非你使用的网关明确要求带前缀。

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

## 推荐部署方式

推荐流程是：

`本地开发 -> git push -> GitHub Actions -> Cloudflare`

仓库已经包含 workflow：

- `.github/workflows/deploy-cloudflare.yml`

GitHub 侧还需要配置两个 Secrets：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 交接文档

详细交接内容见：

- [docs/HANDOFF.md](docs/HANDOFF.md)
