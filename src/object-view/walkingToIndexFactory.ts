


export type WalkingResult = {
    value: unknown,
    childOffsets?: number[],
    key: PropertyKey,
    childKeys?: PropertyKey[],
    childCount: number,
    enumerable: boolean,
    childDepth: number,
    expandedDepth: number,
    expanded: boolean,
    isCircular: boolean,
    childCanExpand: boolean,
    userExpand?: boolean,
    updateToken?: number,
    updateStamp: number,
}

export type NodeResultData = WalkingResult & { depth: number, path: string, paths: PropertyKey[] }

export class NodeResult {

    constructor(
        public state: WalkingResult,
        public depth: number,
        public paths: PropertyKey[],
        public parentIndex: number[],
    ) {
        Object.assign(this, state)
    }

    public get path(): string {
        return this.paths
            .map(e => {
                try {
                    return String(e);
                } catch (error) {
                    return "";
                }
            }).join("/");
    }

    getData(): NodeResultData {
        const state = this.state
        return ({
            ...state,
            depth: this.depth,
            path: this.path,
            paths: this.paths,
        })
    }

}


