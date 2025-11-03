// import { createMemorizeMap } from "../utils/createMemorizeMap";
import { isRef } from "../utils/isRef";
import { memorizeMapWithWithClean } from "../utils/memorizeMapWithWithClean";
import { getEntriesOrignal } from "../V3/getEntries";
import { WalkingConfig } from "../V3/NodeData";
import { CircularChecking } from "./CircularChecking";
import { LinkingNode, LinkedDataNode, insertNodeBefore, insertListsBefore, linkListToArray } from "./LinkedNode";
import { NodeData } from "./NodeData";
import { WalkingState, ProcessStack, DataEntry, Stage, SharingContext, ChildStats, StateGetterV2, LinkedList } from "./types";

const createChildStats = (): ChildStats => ({
    childMaxDepth: 0,
    childCanExpand: false,
});

const resetChildStats = (stats?: ChildStats): ChildStats => {
    if (!stats) {
        return createChildStats();
    }
    stats.childMaxDepth = 0;
    stats.childCanExpand = false;
    return stats;
};


function createRootNodeStack({
    value, context, paths, state,
    enumerable = true,
    linkedList: {
        start: startLink = new LinkingNode<NodeData>(),
        end: endLink = new LinkingNode<NodeData>(),
    } = {} as never,
}: {
    value: unknown;
    enumerable?: boolean,
    context: SharingContext,
    paths: PropertyKey[],
    state: WalkingState,
    linkedList?: LinkedList<NodeData>
}) {
    if (!(paths.length >= 1)) {
        throw new Error("Require paths with atleast one element") //TODO error message
    }

    const { config, getIterator } = context

    startLink.next = endLink;
    endLink.prev = startLink;


    const rootNodeStack: ProcessStack<DataEntry> = {
        data: { value, name: paths.at(-1)!, enumerable },
        iterator: getIterator(value, config),
        paths,
        depth: 0,
        stage: Stage.INIT,
        cursor: endLink,
        context,
        parentContext: createChildStats(),
        state,
    };
    return { rootNodeStack, startLink, endLink };
}

function initializeNode(
    current: ProcessStack<DataEntry> & { stage: Stage.INIT },
    stateGetter: (...params: any[]) => { get(key: any): any; clean(): void; },
) {
    const { data, paths, cursor, context, depth, state } = current;

    const { expandDepth } = context.config

    const isCircular = context.cirular.checkCircular(data.value)

    const hasChild = isRef(data.value)

    const defaultEnable = hasChild
        && data.enumerable
        && !isCircular
        && depth < expandDepth

    const isExpanded = !isCircular && (state.userExpanded ?? defaultEnable)

    current.state = state
    current.hasChild = hasChild
    current.isCircular = isCircular

    current.changed = (
        !state.inited
        || state.forceUpdate
        || state.value !== data.value
        || state.expanded !== isExpanded
        || (
            isExpanded
            && state.expandedDepth < expandDepth
            && state.childStats?.childCanExpand
        ) || (
            isExpanded
            && state.childStats?.childMaxDepth! >= expandDepth
            && state.expandedDepth > expandDepth
        )
    )

    if (current.changed) {

        !isCircular && context.cirular.enterNode(data.value)

        state.inited = true;
        state.forceUpdate = false;
        state.value = data.value;
        state.enumerable = data.enumerable;
        state.expanded = isExpanded
        state.expandedDepth = expandDepth

        const { get: stateGet, clean: stateClean } = stateGetter(...paths)

        current.stateGet = stateGet
        current.stateClean = stateClean


        //RESET CHILD STAT IN CASE UPDATE
        state.childStats = resetChildStats(state.childStats)


        const newLink = new LinkedDataNode(
            new NodeData(
                paths,
                data.value,
                data.enumerable,
                isCircular,
                context.walkCounter,
                isExpanded,
            )
        );

        const startLinker = new LinkingNode<NodeData>();

        const endLinker = new LinkingNode<NodeData>();

        insertNodeBefore(cursor, startLinker);
        insertNodeBefore(cursor, newLink);
        insertNodeBefore(cursor, endLinker);

        state.start = startLinker
        state.end = endLinker;


        if (isExpanded) {
            //@ts-ignore
            current.stage = Stage.ITERATE;
        } else {
            //@ts-ignore
            current.stage = Stage.FINAL;
        }

    } else {

        if (!(state.end && state.start)) {
            throw new Error("Invalid State");
        }

        insertListsBefore(cursor, state.start!, state.end!);

        //@ts-ignore
        current.stage = Stage.FINAL;
    }
}

