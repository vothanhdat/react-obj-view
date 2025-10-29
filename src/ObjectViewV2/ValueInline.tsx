import React from "react";
import { AllChildsPreview } from "./AllChildsPreview";
import { joinClasses } from "./utils/joinClasses";
import { JSONViewCtx } from "./types";
import { PromiseWrapper } from "./ResolvePromiseWrapper";
import { ResolvePromise } from "./ResolvePromiseWrapper";

export type ValueInlineProps = { value: any; isPreview: boolean; className?: string; context: JSONViewCtx }

export const ValueInlinePre: React.FC<ValueInlineProps> = ({ value, className, context, isPreview = false }) => {
    switch (typeof value) {
        case "boolean":
        case "number":
        case "symbol":
        case "undefined":
        case "function":
            return <span className={joinClasses("value", "type-" + typeof value, className)}>{String(value)}</span>;
        case "bigint":
            return <span className={joinClasses("value", "type-" + typeof value, className)}>{String(value)}n</span>;
        case "string":
            return <span className={joinClasses("value", "type-" + typeof value, className)}>{JSON.stringify(value)}</span>;
        case "object": {
            const classes = joinClasses(`value type-object-${value?.constructor?.name?.toLowerCase() ?? "null"}`, className);
            if (!value) {
                return <span className={classes}>{String(value)}</span>;
            } else if (value instanceof RegExp) {
                return <span className={classes}>{String(value)}</span>;
            } else if (value instanceof Date) {
                return <span className={classes}>{String(value)}</span>;
            } else if (value instanceof Error) {
                return <span className={joinClasses("value", "type-object-error", className)}>{String(value)}</span>;
            } else if (value instanceof Array) {
                return isPreview
                    ? <span className={classes}>{`Array(${value.length})`}</span>
                    : <AllChildsPreview className={joinClasses('value', className)} value={value} context={context} />;
            } else if (value instanceof Map || value instanceof Set) {

                return isPreview
                    ? <span className={classes}>{`${value.constructor?.name}(${value.size})`}</span>
                    : <AllChildsPreview className={joinClasses('value', className)} value={value} context={context} />;
            } else if (value instanceof Object) {
                return isPreview
                    ? <span className={classes}>{(value.constructor?.name ?? `Object`)}</span>
                    : <AllChildsPreview className={joinClasses('value', className)} value={value} context={context} />;
            }
        }
    }
    return <span>{JSON.stringify(value, null, 2)}</span>;
};

export const ValueInline: React.FC<ValueInlineProps> = (props) => {
    return props.value instanceof PromiseWrapper
        ? <ResolvePromise Component={ValueInlinePre} {...props} />
        : <ValueInlinePre {...props} />
}