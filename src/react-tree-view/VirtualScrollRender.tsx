import React, { ReactNode } from "react";
import { VirtualScrollRowRender } from "./VirtualScrollRowRender";
import { WalkingAdaperBase } from "../tree-core";
import { MetaParserBase } from "./FlattenNodeWrapper";
import { ReactTreeViewVitualRenderProps } from "./types";
import { useRednerIndexesWithSticky } from "./useRednerIndexesWithSticky";



export const VirtualScrollRender: <
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>,
    RenderOptions
>(
    props: ReactTreeViewVitualRenderProps<T, MetaParser, RenderOptions>
) => ReactNode = (props) => {
    const {
        start, end, offset,
        childCount, 
        RowRenderer, 
        lineHeight,
        options,
        rowDivProps,
        computeItemKey,
        getNodeByIndex,
        refreshPath,
        toggleChildExpand,
        ...rest
    } = props;


    const renderIndexes = useRednerIndexesWithSticky({
        start, end,
        lineHeight, childCount,
        getNodeByIndex,
        stickyHeader: true,
    });

    return <>
        {renderIndexes.map(({ isStick, index, isLastStick, position }) => <div
            {...rowDivProps}
            key={computeItemKey(index)}
            style={isStick ? {
                position: "sticky",
                top: `${position * lineHeight - offset}px`,
                height: `${lineHeight}px`,
                zIndex: Math.floor(100 - position),
                backgroundColor: "var(--bg-color)",
                borderBottom: isLastStick
                    ? "solid 1px color-mix(in srgb, var(--color) 30%, transparent)"
                    : ""
            } : {
                position: "absolute",
                top: `${index * lineHeight}px`,
                height: `${lineHeight}px`,
            }}
        >
            <VirtualScrollRowRender
                index={index}
                RowRender={RowRenderer}
                getNodeByIndex={getNodeByIndex}
                toggleChildExpand={toggleChildExpand}
                refreshPath={refreshPath}
                options={options}
                size={childCount} />
        </div>)}
    </>;
};