function iterateThroughNode(
    current: ProcessStack<DataEntry> & { stage: Stage.ITERATE },
): ProcessStack<DataEntry> | undefined {

    const { iterator, paths, depth, state, stateGet, context } = current;

    const { config, getIterator } = context

    const iterationResult = iterator.next();

    if (iterationResult.done) {
        //@ts-ignore
        current.stage = Stage.FINAL;
        return undefined;
    }

    const nextChild = iterationResult.value;

    return {
        data: nextChild,
        iterator: getIterator(nextChild.value, config),
        paths: [...paths, nextChild.name],
        depth: depth + 1,
        stage: Stage.INIT,
        cursor: state.end!,
        context,
        parentContext: state.childStats!,
        state: stateGet(nextChild.name),
    };
}


function finalizeNode(
    current: ProcessStack<DataEntry> & { stage: Stage.FINAL },
) {
    const {
        data, state, changed, parentContext, hasChild = false,
        stateClean, context,
        isCircular
    } = current;

    parentContext.childCanExpand ||= ((!state.expanded) && hasChild)
    parentContext.childCanExpand ||= state.childStats!.childCanExpand!;

    parentContext.childMaxDepth = Math.max(
        parentContext.childMaxDepth,
        state.childStats!.childMaxDepth + 1,
    )

    if (changed) {
        stateClean?.();
        !isCircular && context.cirular.exitNode(data.value)
    }

}

export const walkingFactoryV4 = () => {

    const { stateFactory, getState }: StateGetterV2 = memorizeMapWithWithClean((...paths): WalkingState => ({
        inited: false,
        value: undefined,
        enumerable: false,
        expanded: false,
        expandedDepth: 0,
    }));


    const getIterator = (value: any, config: any) => getEntriesOrignal(value, config)
        .map(({ key: name, value, enumerable }) => ({ name, value, enumerable }))

    let walkingCounter = 0

    const walking = (value: unknown, config: WalkingConfig, rootName = "") => {

        const context: SharingContext = {
            getIterator,
            config,
            cirular: new CircularChecking(),
            walkCounter: walkingCounter++,
        }

        const { get: stateGet, clean: stateClean } = stateFactory()

        const state = stateGet(rootName)

        const {
            rootNodeStack,
            startLink,
            endLink,
        } = createRootNodeStack({ paths: [rootName], value, context, state });

        traverseNodeGraph(rootNodeStack, stateFactory);

        stateClean();

        return [startLink, endLink,] as [LinkingNode<NodeData>, LinkingNode<NodeData>]
    }



    const childWalking = (paths: PropertyKey[], config: WalkingConfig) => {

        const context: SharingContext = {
            getIterator,
            config,
            cirular: new CircularChecking(),
            walkCounter: walkingCounter++,
        }

        const state: WalkingState = getState(...paths)

        const value = state.value
        const enumerable = state.enumerable

        const { rootNodeStack } = createRootNodeStack({
            paths, context, state, value, enumerable,
            linkedList: { start: state.start!, end: state.end! },
        });

        traverseNodeGraph(rootNodeStack, stateFactory);


    }



    const toggleExpand = (
        paths: PropertyKey[],
        config: WalkingConfig
    ) => {

        for (let i = 0; i < paths.length; i++) {
            let state: WalkingState = getState(...paths.slice(0, i + 1))

            if (!state)
                throw new Error("State not found")

            state.forceUpdate = true;

            if (i == (paths.length - 1)) {

                const currentExpand = state.userExpanded ?? state.expanded

                state.userExpanded = !currentExpand;


                childWalking(paths, config)

                break;
            }
        }

    };


    return {
        walking,
        toggleExpand,
    }
}

function traverseNodeGraph(
    rootNodeStack: ProcessStack<DataEntry>,
    stateGetter: (...params: any[]) => { get(key: any): any; clean(): void; }
) {

    const stack: ProcessStack<DataEntry>[] = [
        rootNodeStack
    ];

    let stepCounter = 0;

    while (stack.length) {
        const current = stack[stack.length - 1]!;
        switch (current.stage) {
            case Stage.INIT: {
                //@ts-ignore //Typescript Doesn't detech INIT branch
                initializeNode(current, stateGetter);
                break;
            }
            case Stage.ITERATE: {
                //@ts-ignore //Typescript Doesn't detech ITERATE branch
                const nextStack = iterateThroughNode(current);
                if (nextStack) {
                    stack.push(nextStack);
                }
                break;
            }
            case Stage.FINAL: {
                //@ts-ignore //Typescript Doesn't detech FINAL branch
                finalizeNode(current);
                stack.pop();
                break;
            }
        }
        stepCounter++;
    }

    console.log("stepCounter %s", stepCounter)
}

