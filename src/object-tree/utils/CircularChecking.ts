import { isRef } from "./isRef";

export class CircularChecking {

    checkMap = new WeakSet<any>();
    checkStack: any[] = new Array(200).fill(0);
    stack = 0

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
            this.checkStack[++this.stack] = value
        } {
            return false;
        }
    }

    exitNode(value: unknown) {
        if (isRef(value)) {
            if (this.checkStack[this.stack] === value) {
                this.checkMap.delete(value);
                this.stack--;
            } else {
                throw new Error("Exit wrong node");
            }
        }
    }
}
