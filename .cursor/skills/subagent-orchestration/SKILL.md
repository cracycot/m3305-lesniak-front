---
name: subagent-orchestration
description: Orchestrates planner → worker → code reviewer for large or multi-task requests. When the user gives a complex task or list of tasks, the agent runs the planner to produce a plan and task files, then for each task runs the worker to implement and the code reviewer to check; iterates worker–reviewer until the task passes, then proceeds to the next task until all are done.
---

# Subagent Orchestration (Planner → Worker → Code Reviewer)

## When to Apply

Apply when the user request is a **large, complex task** or an **explicit list of tasks**: multi-step implementation, feature set, refactor spanning many areas, or any work that benefits from a written plan and per-task execution with review. Do not apply for single small tasks (use the worker–reviewer loop instead) or for read-only requests.

## Workflow Overview

```
Request (complex / list of tasks)
    → Planner (creates plan + task files)
    → For each task, in order:
        → Worker (implements task)
        → Code reviewer (reviews implementation)
        → If critical issues or required fixes: Worker again → Code reviewer again (repeat until pass)
    → Next task
    → All tasks done → finish
```

## Step 1: Launch planner

- Invoke the **planner** subagent with the full user request (complex task or list of tasks).
- The planner must produce:
  - One **plan file** (e.g. `.cursor/plans/<name>-plan.md`) with goal, phases, and **links to each subtask file**.
  - One **task description file** per subtask (e.g. `.cursor/plans/<name>-01-setup.md`, …), each self-contained with objective, scope, acceptance criteria, dependencies, deliverables.
- Wait for the planner to finish. Do not start workers until the plan and all task files exist.

## Step 2: Execute tasks in order

- Open the plan file and determine the **execution order** (from phases and dependency notes).
- For **each subtask**, in that order, run steps 3–5 below. Do not move to the next subtask until the current one is marked done (reviewer has no critical issues).

## Step 3: Launch worker for the current task

- Invoke the **worker** subagent with:
  - The **path to that subtask’s task file** (e.g. `.cursor/plans/my-feature-02-api.md`).
  - Any extra context from the plan (e.g. related files, conventions).
- Task description must be self-contained so the worker can implement from the file alone. Wait for the worker to complete before reviewing.

## Step 4: Launch code reviewer

- After the worker completes, invoke the **code-reviewer** subagent.
- Pass context: which task was implemented and which files were created or modified.
- The reviewer runs on the worker’s output (e.g. recent diffs or the indicated files).

## Step 5: Iterate or mark task done

- If the **code reviewer** reports:
  - **Critical issues** (must fix), or  
  - **Required optimizations or important flaws**  
  → Go to step 6.
- If the reviewer has **no critical issues** and no required fixes for this task → consider the **current task done**, then go back to step 2 for the **next task** (or finish if no tasks left).

## Step 6: Worker again to address review

- Invoke the **worker** again with the code reviewer’s feedback as the task (fix critical issues and requested optimizations).
- After the worker completes, run the **code reviewer** again (step 4).
- Repeat steps 5–6 until the reviewer passes the current task, then proceed to the next task (step 2).

## Summary Checklist

- [ ] Planner ran once and produced plan file + one file per subtask.
- [ ] Tasks executed in dependency order from the plan.
- [ ] For each task: Worker → Code reviewer; if issues, Worker (fix) → Code reviewer until pass.
- [ ] No subtask skipped; no move to next task until current one passes review.
- [ ] User informed when all tasks are done and where the plan and task files live.

## Notes

- **Planner** only runs at the start; it does not implement code.
- **Worker** implements; **code reviewer** only reviews and gives feedback.
- Use the plan file as the single source of order and links; open task files by the links in the plan.
- If the user adds or changes tasks later, you can run the planner again for an updated plan, then continue the same workflow on the new or changed tasks.
