import { PromiseWrapper } from "./ResolvePromiseWrapper";
import { Entry, JSONViewCtx, ResolverFn } from "./types";


const promiseResolver: ResolverFn = (promise: Promise<any>, entriesIterator: Entry[], isPreview: boolean) => {

    let pendingSym = Symbol("Pending");

    let result: Promise<{ status: any; result?: any; reason?: any; }> = Promise
        .race([promise, pendingSym])
        .then(e => e == pendingSym ? { status: "pending" } : { status: "resolved", result: e })
        .catch(e => ({ status: "rejected", reason: e }));

    const entries = [...entriesIterator];

    entries.push({
        key: isPreview ? "status" : "[[PromiseState]]",
        value: new PromiseWrapper(result.then(e => e.status)),
        enumerable: false,
    });
    entries.push({
        key: isPreview ? "result" : "[[PromiseResult]]",
        value: new PromiseWrapper(
            result.then(e => e.status == "resolved" ? e.result
                : e.status == "rejected" ? e.reason
                    : undefined)
        ),
        enumerable: false,
    });

    return entries;
};

const errorResolver: ResolverFn = (error: Error, entriesIterator: Entry[], isPreview: boolean) => {

    const entries = entriesIterator.filter(entry => entry.key != "message");

    if (error instanceof Error) {
        if (error.name) {
            entries.push({
                key: "name",
                value: error.name,
                enumerable: false,
            });
        }
        entries.push({
            key: isPreview ? "msg" : "message",
            value: error.message,
            enumerable: false,
        });
        entries.push({
            key: "stack",
            value: error.stack,
            enumerable: false,
        });
        if (error.cause) {
            entries.push({
                key: "cause",
                value: error.cause,
                enumerable: false,
            });
        }
    }

    return entries;
};


export const DEFAULT_RESOLVER: JSONViewCtx['resolver'] = new Map<any, ResolverFn>([
    [Promise, promiseResolver],
    [Error, errorResolver],
]);

