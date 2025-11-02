

export class NodeData {

    constructor(
        public readonly paths: PropertyKey[],
        public readonly value: any,
        public readonly enumerable: boolean,
        public readonly isCircular: boolean
    ) { }

    get path(): string {
        return this.paths
            .map(e => {
                try {
                    return String(e);
                } catch (error) {
                    return "";
                }
            }).join(".");
    }

    get name(): PropertyKey | undefined {
        return this.paths.at(-1)!;
    }

    get depth(): number {
        return this.paths.length;
    }
}
