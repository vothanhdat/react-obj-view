import React from "react";
import { CustomAction } from "./types";

const allowJSONPrototype = new Set<any>([
    Object.getPrototypeOf({}),
    Object.getPrototypeOf([]),
    Object.getPrototypeOf(new Date),
    {}.constructor,
    [].constructor,
    (new Date).constructor,
]);


export const DEFAULT_ACTION: CustomAction[] = [
    {
        name: "copy",
        dependency: (data) => [typeof data.value],
        prepareAction(data) {
            if (data.key == "[[Prototype]]")
                return;

            let valueType = typeof data.value;
            let copyText = valueType == 'string' || valueType == 'number' || valueType == 'bigint';
            let copyJSON = !copyText
                && data.value !== null
                && valueType == 'object'
                && allowJSONPrototype.has(Object.getPrototypeOf(data.value))
                && allowJSONPrototype.has(data.value?.constructor);

            return copyText || copyJSON ? { copyText, copyJSON } : undefined;
        },
        performAction({ copyText, copyJSON }, nodeData) {
            if (copyText) {
                return navigator.clipboard.writeText(String(nodeData.value));
            } else if (copyJSON) {
                return new Promise(r => (window?.requestIdleCallback ?? window?.requestAnimationFrame)(r))
                    .then(() => JSON.stringify(nodeData.value))
                    .then(text => navigator.clipboard.writeText(text));
            }
        },
        actionRender: ({ copyJSON, copyText }) => {
            if (copyText) return "Copy Text";
            if (copyJSON) return "Copy JSON";
            return "";
        },
        actionRunRender: "Copying ...",
    } as CustomAction<{ copyText?: boolean; copyJSON?: boolean; }>,
];
