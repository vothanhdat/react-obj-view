# Generic Tree Stack

This document describes the reusable pieces that power every tree-driven experience in `react-obj-view`. The same stack works for the built-in object inspector and for any custom tree you want to build.

```
value + adapter --> tree-core (walkingFactory) --> react-tree-view hook --> ReactTreeView --> VirtualScroller
```

## 1. `tree-core`

Located in [`src/libs/tree-core`](../src/libs/tree-core), this package exposes a deterministic, memoised walker:

- [`walkingFactory`](../src/libs/tree-core/walkingFactory.ts) accepts a `WalkingAdapter` and returns an instance with `walking`, `getNode`, `refreshPath`, and `toggleExpand` methods. It caches traversal state in [`StateFactory`](../src/libs/tree-core/utils/StateFactory.ts) so only dirty subtrees are recomputed when inputs change.
- [`types.ts`](../src/libs/tree-core/types.ts) defines strongly-typed contracts for adapters, contexts, and node metadata. Use the provided helpers (`InferWalkingType`, `InferWalkingInstance`, etc.) to keep your React layer type-safe.

An adapter describes how to iterate your domain-specific nodes:

```ts
export type WalkingAdapter<Value, Key, Meta, Config, Context> = {
  valueHasChild: (value, key, meta) => boolean;
  iterateChilds: (value, ctx, stableRef, cb) => void;
  defaultMeta: (value, key) => Meta;
  defaultContext: (ctx: WalkingContext<Config>) => Context;
  getConfigTokenId: (config: Config) => number;
  valueDefaultExpaned?: (meta, ctx) => boolean;
  isValueChange?: (prev, next) => boolean;
  transformValue?: (value, stableRef) => Value;
};
```

The walker never assumes anything about objects versus arrays—it only follows whatever your adapter describes.

## 2. `react-tree-view`

The UI glue in [`src/libs/react-tree-view`](../src/libs/react-tree-view) connects walkers to React components.

- [`useReactTree`](../src/libs/react-tree-view/useReactTree.tsx) memoises a walker instance, exposes `getNodeByIndex`, `refreshPath`, and `toggleChildExpand`, and keeps traversal output in sync with the current `value`, `config`, and `expandDepth`.
- [`FlattenNodeWrapper`](../src/libs/react-tree-view/FlattenNodeWrapper.tsx) converts raw walker nodes into serialisable metadata (`path`, `depth`, parsed meta fields, etc.). Provide a `metaParser` so UI components can consume metadata without knowing about bitmasks or adapter specifics.
- [`ReactTreeView`](../src/libs/react-tree-view/ReactTreeView.tsx) renders rows via the shared [`VirtualScroller`](../src/libs/virtual-scroller/VirtualScroller.tsx) and wires sticky path headers through [`useRenderIndexesWithSticky`](../src/libs/react-tree-view/useRednerIndexesWithSticky.tsx).

## 3. Virtualisation layer

The virtual scroller in [`src/libs/virtual-scroller`](../src/libs/virtual-scroller) accepts any row renderer:

- [`VirtualScroller.tsx`](../src/libs/virtual-scroller/VirtualScroller.tsx) calculates visible indices, measures scroll offsets, and delegates row creation to the provided component.
- `react-tree-view` ships [`VirtualScrollRender`](../src/libs/react-tree-view/VirtualScrollRender.tsx), which draws rows absolutely positioned inside the container and optionally paints sticky ancestor rows.

Pass the correct `lineHeight` so virtualisation math stays accurate.

## 4. Compose your own tree view

The following example shows how to build a file-system-like tree on top of the generic stack.

```tsx
import {
  walkingFactory,
  type WalkingAdaper,
  type WalkingContext,
} from "../src/libs/tree-core";
import {
  ReactTreeView,
  useReactTree,
  type ReactTreeRowRenderProps,
} from "../src/libs/react-tree-view";

// 1) Describe your domain
export type FileNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: FileNode[];
};

export type FileMeta = { label: string; isFolder: boolean };
export type FileConfig = { hideEmptyFolders: boolean };

const fileAdapter: WalkingAdaper<
  FileNode,
  string,
  FileMeta,
  FileConfig,
  WalkingContext<FileConfig>
> = {
  valueHasChild(node) {
    return node.type === "folder" && !!node.children?.length;
  },
  iterateChilds(node, ctx, _stableRef, cb) {
    node.children?.forEach((child, index) => {
      if (ctx.config.hideEmptyFolders && child.type === "folder" && !child.children?.length) {
        return;
      }
      cb(child, child.id ?? String(index), { label: child.name, isFolder: child.type === "folder" });
    });
  },
  defaultMeta(value) {
    return { label: value.name, isFolder: value.type === "folder" };
  },
  defaultContext(ctx) {
    return ctx;
  },
  getConfigTokenId(config) {
    return Number(config.hideEmptyFolders);
  },
};

const fileTreeFactory = () => walkingFactory(fileAdapter);
const parseFileMeta = (meta: FileMeta) => meta;

const FileRow: React.FC<ReactTreeRowRenderProps<typeof fileAdapter, typeof parseFileMeta>> = ({
  nodeDataWrapper,
  actions,
}) => {
  const node = nodeDataWrapper();
  return (
    <div style={{ paddingLeft: node.depth * 14 }}>
      {node.childCanExpand && (
        <button onClick={actions.toggleChildExpand} aria-label="toggle">
          {node.expanded ? "▼" : "▶"}
        </button>
      )}
      <span>{node.label}</span>
    </div>
  );
};

export function FileTree({ root }: { root: FileNode }) {
  const tree = useReactTree({
    factory: fileTreeFactory,
    config: { hideEmptyFolders: false },
    expandDepth: 1,
    metaParser: parseFileMeta,
    name: root.name,
    value: root,
  });

  return (
    <ReactTreeView
      {...tree}
      lineHeight={18}
      RowRenderer={FileRow}
      options={{}}
      rowDivProps={{ className: "row" }}
      containerDivProps={{ className: "file-tree" }}
    />
  );
}
```

### Key takeaways

1. Implement a `WalkingAdapter` that knows how to iterate your nodes.
2. Create a `metaParser` to convert adapter-specific metadata into something the UI can consume.
3. Use `useReactTree` to memoise the walker instance for a given value/config combination.
4. Render rows through `ReactTreeView` (or reuse `VirtualScroller` directly if you already have a row component).

Once this scaffold is in place you can layer domain-specific UIs, keyboard handlers, or context menus without touching the core tree engine.
