import React from "react";
import { RenderPopover } from "./RenderPopover";


export const RenderFunction: React.FC<{ value: Function, depth: any }> = ({ value, depth }) => {
    if (depth > 0)
        return "ƒ";

    let render = String(value)
        .replace(/^function/, 'ƒ')
        .replace(/^async function/, 'async ƒ')

    let preview = render
        .replace('{ [native code] }', '{…}')
        .replace(/( +)/g, " ")
        .trim()

    if (preview.length > 50) {
        preview = preview.slice(0, 49) + "…}"
    }

    let isNativeCode = render
        .includes('{ [native code] }')

    return isNativeCode
        ? preview
        : <RenderPopover {...{ value: render, shortValue: preview }} />
}