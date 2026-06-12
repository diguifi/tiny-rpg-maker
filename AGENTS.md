# Agent Instructions

- A task can only be reported as finished when TypeScript, tests, and lint all pass perfectly.
- Required checks before finalizing any task:
  - `npx tsc --noEmit`
  - `npm run test:run`
  - `npm run lint`
- If any required check cannot be run, the task must not be described as fully complete; report the missing check clearly.
