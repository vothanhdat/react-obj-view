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
        key: isPreview ? "status" : "[[PromiseState]]",
        value: new PromiseWrapper(result.then(e => e.status)),
        enumerable: false,
    };
    yield {
        key: isPreview ? "result" : "[[PromiseResult]]",
        value: new PromiseWrapper(
            result.then(e => e.status == "resolved" ? e.result
                : e.status == "rejected" ? e.reason
                    : undefined)
        ),
        enumerable: false,
    };
};

const errorResolver: ResolverFn = function* (error: Error, entriesIterator: Generator<Entry, any, any>, isPreview: boolean) {


    for (let entry of entriesIterator) {
        if (entry.key != "message") {
            yield entry;
        }
    }

    if (error instanceof Error) {
        error.name && (yield {
            key: "name",
            value: error.name,
            enumerable: false,
        })
        yield {
            key: isPreview ? "msg" : "message",
            value: error.message,
            enumerable: false,
        };
        yield {
            key: "stack",
            value: error.stack,
            enumerable: false,
        };
        error.cause && (yield {
            key: "cause",
            value: error.cause,
            enumerable: false,
        })
    }

};


export const DEFAULT_RESOLVER: JSONViewCtx['resolver'] = new Map<any, ResolverFn>([
    [Promise, promiseResolver],
    [Error, errorResolver],
]);


