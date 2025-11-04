import React, { useMemo, Fragment } from "react";
import { joinClasses } from "./utils/joinClasses";
import { NameRender } from "./ObjectView";
import { ValueInline } from "./ValueInline";
import { createIterator } from "./utils/createIterator";
import { useResolver } from "./utils/useResolver";
import { JSONViewCtx } from "./types";

export const AllChildsPreview: React.FC<{ value: any; style?: React.CSSProperties; className?: string; context: JSONViewCtx }> = ({ value, style, className, context }) => {

    const resolver = useResolver(value, context)

    const allIterators = useMemo(
        () => [...resolver(value, createIterator(false, false)(value), true).take(6)],
        [value, resolver]
    );

    const renderName = !(value instanceof Array || value instanceof Set);

    const renderType = value
        && value.constructor != Object
        && value.constructor != Array
        ? value.constructor?.name : "";

    return <span className={joinClasses(className)}>
        {renderType}
        {value instanceof Array ? "[" : "{"}
        {allIterators
            .slice(0, 5)
            .map(({ key: name, value: data, enumerable: isNonenumerable }, index) => <Fragment key={name}>
                {index > 0 ? ", " : ""}
                {renderName && <><NameRender name={name} />: </>}
                <ValueInline value={data} context={context} isPreview />
            </Fragment>)}
        {allIterators.length > 5 ? ",…" : ""}
        {value instanceof Array ? "]" : "}"}
    </span>;
};
