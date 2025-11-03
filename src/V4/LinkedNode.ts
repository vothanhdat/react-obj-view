

export interface LinkedNode<T> {
    obj: T | undefined;
    idx: number;
    prev: LinkedNode<T> | undefined;
    next: LinkedNode<T> | undefined;
}
let counter = 0;

export class LinkingNode<T> implements LinkedNode<T> {
    public obj: T | undefined = undefined;
    public idx = counter++;
    constructor(
        public prev: LinkedNode<T> | undefined = undefined,
        public next: LinkedNode<T> | undefined = undefined
    ) { }

}


export class LinkedDataNode<T> implements LinkedNode<T> {
    public idx = counter++;
    constructor(
        public obj: T | undefined = undefined,
        public prev: LinkedNode<T> | undefined = undefined,
        public next: LinkedNode<T> | undefined = undefined
    ) { }
}

export const insertNodeBefore = <T>(
    cursor: LinkedNode<T>,
    newNode: LinkedNode<T>
) => {
    const prev = cursor.prev;

    newNode.next = cursor;
    newNode.prev = prev;

    if (prev) {
        prev.next = newNode;
    }

    cursor.prev = newNode;
};

export const insertListsBefore = <T>(
    cursor: LinkedNode<T>,
    start: LinkedNode<T>,
    end: LinkedNode<T>
) => {
    const prev = cursor.prev;

    end.next = cursor;
    cursor.prev = end;

    start.prev = prev;
    if (prev) {
        prev.next = start;
    }
};


export const insertNodeAfter = <T>(
    cursor: LinkedNode<T>,
    newNode: LinkedNode<T>
) => {
    const next = cursor.next;

    newNode.prev = cursor;
    newNode.next = next;

    if (next) {
        next.prev = newNode;
    }

    cursor.next = newNode;
};

export const insertListsAfter = <T>(
    cursor: LinkedNode<T>,
    start: LinkedNode<T>,
    end: LinkedNode<T>
) => {
    const next = cursor.next;

    cursor.next = start;
    start.prev = cursor;

    end.next = next;
    if (next) {
        next.prev = end;
    }
};

export const linkListToArray = <T>([start, end]: [LinkedNode<T> | undefined, LinkedNode<T> | undefined]): T[] => {
    let result: T[] = [];
    let current: LinkedNode<T> | undefined = start?.prev ?? start;
    while (current && current != end) {
        current.obj && result.push(current.obj);
        current = current.next;
    }
    return result;
};
