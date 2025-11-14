import { ThemeColor } from "../themes";
import type { ResolverFn } from "../objectWalker";
export { type WalkingConfig } from "@react-obj-view/tree-core";
export {
    type ResolverFn,
    type ResolverFnCb,
    type Entry,
} from "../objectWalker";

export type ObjectViewProps = {
    valueGetter: () => unknown;
    name?: string;

    expandLevel?: number | boolean;
    objectGroupSize?: number; // >= 2 or no grouping
    arrayGroupSize?: number; // >= 2 or no grouping
    resolver?: Map<any, ResolverFn>;
    highlightUpdate?: boolean;
    stickyPathHeaders?:boolean;
    preview?: boolean;
    nonEnumerable?: boolean;
    showLineNumbers?: boolean;
    includeSymbols?: boolean;

    style?: React.CSSProperties | ThemeColor;
    lineHeight?: number;
    className?: string;
};
