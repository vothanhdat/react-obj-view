import React, { useMemo, useState } from "react";
import { joinClasses } from "./utils/joinClasses";
import { ValueInlineProps } from "./ValueInline";


export const ValueString: React.FC<ValueInlineProps> = ({ value, className, context, isPreview }) => {

    const string = useMemo(() => String(value), [value]);

    const [_expand, setExpand] = useState(false);

    const expandAble = useMemo(
        () => String(string).length >= 50 || String(string)?.includes("\n"),
        [string]
    );

    const expand = expandAble && _expand;

    return <span
        onClick={() => expandAble && setExpand(e => !e)}
        style={{ background: "#8881", whiteSpace: expand ? "break-spaces" : "" }}
        className={joinClasses("value", "type-" + typeof value, className)}>
        {expand ? `"${string}"` : JSON.stringify(string)}
    </span>;
};
