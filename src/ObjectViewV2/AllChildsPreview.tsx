import React, { useMemo, Fragment } from "react";
import { joinClasses } from "./utils/joinClasses";
import { NameRender } from "./ObjectView";
import { ValueInline } from "./ValueInline";
import { createIterator } from "./utils/createIterator";

export const AllChildsPreview: React.FC<{ value: any; style?: React.CSSProperties; className?: string; }> = ({ value, style, className }) => {

    const allIterators = useMemo(
        () => [...createIterator(false, false)(value).take(6)],
        [value]
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
            .map(({ name, data, isNonenumerable }, index) => <Fragment key={name}>
                {index > 0 ? ", " : ""}
                {renderName && <><NameRender name={name} />: </>}
                <ValueInline value={data} isPreview />
            </Fragment>)}
        {allIterators.length > 5 ? ",…" : ""}
        {value instanceof Array ? "]" : "}"}
    </span>;
};
