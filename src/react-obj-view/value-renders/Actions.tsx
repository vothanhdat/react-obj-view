import React, { useCallback, useMemo } from "react";
import { ObjectViewRenderRowProps } from "../types";
import { useCopy } from "../hooks/useCopy";


const allowJSONPrototype = new Set<any>([
    Object.getPrototypeOf({}),
    Object.getPrototypeOf([]),
    Object.getPrototypeOf(new Date),
    {}.constructor,
    [].constructor,
    (new Date).constructor,
])

export const DefaultActions: React.FC<ObjectViewRenderRowProps> = ({ valueWrapper }) => {

    const value = valueWrapper?.()

    const valueType = typeof value;

    const { handleCopy, handleReset, canCopy, copySuccess, copyError, copying } = useCopy();

    const canCopyText = useMemo(
        () => valueType == 'string' || valueType == 'number' || valueType == 'bigint',
        [valueType]
    )

    const canCopyJSON = useMemo(
        () => !canCopyText
            && value !== null
            && valueType == 'object'
            && allowJSONPrototype.has(Object.getPrototypeOf(value))
            && allowJSONPrototype.has(value?.constructor),
        [canCopyText, valueType == 'object' && value]
    )

    const copyText = useCallback(
        () => handleCopy(async () => value),
        [value]
    )

    const copyJSON = useCallback(
        () => handleCopy(async () => JSON.stringify(value)),
        [value]
    )

    return <>
        {canCopy && canCopyText && <button onClick={copyText}>Copy</button>}
        {canCopy && canCopyJSON && <button onClick={copyJSON}>Copy JSON</button>}
        {copying && <button>Copying ...</button>}
        {copySuccess && <button className="success"
            onClick={handleReset}
            onMouseLeave={handleReset}>
            ✓ SUCCESS
        </button>}
        {copyError && <button className="error"
            onClick={handleReset}
            onMouseLeave={handleReset}>
            ❗Error: {String(copyError)}
        </button>}
    </>
}


