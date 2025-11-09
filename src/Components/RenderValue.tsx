import { joinClasses } from "../ObjectViewV2/utils/joinClasses";
import { ResolverFn } from "../V5/types";
import { withPromiseWrapper } from "./PromiseWrapper";
import { RenderPreview } from "./RenderPreview";
import { RenderRawValue } from "./RenderRawValue";



export const RenderValue: React.FC<{ value: any; isPreview: boolean; resolver?: Map<any, ResolverFn>; depth?: number; }> = withPromiseWrapper(
    ({ value, isPreview, resolver, depth = 0 }) => {
        return <span className={joinClasses(
            "value",
            `type-${typeof value}`,
            isPreview && 'value-preview',
            value == null && 'type-null',
            value?.constructor?.name ? `type-object-${value?.constructor?.name}`?.toLowerCase() : ``
        )}>
            {isPreview
                ? <RenderPreview value={value} resolver={resolver} depth={depth} />
                : <RenderRawValue value={value} depth={depth} />}
        </span>;
    }

);
