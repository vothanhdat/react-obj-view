import React from "react";
import { RenderPopover } from "./Popover";
import { HighlightString } from "../hooks/useHighlight";


export const RenderFunction: React.FC<{ value: Function, depth: any; highlight?: boolean }> = ({ value, depth, highlight = true }) => {
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
        ? <HighlightString text={preview} enable={highlight} />
        : <RenderPopover {...{ value: render, shortValue: preview }} />
}