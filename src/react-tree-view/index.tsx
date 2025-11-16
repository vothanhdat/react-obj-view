import React, { ReactNode, useCallback, useMemo, useRef, useState } from "react"
import { InferNodeResult, InferWalkingInstance, InferWalkingResult, InferWalkingType, WalkingAdaperBase } from "../tree-core"
import { MetaParserBase, FlattenNodeWrapper, FlattenNodeData } from "./NodeResult";
import { VirtualScroller, VirtualScrollerRenderProps } from "../virtual-scroller/VirtualScroller";
import { useRednerIndexesWithSticky } from "./useRednerIndexesWithSticky";
import { useWrapper } from "../hooks/useWrapper";


export type ReactTreeHookParams<
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>
> = {
    factory: () => InferWalkingInstance<T>,
    config: InferWalkingType<T>['Config'],
    expandDepth: number,
    value: InferWalkingType<T>['Value'],
    name: InferWalkingType<T>['Key'],
    metaParser: MetaParser,
}

export type ReactTreeRowRenderProps<
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>,
    RenderOptions = {},
> = {
    renderIndex: number,
    nodeDataWrapper: () => FlattenNodeData<T, MetaParser>,
    valueWrapper: () => InferWalkingType<T>['Value'],
    options: RenderOptions,
    actions: {
        refreshPath: () => void,
        toggleChildExpand: () => void
    }
}


export type ReactTreeViewProps<
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>,
    RenderOptions,
> = ReturnType<typeof useReactTree<T, MetaParser>> & {
    lineHeight: number,
    options: RenderOptions,
    containerDivProps?: React.HTMLAttributes<HTMLDivElement>,
    rowDivProps?: React.HTMLAttributes<HTMLDivElement>,
    RowRenderer: React.FC<ReactTreeRowRenderProps<T, MetaParser, RenderOptions>>,
}

type ReactTreeViewVitualRenderProps<
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>,
    RenderOptions,
> = VirtualScrollerRenderProps<Omit<
    ReactTreeViewProps<T, MetaParser, RenderOptions>,
    'containerDivProps'
>>



export const useReactTree = <
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>
>({
    factory,
    config,
    expandDepth,
    metaParser,
    value, name,
}: ReactTreeHookParams<T, MetaParser>) => {

    const [reload, setReload] = useState(0);

    const ref = useRef({
        factory: undefined as any as (() => InferWalkingInstance<T>),
        instance: undefined as any as InferWalkingInstance<T>,
    })

    if (ref.current.factory != factory) {
        ref.current.factory = factory
        ref.current.instance = factory();
    }

    const walkingResult = useMemo(
        () => ({
            ...ref.current.instance.walking(
                value, name, config, expandDepth
            )
        }),
        [ref.current.instance, value, name, config, expandDepth, reload]
    )

    const refreshPath = useCallback(
        ({ paths }: { paths: InferWalkingType<T>['Key'][] }) => {
            ref.current.instance.refreshPath(paths);
            setReload(e => e + 1);
        },
        [ref]
    )

    const toggleChildExpand = useCallback(
        ({ paths }: { paths: InferWalkingType<T>['Key'][] }) => {
            ref.current.instance.toggleExpand(paths);
            setReload(e => e + 1);
        },
        [ref]
    );

    const getNodeByIndex = useMemo(
        () => {
            let m = new Map<any, FlattenNodeWrapper<T, MetaParser>>();

            return (index: number) => {
                let data = m.get(index);

                if (!data) {
                    //TODO remove any
                    let state: InferNodeResult<T> = ref.current.instance.getNode(index) as any
                    data = new FlattenNodeWrapper(
                        metaParser,
                        //TODO remove as InferWalkingResult<T>
                        state.state as InferWalkingResult<T>,
                        state.depth,
                        state.paths,
                        state.parentIndex
                    )

                    m.set(index, data);
                }

                return data;
            };
        },
        [ref.current.instance, walkingResult, reload]
    );

    const computeItemKey = useCallback(
        (index: number) => index < walkingResult.childCount ? getNodeByIndex(index).path : "",
        [getNodeByIndex, walkingResult.childCount]
    )


    return {
        refreshPath,
        toggleChildExpand,
        getNodeByIndex,
        computeItemKey,
        childCount: walkingResult.childCount,

    }
}


export type StickyInfo = {
    index: number;
    isStick: false;
    position?: number;
    isLastStick?: boolean;
} | {
    index: number;
    isStick: true;
    position: number;
    isLastStick?: boolean;
};


export const VirtualScrollRender: <
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>,
    RenderOptions,
>(
    props: ReactTreeViewVitualRenderProps<T, MetaParser, RenderOptions>
) => ReactNode = (props) => {
    const {
        start, end, offset, childCount,
        RowRenderer,
        computeItemKey,
        getNodeByIndex,
        lineHeight,
        refreshPath,
        toggleChildExpand,
        options,
        rowDivProps,
        ...rest
    } = props


    const renderIndexes = useRednerIndexesWithSticky({
        start, end,
        lineHeight, childCount,
        getNodeByIndex,
        stickyHeader: true,
    })

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
                size={childCount}
            />
        </div>)}
    </>
}

export const VirtualScrollRowRender: <
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>,
    RenderOptions,
>(props: {
    index: number;
    size: number;
    getNodeByIndex: (index: number) => FlattenNodeWrapper<T, MetaParser>;
    toggleChildExpand: ({ paths }: { paths: InferWalkingType<T>['Key'][] }) => void,
    refreshPath: ({ paths }: { paths: InferWalkingType<T>['Key'][] }) => void,
    options: RenderOptions;
    RowRender: React.FC<ReactTreeRowRenderProps<T, MetaParser, RenderOptions>>
}) => ReactNode = ({
    RowRender,
    index, options, size,
    getNodeByIndex, toggleChildExpand, refreshPath
}) => {

        const flattenNodeWrapper = useMemo(
            () => index < size ? getNodeByIndex(index) : undefined,
            [index < size, index, getNodeByIndex]
        )

        const flattenNodeData = useMemo(
            () => flattenNodeWrapper?.getData()!,
            [flattenNodeWrapper?.state?.updateStamp]
        )

        const nodeDataWrapper = useWrapper(flattenNodeData!);

        const valueWrapper = useWrapper(flattenNodeData?.value);

        const actions = useMemo(
            () => ({
                refreshPath: toggleChildExpand.bind(undefined, { paths: flattenNodeData?.paths }),
                toggleChildExpand: refreshPath.bind(undefined, { paths: flattenNodeData?.paths }),
            }),
            [
                flattenNodeData?.paths,
                toggleChildExpand,
                refreshPath,
            ]
        )

        return flattenNodeData && <RowRender
            nodeDataWrapper={nodeDataWrapper}
            valueWrapper={valueWrapper}
            options={options}
            renderIndex={index}
            actions={actions}
        />;
    }

export const ReactTreeView = <
    T extends WalkingAdaperBase,
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