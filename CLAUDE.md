# Home Assistant Agentic Automation

## Build & Test Commands

- Run tests: `bun t`
- Run single test: `bun test server/lib/file.test.ts`
- Lint & typecheck: `bun lint`
- Fix linting: `bun f`

## Code Style Guidelines

- TypeScript with strict type checking throughout
- Use RxJS Observables for event streams and async operations
- Implement modular patterns with separate files for specific functionality
- Error handling: Use async/await with try/catch
- Naming: camelCase for variables/functions, PascalCase for types/interfaces
- Create reusable utility files for common functionality
- Use environment variables for configuration
- Add files to components/ui via the shadcn CLI tool
