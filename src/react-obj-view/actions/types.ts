import type { FlattenNodeData } from "../../libs/react-tree-view";
import { type ObjectWalkingAdater, parseWalkingMeta } from "../../object-tree";





export type CustomAction<T = {}> = {

    name: string;
    /**
     *
     * @param nodeData
     * @returns <T> null/false/undefined incase action not available and row will skip render this action
     */
    prepareAction(
        nodeData: FlattenNodeData<ObjectWalkingAdater, typeof parseWalkingMeta>
    ): T | null | false | undefined;

    dependency?(
        nodeData: FlattenNodeData<ObjectWalkingAdater, typeof parseWalkingMeta>
    ): any[];

    performAction(
        preparedAction: T,
        nodeData: FlattenNodeData<ObjectWalkingAdater, typeof parseWalkingMeta>
    ): Promise<void>;

    actionRender: string | React.FC<T>;
    actionRunRender: string | React.FC<T>;
    actionErrorRender?: string | React.FC<T & { error: any; }>;
    actionSuccessRender?: string | React.FC<T>;
    resetTimeout?: number;
};
