# GrowthPilot - AI Response Parsing Debug Plan (Aliyun DashScope - tongyi-xiaomi-analysis-flash)

> **To the Executing AI Agent:**
> You are receiving this document from the User. Your role is to act as the lead developer to execute this exact plan.
> The previous AI agent successfully integrated the `fetch` calls, and the API is now returning HTTP 200 OK (taking ~3.6s). 
> **The Problem:** Despite a successful API call, the UI still displays the hardcoded rule templates (e.g., "第一周先稳定在 23:30 前收尾"). This means the LLM successfully generated text, but our strict parsing logic (`extractJsonObject` or `normalizeGoalPlan`) is rejecting the LLM's output format and silently triggering the fallback.
> **The Goal:** We need to temporarily log the *exact* raw string that the LLM is returning to the terminal. Once we see the LLM's raw output, we can adjust the prompt or the parsing logic to handle it correctly. Additionally, the specific model `tongyi-xiaomi-analysis-flash` might require the `result_format` parameter as seen in the user's Python documentation.

## 1. Execution Directives (Sequential Steps)

**Executing AI Agent:** Please process the following steps in order. Pause and ask the User for input where indicated.

### Phase 1: Inject Raw LLM Logging

**[Action Required by AI AGENT]:**
Modify `src/lib/ai/goal-planner.ts` to log the exact response from the LLM before any parsing attempts.

1. **Modify `src/lib/ai/goal-planner.ts`:**
   - Locate the successful response parsing block:
     ```typescript
     const payload = (await response.json()) as { ... };
     const content = payload.choices?.[0]?.message?.content?.trim();
     ```
   - Immediately after extracting `content`, add a loud `console.log` statement so the User can see exactly what the LLM returned:
     ```typescript
     const content = payload.choices?.[0]?.message?.content?.trim();
     console.log("========== RAW LLM OUTPUT START ==========");
     console.log(content);
     console.log("========== RAW LLM OUTPUT END ==========");
     
     if (!content) {
       return fallback;
     }
     ```
   - Also, let's explicitly add `"result_format": "message"` to the `fetch` JSON body, just in case DashScope's compatible mode requires it for this specific model (as seen in the user's Python script).
     ```typescript
     body: JSON.stringify({
       model,
       messages: [ ... ],
       temperature: 0,
       top_k: 1,
       result_format: "message" // Add this line
     })
     ```

### Phase 2: Run Local Test & Capture Output

**[Action Required by USER]:**
1. User: Ensure your local development server is running (`npm run dev`).
2. User: Go to the browser and trigger the goal creation flow again (e.g., submit a new goal).
3. User: Look at your terminal where `npm run dev` is running. You should see the `========== RAW LLM OUTPUT START ==========` block.
4. User: **Copy the entire output between the START and END markers** and paste it back to the AI Agent.

### Phase 3: Analyze & Fix Parsing Logic

**[Action Required by AI AGENT]:**
- AI Agent: Once the User provides the raw LLM output, analyze it. 
  - Is it valid JSON?
  - Is it wrapped in markdown blocks?
  - Does it contain the expected keys (`milestones`, `tasks`, `planReason`)?
  - Are there extra conversational strings before or after the JSON?
- Based on the analysis, you must either:
  1. **Tweak the LLM Prompt:** Make the instructions stricter (e.g., "ONLY output valid JSON. Do not include any explanations or markdown formatting like ```json").
  2. **Tweak the Parsing Logic (`src/lib/ai/extract-json-object.ts`):** If the LLM is wrapping the response weirdly, make the extraction regex more robust.
  3. **Tweak the Normalization (`normalizeGoalPlan`):** If the LLM is returning slightly different keys (e.g., `milestone` instead of `milestones`), map them correctly.

### Phase 4: Final Cleanup & Commit

**[Action Required by AI AGENT]:**
1. Once the parsing issue is fixed and the User confirms the UI shows dynamic LLM content, remove the temporary `console.log` statements.
2. Stage and commit the fix.
   - Suggested commit: `fix: adjust LLM prompt and parsing logic for tongyi-xiaomi-analysis-flash compatibility`

---
**To the Executing AI Agent:** Acknowledge receipt of this plan. Begin by executing Phase 1 and asking the User to report back with the logs in Phase 2.

---

## 5. Completion status (executed 2026-04)

| Phase | Status | Notes |
|-------|--------|--------|
| **Phase 1** — Raw logging + `result_format: "message"` | Done | Temporary `console.log` was used for debugging; removed in Phase 4 after diagnosis. `result_format: "message"` kept in `goal-planner.ts`. |
| **Phase 2** — User captures terminal output | Done | Raw output was valid single-line JSON with `planReason`, `milestones`, `tasks`. |
| **Phase 3** — Analyze & fix | Done (see below) | Root cause was **not** failed JSON parsing. |
| **Phase 4** — Cleanup & commit | Done | Debug logs removed; fixes committed in sequence (offline plan hydration, server/client split, hydration defer, parsing hardening). |

### What we learned

- **Parsing** (`extractJsonObject` / `normalizeGoalPlan`) was able to accept the sample output. The UI still showed rule templates because **local dev had no D1 DB**, so the dashboard fallback path never received the LLM plan from persistence; **fix:** return `planSeed` from `POST /api/goals`, cache in `sessionStorage`, hydrate `DashboardOfflineView` / `GoalDetailOfflineView`, defer reads to `useEffect` to avoid hydration errors, and move `normalizeGoalCategory` to a server-safe module.
- **Follow-up hardening (Phase 3):** stricter prompts (exactly 3 milestones / 3 tasks, no markdown); **balanced-brace** JSON slice in `extract-json-object.ts` so `}` inside strings does not truncate; **`milestone` / `task` singular keys** tolerated in `normalizeGoalPlan`.

### Optional follow-ups (not required for this plan)

- Pass `planSeed` from server on redirect (e.g. cookie) to avoid a one-frame template flash before `sessionStorage` applies.
- Add automated tests for `extractJsonObject` / `normalizeGoalPlan` edge cases.