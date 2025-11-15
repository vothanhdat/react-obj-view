import { ObjectWalkingResult, parseWalkingMeta } from ".";


export type NodeResultData = ObjectWalkingResult & {
    depth: number; path: string; paths: PropertyKey[];
} & ReturnType<typeof parseWalkingMeta>;

export class NodeResult {

    constructor(
        public state: ObjectWalkingResult,
        public depth: number,
        public paths: PropertyKey[],
        public parentIndex: number[]
    ) {
        Object.assign(this, state);
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
        const state = this.state;
        return ({
            ...state,
            ...parseWalkingMeta(state.meta!),
            depth: this.depth,
            path: this.path,
            paths: this.paths,
        });
    }

}
