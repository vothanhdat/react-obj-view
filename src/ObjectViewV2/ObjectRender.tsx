import React from "react";
import { joinClasses } from "./utils/joinClasses";
import { ObjectRenderProps } from "./types";
import { NameRender } from "./ObjectView";
import { ValueInline } from "./ValueInline";
import { AllChilds } from "./AllChilds";
import { useValueInfo } from "./hooks/useValueInfo";

export const ObjectRender: React.FC<ObjectRenderProps> = ({ name, value, path = "", level = 0, context, isNonenumerable, renderName = true, }) => {
    const { expandChild, setExpandChild, hasChilds, isInGroupping } = useValueInfo(value, path, level, [], isNonenumerable, context);
    const isPreview = expandChild || !context.preview;
    return <>
        <div onClick={() => setExpandChild?.(!expandChild)}
            className={joinClasses("node-default", isNonenumerable && "non-enumrable")}
            style={{ whiteSpace: expandChild ? "preserve nowrap" : "nowrap", }}
        >
            <span className="expand-symbol">{hasChilds ? (expandChild ? "▼ " : "▶ ") : "  "}</span>
            {renderName && <><NameRender {...{ name }} />: </>}
            {!isInGroupping && <ValueInline {...{
                value,
                isPreview,
                className: hasChilds ? "value-preview" : "",
            }} />}
        </div>
        {expandChild ? <div className="node-child">
            <AllChilds {...{ name, value, path, level, context, isNonenumerable }} />
        </div> : ""}

    </>;
};
