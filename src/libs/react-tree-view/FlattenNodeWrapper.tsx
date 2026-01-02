import type { WalkingAdapterBase, InferWalkingType, InferWalkingResult } from "../tree-core";



export type MetaParserBase<T extends WalkingAdapterBase> = (e: InferWalkingType<T>['Meta']) => any

export type FlattenNodeData<
    T extends WalkingAdapterBase,
    MetaParser extends MetaParserBase<T>
> = ReturnType<MetaParser> &
    InferWalkingResult<T> &
    {
        depth: number;
        path: string;
        paths: PropertyKey[];
        parents: number[];
        hasChild: boolean
    };

export class FlattenNodeWrapper<
    T extends WalkingAdapterBase,
    MetaParser extends MetaParserBase<T>
> {

    constructor(
        private metaParser: MetaParser,
        public state: InferWalkingResult<T>,
        public depth: number,
        public paths: InferWalkingType<T>['Key'][],
        public parentIndex: number[],
    ) { }

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

    public get childCount(): number {
        return this.state.childCount
    }

    public get hasChild() {
        return this.state.childCanExpand || this.childCount > 1
    }

    getData(): FlattenNodeData<T, MetaParser> {
        const state = this.state;
        return ({
            ...state,
            ...this.metaParser(state.meta!),
            depth: this.depth,
            hasChild: this.hasChild,
            path: this.path,
            paths: this.paths,
            parents: this.parentIndex,
        });
    }

}
