# Refactory Session Log

Purpose:

1. Keep cross-session continuity for refactor work.
2. Ensure different Codex conversations follow the same execution standard.
3. Provide a quick resume point for new sessions.

Archive:

- Previous log archived at: `docs/1management/archive/refactory-session-log.2026-03-04.pre-reset.md`

---

## Entry Template

Copy this block and append at the top for each new refactor session.

```md
## [YYYY-MM-DD] Session N - <Short Goal>

- Refactory Scope:
  - Phase:
  - Task:
- In Scope Files:
  - `<path>`
- Out of Scope:
  - `<explicitly not touched>`
- Decisions:
  - `<decision 1>`
- Checks:
  - `npm test`: pass/fail/not-run
  - `npm run lint`: pass/fail/not-run
  - `npm run typecheck`: pass/fail/not-run
  - `prettier --check`: pass/fail/not-run
  - `npm run build:lib`: pass/fail/not-run
- Risks / Follow-up:
  - `<risk or blocker>`
- Next Recommended Unit:
  - `<next atomic refactor unit>`
```

---

## Log Entries

## [2026-03-04] Session 115 - RFX-001 Restore Lint Gate Executable Stability

- Refactory Scope:
  - Phase: Phase 0
  - Task: 通过依赖一致性修复恢复 `npm run lint` 与 `lint:active-file-boundary` 稳定可执行
- In Scope Files:
  - `docs/1management/refactory-session-log.md`
  - `docs/1management/refactory-fix-backlog.md`
- Out of Scope:
  - `src/**` 运行时代码与业务语义改动
  - `docs/1management/plan.md` 进度百分比更新
  - CI/workflow 文件改动
- Decisions:
  - 本地 `npm ci` 首次执行被 `node_modules/@esbuild/win32-x64/esbuild.exe` 进程占用阻断（EPERM）。
  - 仅结束 `onmyoji-flow` 相关 `vite/esbuild` 进程后重试 `npm ci`，不做配置降级或规则放宽。
  - 重建依赖后 `@typescript-eslint/parser` 恢复可用，`lint` gate 返回可执行状态。
- Checks:
  - `npm ci`: pass
  - `npm run lint`: pass
  - `npm run lint:active-file-boundary`: pass
  - `npm test`: not-run
  - `npm run typecheck`: not-run
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 若开发期间再次开启本地 `vite` 进程并触发锁文件冲突，后续 `npm ci` 仍可能复发同类 EPERM。
  - `format:check` 阻断仍在，下一原子任务应执行一次“仅格式化收敛”解除 gate 阻断。
- Next Recommended Unit:
  - `RFX-002（P0）执行一次仅格式化收敛单元`

