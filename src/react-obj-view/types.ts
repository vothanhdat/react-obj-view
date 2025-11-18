import type { FlattenNodeData, ReactTreeRowRenderProps } from "../libs/react-tree-view";
import { type ResolverFn, type ObjectWalkingAdater, type ObjectWalkingMetaParser } from "../object-tree";
import { ThemeColor } from "../react-obj-view-themes";


export type RenderOptions = {
    enablePreview: boolean;
    highlightUpdate: boolean;
    resolver: Map<any, ResolverFn>;
    showLineNumbers: boolean;
    includeSymbols: boolean;
    onMouseEnter: (index: number) => void;
    onMouseLeave: (index: number) => void;
    actionRenders?: React.FC<ObjectViewRenderRowProps>
};

export type ObjectViewRenderRowProps = ReactTreeRowRenderProps<
    ObjectWalkingAdater,
    ObjectWalkingMetaParser,
    RenderOptions
>


export type ObjectViewProps = {
    valueGetter: () => unknown;
    name?: string;

    expandLevel?: number | boolean;
    objectGroupSize?: number; // >= 2 or no grouping
    arrayGroupSize?: number; // >= 2 or no grouping
    resolver?: Map<any, ResolverFn>;
    highlightUpdate?: boolean;
    stickyPathHeaders?: boolean;
    preview?: boolean;
    nonEnumerable?: boolean;
    showLineNumbers?: boolean;
    includeSymbols?: boolean;

    style?: React.CSSProperties | ThemeColor;
    lineHeight?: number;
    className?: string;
};
