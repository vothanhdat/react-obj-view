import { isRef } from "../utils/isRef";
import { getEntries } from "../V3/getEntries";
import { WalkingConfig } from "../V3/NodeData";
import { GetStateFn, StateFactory } from "../V5/StateFactory";
import { CircularChecking } from "./CircularChecking";
import { getObjectUniqueId } from "./getObjectUniqueId";
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
    value, context, paths,
    stateMgr: { state, getChild, cleanChild },
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
    stateMgr: ReturnType<GetStateFn<WalkingState>>,
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
        getChild,
        cleanChild,
    };
    return { rootNodeStack, startLink, endLink };
}

function initializeNode(
    current: ProcessStack<DataEntry> & { stage: Stage.INIT },
) {
    const { data, paths, cursor, context, depth, state, cleanChild, getChild } = current;

    const { expandDepth } = context.config

    const isCircular = context.cirular.checkCircular(data.value)

    const hasChild = isRef(data.value)

    const defaultEnable = hasChild
        && data.enumerable
        && !isCircular
        && depth < expandDepth

    const isExpanded = !isCircular && (state.userExpanded ?? defaultEnable)

    current.hasChild = hasChild
    current.isCircular = isCircular

    current.changed = (
        !state.inited
        || state.data?.value !== data.value
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
        || state.updateToken !== context.updateToken
    )


    if (current.changed) {

        !isCircular && context.cirular.enterNode(data.value)

        state.inited = true;
        state.data = data;
        state.expanded = isExpanded
        state.expandedDepth = expandDepth
        state.updateToken = context.updateToken;

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

    const { iterator, paths, depth, state, getChild, context } = current;

    const { config, getIterator } = context

    const iterationResult = iterator.next();

    if (iterationResult.done) {
        //@ts-ignore
        current.stage = Stage.FINAL;
        return undefined;
    }

    const nextChild = iterationResult.value;

    const stateMGr = getChild(nextChild.name)

    return {
        data: nextChild,
        iterator: getIterator(nextChild.value, config),
        paths: [...paths, nextChild.name],
        depth: depth + 1,
        stage: Stage.INIT,
        cursor: state.end!,
        context,
        parentContext: state.childStats!,
        state: stateMGr.state,
        getChild: stateMGr.getChild,
        cleanChild: stateMGr.cleanChild,
    };
}


function finalizeNode(
    current: ProcessStack<DataEntry> & { stage: Stage.FINAL },
) {
    const {
        data, state, changed, parentContext, hasChild = false,
        cleanChild, context,
        isCircular
    } = current;

    parentContext.childCanExpand ||= ((!state.expanded) && hasChild)
    parentContext.childCanExpand ||= state.childStats!.childCanExpand!;

    parentContext.childMaxDepth = Math.max(
        parentContext.childMaxDepth,
        state.childStats!.childMaxDepth + 1,
    )

    if (changed) {
        cleanChild?.();
        !isCircular && context.cirular.exitNode(data.value)
    }

}

export const walkingFactoryV4 = () => {

    const { stateFactory, getStateOnly } = StateFactory<WalkingState>(() => ({
        inited: false,
        expanded: false,
        expandedDepth: 0,
    }))

    const rootMapState: any = {}

    const stateRoot = stateFactory(rootMapState)
    const stateRead = getStateOnly(rootMapState)

    const getIterator = (value: any, config: any) => getEntries(value, config)
        .map(({ key: name, value, enumerable }) => ({ name, value, enumerable }))

    let walkingCounter = 0

    let getUpdateToken = (config: WalkingConfig) => {
        return (
            (config.nonEnumerable ? 0 : 1)
            | (getObjectUniqueId(config.resolver) << 1)
        )
    }

    const walking = (value: unknown, config: WalkingConfig, rootName = "") => {

        const context: SharingContext = {
            getIterator,
            config,
            cirular: new CircularChecking(),
            walkCounter: walkingCounter++,
            updateToken: getUpdateToken(config),
        }

        const { cleanChild } = stateRoot

        const {
            rootNodeStack,
            startLink,
            endLink,
        } = createRootNodeStack({
            paths: [rootName], value, context,
            stateMgr: stateRoot.getChild(rootName)
        });

        traverseNodeGraph(rootNodeStack);

        cleanChild();

        return [startLink, endLink,] as [LinkingNode<NodeData>, LinkingNode<NodeData>]
    }



    const childWalking = (paths: PropertyKey[], config: WalkingConfig) => {

        const context: SharingContext = {
            getIterator,
            config,
            cirular: new CircularChecking(),
            walkCounter: walkingCounter++,
            updateToken: getUpdateToken(config),
        }

        const stateMgr = paths.reduce(
            ({ getChild }, path) => getChild(path),
            stateRoot
        )
        console.log({ paths, stateMgr })

        const state = stateMgr.state
        const { enumerable, value } = state.data!


        const { rootNodeStack } = createRootNodeStack({
            paths, context, stateMgr, value, enumerable,
            linkedList: { start: state.start!, end: state.end! },
        });

        traverseNodeGraph(rootNodeStack);


    }



    const toggleExpand = (
        paths: PropertyKey[],
        config: WalkingConfig
    ) => {
        console.log(paths, rootMapState)
        const { state } = paths.reduce(
            ({ getChildOnly, state }, path) => {
                state.updateToken = 0;
                return getChildOnly(path)
            },
            stateRead
        ) ?? {} as never

        if (!state)
            throw new Error("State not found")

        const currentExpand = state.userExpanded ?? state.expanded

        state.userExpanded = !currentExpand;

        childWalking(paths, config)


    };


    return {
        walking,
        toggleExpand,
    }
}

function traverseNodeGraph(
    rootNodeStack: ProcessStack<DataEntry>,
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
                initializeNode(current);
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

