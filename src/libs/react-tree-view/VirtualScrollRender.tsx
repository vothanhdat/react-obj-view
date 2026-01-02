import React, { ReactNode } from "react";
import { VirtualScrollRowRender } from "./VirtualScrollRowRender";
import { type WalkingAdapterBase } from "../tree-core";
import { MetaParserBase } from "./FlattenNodeWrapper";
import { ReactTreeViewVitualRenderProps } from "./types";
import { useRenderIndexesWithSticky } from "./useRenderIndexesWithSticky";



export const VirtualScrollRender: <
    T extends WalkingAdapterBase,
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
        overscan,
        ...rest
    } = props;


    const renderIndexes = useRenderIndexesWithSticky({
        start, end, overscan,
        lineHeight, childCount,
        getNodeByIndex,
        stickyHeader: stickyPathHeaders,
    });

    const lineNumberChars = Math.max(2, String(renderIndexes.at(-1)?.index ?? 0).length)

    return <>
        {renderIndexes.map(({ isStick, index, isLastStick, position }) => <div
            {...rowDivProps}
            key={computeItemKey(index) + (isStick ? "-stick" : "")}
            style={isStick ? {
                position: "sticky",
                top: `${position * lineHeight - offset}px`,
                height: `${lineHeight}px`,
                lineHeight: `${lineHeight}px`,
                zIndex: Math.floor(100 - position),
                backgroundColor: "var(--bg-color)",
                borderBottom: isLastStick
                    ? "solid 1px color-mix(in srgb, var(--color) 30%, transparent)"
                    : "",
                ...{ "--current-index": String(index), }
            } : {
                position: "absolute",
                top: `${index * lineHeight}px`,
                height: `${lineHeight}px`,
                lineHeight: `${lineHeight}px`,
                ...{ "--current-index": String(index), }
            }}
        >
            {showLineNumbers && <span className="line-number" style={{ flexShrink: 0 }}>
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
