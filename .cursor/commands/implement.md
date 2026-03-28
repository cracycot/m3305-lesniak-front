# implement

Apply the **subagent-dev-workflow** skill (file `.cursor/skills/subagent-dev-workflow/SKILL.md`): read it and run the development cycle described there.

**Task:** whatever the user wrote after `/implement` is the task description (implement a feature, write code, fix a bug, etc.). If nothing follows the command, ask the user what to do.

**Steps:**

1. **Read the skill** `.cursor/skills/subagent-dev-workflow/SKILL.md` and follow the workflow steps.
2. **Launch worker** — give it a clear task description and context (files, requirements). Wait for completion.
3. **Launch code-reviewer** — provide context: what was done and which files were changed or created. Review must run on the worker’s output.
4. **Decision:** if the reviewer reported critical errors, significant flaws, or clear optimizations — launch **worker again** with that feedback. Otherwise the cycle is done.

Use `mcp_task` with `subagent_type`: `worker` for implementation, `code-reviewer` for review. Do not apply this workflow to non-development tasks (read-only, explanations, code search).
