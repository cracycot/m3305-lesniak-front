---
name: subagent-dev-workflow
description: Orchestrates the worker-then-reviewer development loop. Use when the agent receives implementation, creation, or any other development task—launch worker first, then code reviewer; if the reviewer reports critical issues or optimizations, launch worker again to address them.
---

# Subagent Development Workflow

## When to Apply

Apply this workflow when the user request is a **development task**: implementing a feature, creating something new, refactoring, fixing by coding, or any task that involves writing or changing code. Do not apply for read-only tasks (e.g. explaining code, searching the codebase, answering questions).

## Workflow Steps

### 1. Launch worker first

- Use the **worker** subagent to perform the implementation or development task.
- Pass a clear, self-contained task description and any needed context (files, requirements).
- Wait for the worker to complete before proceeding.

### 2. Launch code reviewer after worker completes

- After the worker finishes, launch the **code-reviewer** subagent to review the changes.
- Provide context: what was implemented and which files were modified or created.
- The code reviewer must run on the result of the worker’s work (e.g. recent diffs or indicated files).

### 3. Decide: iterate or finish

- If the **code reviewer reports**:
  - **Critical errors** (must fix), or  
  - **Important flaws**, or  
  - **Clear optimization opportunities**  
  then go to step 4.
- If the reviewer has no critical issues and no required optimizations, the workflow is complete.

### 4. Launch worker again to address review

- Launch the **worker** subagent again with the code reviewer’s feedback as the task.
- Specify that the worker must implement all critical fixes and the suggested optimizations from the review.
- After the worker completes, you may run the code reviewer again (step 2) if you need another review round, or finish.

## Summary

```
Development task received
    → Worker (implement)
    → Code reviewer (review)
    → If critical issues or optimizations: Worker again (fix/optimize)
    → Optionally: Code reviewer again, then done
```

## Notes

- The **worker** does the implementation; the **code reviewer** only reviews and writes feedback.
- The worker is launched first for every development task; the code reviewer always runs after the worker on that task’s output.
- Only trigger the second worker run when the reviewer has identified critical errors, significant flaws, or concrete optimizations to implement.
