import type { FlattenNodeData } from "../../libs/react-tree-view";
import { type ObjectWalkingAdapter, parseWalkingMeta } from "../../object-tree";




export type ActionWrapperProps<T = {}> = {
    state: T,
    isLoading: boolean, isSuccess: boolean, isError: boolean,
    children: any,
    handleAction?: () => void
}

export type CustomAction<T = {}> = {

    name: string;
    /**
     *
     * @param nodeData
     * @returns <T> null/false/undefined incase action not available and row will skip render this action
     */
    prepareAction(
        nodeData: FlattenNodeData<ObjectWalkingAdapter, typeof parseWalkingMeta>
    ): T | null | false | undefined;

    dependency?(
        nodeData: FlattenNodeData<ObjectWalkingAdapter, typeof parseWalkingMeta>
    ): any[];

    performAction(
        preparedAction: T,
        nodeData: FlattenNodeData<ObjectWalkingAdapter, typeof parseWalkingMeta>
    ): Promise<void>;

    buttonWrapper?: React.FC<ActionWrapperProps<T>>;
    actionRender: string | React.FC<T>;
    actionRunRender: string | React.FC<T>;
    actionErrorRender?: string | React.FC<T & { error: any; }>;
    actionSuccessRender?: string | React.FC<T>;
    resetTimeout?: number;
};
