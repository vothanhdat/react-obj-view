

export class NodeData {

    constructor(
        public readonly paths: PropertyKey[],
        public readonly value: any,
        public readonly enumerable: boolean,
        public readonly isCircular: boolean,
        public readonly walkUID: number,
        public readonly expanded: boolean,
    ) { }

    public get path(): string {
        return this.paths
            .map(e => {
                try {
                    return String(e);
                } catch (error) {
                    return "";
                }
            }).join(".");
    }

    public get name(): PropertyKey | undefined {
        return this.paths.at(-1)!;
    }

    public get depth(): number {
        return this.paths.length;
    }
}
