# Contributing to Espeezy

## Test-Driven Development (TDD) Workflow

All new features and bug fixes **must** be accompanied by tests written before implementation. This ensures reliability and prevents regressions.

### Required Steps
1. **Write Test Cases First**: For every new feature or bug fix, create or update relevant test files (unit, integration, or E2E) before writing implementation code.
2. **Open a Pull Request (PR)**: Submit your test cases in a PR. The PR will be reviewed and must pass CI checks.
3. **Implement the Feature**: Once tests are approved, implement the feature or fix.
4. **Update Tests if Needed**: Adjust tests if requirements change during implementation.
5. **Ensure All Tests Pass**: All tests must pass in CI/CD before merging.
6. **Maintain Coverage**: Minimum 80% test coverage is required for all merged code.

### Types of Tests
- **Unit Tests**: For individual functions/components
- **Integration Tests**: For API endpoints, service interactions
- **E2E Tests**: For user flows (Playwright)

### Example Workflow
1. Add a test to `tests/critical.spec.ts` for a new dashboard feature
2. Submit PR with the test
3. Implement the dashboard feature
4. Update the test if needed
5. Ensure all tests pass in CI
6. Merge PR

### CI Enforcement
- PRs without tests for new features will be blocked
- Coverage below 80% will block merges

---

Thank you for helping make Espeezy reliable and robust!
