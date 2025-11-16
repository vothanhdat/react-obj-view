import type { WalkingAdaperBase, InferWalkingType, InferWalkingResult } from "../tree-core";



export type MetaParserBase<T extends WalkingAdaperBase> = (e: InferWalkingType<T>['Meta']) => any

export type FlattenNodeData<
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>
> = ReturnType<MetaParser> &
    InferWalkingResult<T> &
    {
        depth: number;
        path: string;
        paths: PropertyKey[];
    };

export class FlattenNodeWrapper<
    T extends WalkingAdaperBase,
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

    getData(): FlattenNodeData<T, MetaParser> {
        const state = this.state;
        return ({
            ...state,
            ...this.metaParser(state.meta!),
            depth: this.depth,
            path: this.path,
            paths: this.paths,
        });
    }

}
