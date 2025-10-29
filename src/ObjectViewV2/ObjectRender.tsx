import React, { useMemo } from "react";
import { joinClasses } from "./utils/joinClasses";
import { JSONViewCtx, ObjectRenderProps } from "./types";
import { NameRender } from "./ObjectView";
import { ValueInline } from "./ValueInline";
import { AllChilds } from "./AllChilds";
import { useValueInfo } from "./hooks/useValueInfo";
import { PromiseWrapper, ResolvePromise } from "./ResolvePromiseWrapper";


const ObjectRender: React.FC<ObjectRenderProps> = ({ name, value, path = "", level = 0, context, isNonenumerable, renderName = true, }) => {

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
                context,
                className: hasChilds ? "value-preview" : "",
            }} />}
        </div>
        {expandChild ? <div className="node-child">
            <AllChilds {...{ name, value, path, level, context, isNonenumerable }} />
        </div> : ""}
    </>;
};

export const ObjectRenderWrapper: React.FC<ObjectRenderProps> = (props) => {
    return props.value instanceof PromiseWrapper
        ? <ResolvePromise Component={ObjectRender} {...props} />
        : <ObjectRender {...props} />
}
