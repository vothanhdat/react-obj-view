import { createMemorizeMap } from "../utils/createMemorizeMap";
import { isRef } from "../utils/isRef";
import { getEntriesOrignal } from "../V3/getEntries";
import { WalkingConfig } from "../V3/NodeData";
import { CircularChecking } from "./CircularChecking";
import { LinkingNode, LinkedDataNode, insertNodeBefore, insertListsBefore } from "./LinkedNode";
import { NodeData } from "./NodeData";
import { StateGetter, WalkingState, ProcessStack, DataEntry, Stage, SharingContext, ChildStats } from "./types";

const DEFAULT_CHILD_STATS: ChildStats = {
    childMaxDepth: 0,
    childCanExpand: false,
}

function createRootNodeStack({ rootName, value, context }: {
    rootName: PropertyKey;
    value: unknown;
    context: SharingContext
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
        parentContext: { ...DEFAULT_CHILD_STATS },
    };
    return { rootNodeStack, startLink, endLink };
}

function initializeNode(
    current: ProcessStack<DataEntry>,
    stateGetter: StateGetter,
) {
    const { data, paths, cursor, context, depth, parentContext } = current;

    const { expandDepth } = context.config

    const state = stateGetter(...paths);

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

        //RESET CHILD STAT IN CASE UPDATE
        state.childStats = { ...DEFAULT_CHILD_STATS }

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
            current.stage = Stage.ITERATE;
        } else {
            current.stage = Stage.FINAL;
        }

    } else {

        if (!(state.end && state.start)) {
            throw new Error("Invalid State");
        }

        insertListsBefore(cursor, state.start!, state.end!);

        current.stage = Stage.FINAL;
    }
}

function iterateThroughNode(
    current: ProcessStack<DataEntry>,
    context: SharingContext
): ProcessStack<DataEntry>[] {
    const { config, getIterator } = context

    const newStacks: ProcessStack<DataEntry>[] = [];

    const { iterator, paths, depth, state } = current;

    let { value: nextChild, done } = iterator.next();

    if (nextChild) {

        newStacks.push({
            data: nextChild,
            iterator: getIterator(nextChild.value, config),
            paths: [...paths, nextChild.name],
            depth: depth + 1,
            stage: Stage.INIT,
            cursor: state!.end!,
            context,
            parentContext: state?.childStats!,
        });

    }

    if (done) {
        current.stage = Stage.FINAL;
    }

    return newStacks;
}


function finalizeNode(
    current: ProcessStack<DataEntry>,
    context: SharingContext,
) {
    const { iterator, data, paths, stage, depth, cursor, state, changed, parentContext, hasChild = false } = current;

    parentContext.childCanExpand ||= ((!state?.expanded!) && hasChild)
    parentContext.childCanExpand ||= state?.childStats!.childCanExpand!;

    parentContext.childMaxDepth = Math.max(
        parentContext.childMaxDepth,
        state!.childStats!.childMaxDepth + 1,
    )

    if (changed) {
        context.cirular.exitNode(data.value)
    }

}

export const walkingFactoryV4 = () => {

    const stateGetter: StateGetter = createMemorizeMap((...paths): WalkingState => ({
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
        } = createRootNodeStack({ rootName, value, context });

        stack.push(rootNodeStack)

        while (stack.length) {
            const current = stack.at(-1)!;
            switch (current.stage) {
                case Stage.INIT: {
                    initializeNode(current, stateGetter);
                    break;
                }
                case Stage.ITERATE: {
                    const newStacks = iterateThroughNode(current, context);
                    stack.push(...newStacks)
                    break;
                }
                case Stage.FINAL: {
                    finalizeNode(current, context);
                    stack.pop();
                    break;
                }
            }
            stepCounter++;
        }

        // console.log({ stepCounter })

        return [startLink, endLink,] as [LinkingNode<NodeData>, LinkingNode<NodeData>]
    }

    return {
        walking
    }
}