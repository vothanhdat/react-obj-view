# React Object View - AI Coding Instructions

## Project Overview
`react-obj-view` is a high-performance React component for inspecting deeply nested objects and data structures. It features virtualization, custom resolvers, and a flexible theming system.

## Architecture & Core Components

### High-Level Structure
- **`src/react-obj-view/`**: Main library entry point.
  - `ObjectView.tsx`: The primary public component. Handles prop normalization and context setup.
- **`src/libs/`**: Internal core libraries.
  - `react-tree-view/`: Generic tree view implementation, agnostic of the data being displayed.
  - `virtual-scroller/`: Custom virtual scrolling logic to handle large datasets efficiently.
  - `tree-core/`: Low-level tree traversal and state management.
- **`src/object-tree/`**: Logic specific to walking JavaScript objects.
  - Handles `resolvers` (how to display specific types like `Map`, `Set`, `Date`).
  - Implements grouping logic (`arrayGroupSize`, `objectGroupSize`).

### Key Patterns
- **Virtualization**: The component is designed for performance. It renders only visible rows.
- **Data Walking**: Data is "walked" lazily. The `valueGetter` prop is used to provide data to avoid unnecessary re-renders or calculations.
- **Resolvers**: Custom data types are handled via a `Map<Constructor, ResolverFn>` system.

## Development Workflows

### Commands
- **Start Demo**: `npm run dev` (Runs the development server with the demo app).
- **Build Library**: `npm run build` (Builds the distributable library using Vite).
- **Run Tests**: `npm test` (Runs Vitest).
- **Run Coverage**: `npm run test:coverage`.

### Testing
- Uses **Vitest** with `happy-dom`.
- Tests are co-located or in `src/test/`.
- Focus on testing the `ObjectView` component's rendering and interaction, as well as the `object-tree` walking logic.

## Coding Conventions

### React & TypeScript
- **React 19**: The project targets React 19.
- **Performance**:
  - Use `useMemo` and `useCallback` aggressively, especially for props passed to `ObjectView` like `valueGetter`.
  - Avoid inline object definitions for props that trigger re-renders in the virtual list.
- **Styling**:
  - Uses plain CSS imports (e.g., `import "./components/style.css"`).
  - Theme system uses TypeScript objects in `src/react-obj-view-themes/`.

### Specific Implementation Details
- **`valueGetter`**: Always prefer passing data via `valueGetter={() => data}` instead of `data={data}` to allow the component to manage when to access the value.
- **Resolvers**: When adding support for a new data type, create a resolver in `src/object-tree/resolver/` and register it.

## File Structure Highlights
- `src/index.ts`: Public API exports.
- `src/dev.tsx`: Development playground entry point.
- `vite.config.ts`: Library build configuration.
- `vite.config.dev.ts`: Demo app configuration.
