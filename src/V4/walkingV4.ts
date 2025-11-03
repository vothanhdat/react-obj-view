// import { createMemorizeMap } from "../utils/createMemorizeMap";
import { isRef } from "../utils/isRef";
import { memorizeMapWithWithClean } from "../utils/memorizeMapWithWithClean";
import { getEntriesOrignal } from "../V3/getEntries";
import { WalkingConfig } from "../V3/NodeData";
import { CircularChecking } from "./CircularChecking";
import { LinkingNode, LinkedDataNode, insertNodeBefore, insertListsBefore } from "./LinkedNode";
import { NodeData } from "./NodeData";
import { WalkingState, ProcessStack, DataEntry, Stage, SharingContext, ChildStats, StateGetterV2 } from "./types";

const getDefaultChildStats = (): ChildStats => ({
    childMaxDepth: 0,
    childCanExpand: false,
})

function createRootNodeStack({ rootName, value, context, stateGetter }: {
    rootName: PropertyKey;
    value: unknown;
    context: SharingContext,
    stateGetter: StateGetterV2,

}) {
    const { config, getIterator } = context
    const startLink = new LinkingNode<NodeData>();
    const endLink = new LinkingNode<NodeData>();

    startLink.next = endLink;
    endLink.prev = startLink;

    const rootPaths = [rootName];

    const rootNodeStack: ProcessStack<DataEntry> = {
        data: { value, name: rootName, },
        iterator: getIterator(value, config),
        paths: rootPaths,
        depth: 0,
        stage: Stage.INIT,
        cursor: endLink,
        context,
        parentContext: getDefaultChildStats(),
        state: stateGetter([]).get(rootName)
    };
    return { rootNodeStack, startLink, endLink };
}

function initializeNode(
    current: ProcessStack<DataEntry> & { stage: Stage.INIT },
    stateGetter: StateGetterV2,
) {
    const { data, paths, cursor, context, depth, state } = current;

    const { expandDepth } = context.config

    const isCircular = context.cirular.checkCircucal(data.value)

    const hasChild = isRef(data.value)

    const defaultEnable = hasChild
        && !isCircular
        && depth < expandDepth

    const isExpanded = defaultEnable

    current.state = state
    current.hasChild = hasChild


    current.changed = (
        !state.inited
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

        context.cirular.enterNode(data.value)

        state.inited = true;
        state.value = data.value;
        state.expanded = isExpanded
        state.expandedDepth = expandDepth

        const { get: stateGet, clean: stateClean } = stateGetter(...paths)

        current.stateGet = stateGet
        current.stateClean = stateClean
        

        //RESET CHILD STAT IN CASE UPDATE
        state.childStats = getDefaultChildStats()

        const newLink = new LinkedDataNode(
            new NodeData(
                paths,
                data.value,
                true,
                isCircular,
                context.walkCounter,
                isExpanded,
            )
        );

        const newLinker = new LinkingNode<NodeData>();

        insertNodeBefore(cursor, newLink);
        insertNodeBefore(cursor, newLinker);

        state.start = newLink;
        state.end = newLinker;


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
    context: SharingContext
): ProcessStack<DataEntry>[] {
    const { config, getIterator } = context

    const newStacks: ProcessStack<DataEntry>[] = [];

    const { iterator, paths, depth, state, stateGet } = current;

    let { value: nextChild, done } = iterator.next();

    if (nextChild) {

        newStacks.push({
            data: nextChild,
            iterator: getIterator(nextChild.value, config),
            paths: [...paths, nextChild.name],
            depth: depth + 1,
            stage: Stage.INIT,
            cursor: state.end!,
            context,
            parentContext: state.childStats!,
            state: stateGet(nextChild.name),
        });
    }

    if (done) {
        //@ts-ignore
        current.stage = Stage.FINAL;
    }

    return newStacks;
}


function finalizeNode(
    current: ProcessStack<DataEntry> & { stage: Stage.FINAL },
    context: SharingContext,
) {
    const {
        data, state, changed, parentContext, hasChild = false,
        stateClean
    } = current;

    parentContext.childCanExpand ||= (!state?.expanded && hasChild)
    parentContext.childCanExpand ||= state?.childStats!.childCanExpand!;

    parentContext.childMaxDepth = Math.max(
        parentContext.childMaxDepth,
        state!.childStats!.childMaxDepth + 1,
    )

    if (changed) {
        stateClean?.();
        context.cirular.exitNode(data.value)
    }

}

export const walkingFactoryV4 = () => {

    const stateGetter: StateGetterV2 = memorizeMapWithWithClean((...paths): WalkingState => ({
        inited: false,
        value: undefined,
        expanded: false,
        expandedDepth: 0,
    }));


    const getIterator = (value: any, config: any) => getEntriesOrignal(value, config)
        .map(({ key: name, value }) => ({ name, value }))

    let walkingCounter = 0

    const walking = (
        value: unknown,
        config: WalkingConfig,
        rootName = ""
    ) => {

        let stepCounter = 0;

        const stack: ProcessStack<DataEntry>[] = []

        const context: SharingContext = {
            getIterator,
            config,
            cirular: new CircularChecking(),
            walkCounter: walkingCounter++,
        }

        const {
            rootNodeStack,
            startLink,
            endLink,
        } = createRootNodeStack({ rootName, value, context, stateGetter });

        stack.push(rootNodeStack)

        while (stack.length) {
            const current = stack.at(-1)!;
            switch (current.stage) {
                case Stage.INIT: {
                    //@ts-ignore //Typescript Doesn't detech INIT branch
                    initializeNode(current, stateGetter);
                    break;
                }
                case Stage.ITERATE: {
                    //@ts-ignore //Typescript Doesn't detech ITERATE branch
                    const newStacks = iterateThroughNode(current, context);
                    stack.push(...newStacks)
                    break;
                }
                case Stage.FINAL: {
                    //@ts-ignore //Typescript Doesn't detech FINAL branch
                    finalizeNode(current, context);
                    stack.pop();
                    break;
                }
            }
            stepCounter++;
        }

        console.log("stepCounter %s", stepCounter)

        return [startLink, endLink,] as [LinkingNode<NodeData>, LinkingNode<NodeData>]
    }

    return {
        walking
    }
}