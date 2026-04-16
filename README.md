# GrowthPilot

帮大学生把一个大目标拆成每天能开始的小动作，做完记一笔，一周下来自动复盘。

核心就是：**目标拆解 → 每日执行 → 行为记录 → 周期复盘 → 数据反馈**。

## 主要功能

- 中文首页，讲清楚产品是什么
- `/onboarding` — 填目标，大模型帮你拆成可执行的计划
- `/dashboard` — 看今天该干什么、整体进度怎么样
- `/goals/[goalId]` — 某个目标的详情和时间线
- `/focus` — 专注执行当天最关键的一个动作
- `/review` — 周复盘，大模型根据你的执行记录生成总结和建议
- `/profile` — 成长档案，累计数据和标签

## 技术栈

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Cloudflare D1 + Drizzle ORM
- Zod 做校验
- 大模型走 OpenAI 兼容接口（默认 Qwen3.5 Plus）
- 部署在 Cloudflare Workers

## 快速开始

**环境要求：** Node.js 20+

```bash
npm install
npm run dev
```

启动后访问 http://127.0.0.1:3000

### 环境变量

复制 `.env.example` 到 `.env.local`：

- `LLM_API_KEY` — 大模型 API 密钥，必填。没填的话会用规则模板兜底，不会报错但生成的内容不个性化
- `LLM_BASE_URL` — API 根路径，默认 `https://opencode.ai/zen/go/v1`
- `LLM_MODEL` — 模型 ID，默认 `qwen3.5-plus`

想用别的大模型服务也行，只要兼容 OpenAI 的 `/chat/completions` 接口，改这三个变量就行。

### 测试

```bash
npm run test:unit
npm run test:component
npm run build
```

没有 E2E 自动化测试，手动验证为主。

## 项目结构

```
src/
  app/           # 页面和 API 路由
  components/    # UI 组件，按页面分目录
  lib/
    ai/          # 大模型调用和 JSON 提取
    client/      # 浏览器端存储
    cloudflare/  # Cloudflare 环境适配
    db/          # 数据库 schema 和查询
    mock/        # 无大模型时的兜底数据
    validation/  # Zod schema
  styles/        # 全局 CSS

drizzle/         # 数据库迁移 SQL
public/          # 静态资源
tests/           # 单元测试和组件测试
```

## 线上部署

推荐流程：本地开发 → git push → GitHub Actions → Cloudflare

仓库里已经有 CI 配置（`.github/workflows/deploy-cloudflare.yml`），需要配置两个 GitHub Secrets：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

部署前还要在 Cloudflare 设置：

1. D1 数据库 ID 写到 `wrangler.jsonc` 的 `database_id` 字段
2. Worker 环境变量里加密存储 `LLM_API_KEY`
3. `LLM_BASE_URL` 和 `LLM_MODEL` 可以在 `wrangler.jsonc` 的 `vars` 里改，也可以在 Cloudflare Dashboard 覆盖

```bash
npx wrangler secret put LLM_API_KEY
```

## 已知问题

- 用户认证还是写死的 `growthpilot-demo-user`，没有真正的登录系统
- Focus 页面没有 DB 的时候只能从 localStorage 读，新设备或清缓存后数据就没了
- 周复盘的大模型调用没有缓存，每次访问都可能重新请求
- Profile 页的数据目前是凑出来的，不是真实积累
- 没有做移动端适配，手机上看体验一般

## 许可证

MIT

## 作者

Sakura — jaysakura@163.com