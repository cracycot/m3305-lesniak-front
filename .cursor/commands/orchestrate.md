# orchestrate

Apply the **subagent-orchestration** skill (file `.cursor/skills/subagent-orchestration/SKILL.md`) and run the complex development workflow.

**Input:** A large task, a complex multi-step task, or an explicit list of tasks from the user (in this message or the next one).

**Actions:**
1. Read and follow the instructions in the subagent-orchestration skill.
2. Run the orchestration: Planner → for each subtask Worker → Code reviewer → if needed iterate Worker/Reviewer until pass → next subtask.
3. Do not move to the next subtask until the current one passes review with no critical issues.

If the user has not yet described the task or list of tasks — ask for them before starting the planner.
