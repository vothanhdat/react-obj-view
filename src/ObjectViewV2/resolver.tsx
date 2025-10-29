import { PromiseWrapper } from "./ResolvePromiseWrapper";
import { Entry, JSONViewCtx, ResolverFn } from "./types";


const promiseResolver: ResolverFn = function* (promise: Promise<any>, entriesIterator: Generator<Entry, any, any>, isPreview: boolean) {

    let pendingSym = Symbol("Pending");

    let result: Promise<{ status: any; result?: any; reason?: any; }> = Promise
        .race([promise, pendingSym])
        .then(e => e == pendingSym ? { status: "pending" } : { status: "resolved", result: e })
        .catch(e => ({ status: "rejected", reason: e }));

    for (let entry of entriesIterator) {
        yield entry;
    }

    yield {
        name: isPreview ? "status" : "[[PromiseState]]",
        data: new PromiseWrapper(result.then(e => e.status)),
        isNonenumerable: false,
    };
    yield {
        name: isPreview ? "result" : "[[PromiseResult]]",
        data: new PromiseWrapper(
            result.then(e => e.status == "resolved" ? e.result
                : e.status == "rejected" ? e.reason
                    : undefined)
        ),
        isNonenumerable: false,
    };
};

const errorResolver: ResolverFn = function* (error: Error, entriesIterator: Generator<Entry, any, any>, isPreview: boolean) {


    for (let entry of entriesIterator) {
        if (entry.name != "message") {
            yield entry;
        }
    }

    if (error instanceof Error) {
        error.name && (yield {
            name: "name",
            data: error.name,
            isNonenumerable: false,
        })
        yield {
            name: isPreview ? "msg" : "message",
            data: error.message,
            isNonenumerable: false,
        };
        yield {
            name: "stack",
            data: error.stack,
            isNonenumerable: false,
        };
        error.cause && (yield {
            name: "cause",
            data: error.cause,
            isNonenumerable: false,
        })
    }

};


export const DEFAULT_RESOLVER: JSONViewCtx['resolver'] = new Map<any, ResolverFn>([
    [Promise, promiseResolver],
    [Error, errorResolver],
]);


