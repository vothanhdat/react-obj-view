import { createMemorizeMap } from "../utils/createMemorizeMap";
import { getEntriesOrignal } from "../V3/getEntries";
import { WalkingConfig } from "../V3/NodeData";
import { LinkingNode, LinkedDataNode, insertNodeBefore, insertListsBefore } from "./LinkedNode";
import { NodeData } from "./NodeData";
import { StateGetter, WalkingState, ProcessStack, DataEntry, Stage, SharingContext } from "./types";



function createRootNodeStack({ rootName, value, context }: {
    rootName: string;
    value: unknown;
    context: SharingContext
}) {
    const { config, getIterator } = context
    const startLink = new LinkingNode<NodeData>();
    const endLink = new LinkingNode<NodeData>();

    startLink.next = endLink;
    endLink.prev = startLink;

    const rootPaths = [rootName];

    const rootNodeStack = {
        data: { value, name: rootName, },
        iterator: getIterator(value, config),
        paths: rootPaths,
        depth: 0,
        stage: Stage.INIT,
        cursor: endLink,
        context,
    };
    return { rootNodeStack, startLink, endLink };
}

function initializeNode(
    current: ProcessStack<DataEntry>,
    stateGetter: StateGetter,
) {
    const { data, paths, cursor } = current;

    const state = stateGetter(...paths);

    current.state = state

    if (!state.inited || state.value !== data.value) {

        state.inited = true;
        state.value = data.value;

        const newLink = new LinkedDataNode(
            new NodeData(
                paths,
                data.value,
                true,
                false
            )
        );

        const newLinker = new LinkingNode<NodeData>();

        insertNodeBefore(cursor, newLink);
        insertNodeBefore(cursor, newLinker);

        state.start = newLink;
        state.end = newLinker;

        current.stage = Stage.ITERATE;
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
            state: undefined,
            context,
        });

    }

    if (done) {
        current.stage = Stage.FINAL;
    }

    return newStacks;
}


function finnalizeNode(
    current: ProcessStack<DataEntry>,
    context: SharingContext,
) {
    const { iterator, data, paths, stage, depth, cursor, state } = current;
}

export const walkingFactoryV4 = () => {

    const stateGetter: StateGetter = createMemorizeMap((...paths): WalkingState => ({
        inited: false,
        value: undefined,
    }));


    const getIterator = (value: any, config: any) => getEntriesOrignal(value, config)
        .map(({ key: name, value }) => ({ name, value }))


    const walking = (
        value: unknown,
        config: WalkingConfig,
        rootName = ""
    ) => {

        let stepCounter = 0;

        const stack: ProcessStack<DataEntry>[] = []

        const context: SharingContext = {
            getIterator,
            config
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
                    finnalizeNode(current, context);
                    stack.pop();
                    break;
                }
            }
            stepCounter++;
        }

        console.log({ stepCounter })

        return [startLink, endLink,] as [LinkingNode<NodeData>, LinkingNode<NodeData>]
    }

    return {
        walking
    }
}