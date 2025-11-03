import { isRef } from "../utils/isRef";

export class CircularChecking {

    checkMap = new WeakSet<any>();
    checkStack: any[] = [];

    checkCircular(value: unknown): boolean {
        if (isRef(value)) {
            return this.checkMap.has(value);;
        } {
            return false;
        }
    }

    enterNode(value: unknown) {
        if (isRef(value)) {
            if (this.checkMap.has(value))
                throw new Error("Node already entered");
            this.checkMap.add(value);
            this.checkStack.push(value);
        } {
            return false;
        }
    }

    exitNode(value: unknown) {
        if (isRef(value)) {
            if (this.checkStack.at(-1) == value) {
                this.checkMap.delete(value);
                this.checkStack.pop();
            } else {
                throw new Error("Exit wrong node");
            }
        }
    }
}
