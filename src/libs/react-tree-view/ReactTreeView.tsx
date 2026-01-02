import { type WalkingAdapterBase } from "../tree-core";
import { MetaParserBase } from "./FlattenNodeWrapper";
import { VirtualScroller } from "../virtual-scroller";
import { ReactTreeViewProps } from "./types";
import { VirtualScrollRender } from "./VirtualScrollRender";

export const ReactTreeView = <
    T extends WalkingAdapterBase,
    MetaParser extends MetaParserBase<T>,
    RenderOptions = {},
>(
    { containerDivProps, ...rest }: ReactTreeViewProps<T, MetaParser, RenderOptions>
) => {

    return <div {...containerDivProps}>
        <VirtualScroller<Omit<ReactTreeViewProps<T, MetaParser, RenderOptions>, 'containerDivProps'>>
            height={rest.childCount * rest.lineHeight}
            Component={VirtualScrollRender}
            {...rest}
        />
    </div>
}

export default ReactTreeView