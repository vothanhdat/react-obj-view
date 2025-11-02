import { LinkedNode } from "./LinkedNode";

const debugLink = (link: LinkedNode<any>) => {
    let current: LinkedNode<any> | undefined = link;
    let max = 20;
    let ids: any[] = [];
    while (current && max-- > 0) {
        ids.push(current.obj ? `(${current.idx})` : current.idx);
        current = current.next;
    }
    return ids.join(" > ");
};
