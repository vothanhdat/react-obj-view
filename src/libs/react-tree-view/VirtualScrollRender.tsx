import React, { ReactNode } from "react";
import { VirtualScrollRowRender } from "./VirtualScrollRowRender";
import { type WalkingAdaperBase } from "../tree-core";
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
        stickyPathHeaders = true,
        showLineNumbers = true,
        ...rest
    } = props;


    const renderIndexes = useRednerIndexesWithSticky({
        start, end,
        lineHeight, childCount,
        getNodeByIndex,
        stickyHeader: stickyPathHeaders,
    });

    const lineNumberChars = Math.max(2,String(renderIndexes.at(-1)?.index ?? 0).length)

    return <>
        {renderIndexes.map(({ isStick, index, isLastStick, position }) => <div
            {...rowDivProps}
            key={computeItemKey(index)}
            style={isStick ? {
                position: "sticky",
                top: `${position * lineHeight - offset}px`,
                height: `${lineHeight}px`,
                lineHeight: `${lineHeight}px`,
                zIndex: Math.floor(100 - position),
                backgroundColor: "var(--bg-color)",
                borderBottom: isLastStick
                    ? "solid 1px color-mix(in srgb, var(--color) 30%, transparent)"
                    : ""
            } : {
                position: "absolute",
                top: `${index * lineHeight}px`,
                height: `${lineHeight}px`,
                lineHeight: `${lineHeight}px`,
            }}
        >
            {showLineNumbers && <span className="line-number" style={{flexShrink:0}}>
                {String(index).padStart(lineNumberChars, " ")}:{" "}
            </span>}
            <VirtualScrollRowRender
                index={index}
                RowRender={RowRenderer}
                getNodeByIndex={getNodeByIndex}
                toggleChildExpand={toggleChildExpand}
                refreshPath={refreshPath}
                options={options}
                // showLineNumbers={showLineNumbers}
                size={childCount} />
        </div>)}
    </>;
};
