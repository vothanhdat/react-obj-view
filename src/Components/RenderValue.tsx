import { useCallback, useState } from "react";
import { joinClasses } from "../ObjectViewV2/utils/joinClasses";
import { LazyValue } from "../V5/LazyValueWrapper";
import { ResolverFn } from "../V5/types";
import { withPromiseWrapper } from "./PromiseWrapper";
import { RenderPreview } from "./RenderPreview";
import { RenderRawValue } from "./RenderRawValue";


const useLazyValue = ({ value, refreshPath }: { value: LazyValue, refreshPath: () => void }) => {

    const isLazyValue = value instanceof LazyValue

    const [lazyValueInited, setLazyValueInited] = useState(isLazyValue && value.inited)

    const lazyValueEmit = useCallback(() => {
        if (value instanceof LazyValue) {
            console.log("init lazy value")
            value.init();
            setLazyValueInited(value.inited);
            console.log(value)
            refreshPath?.()
        }
    }, [isLazyValue && value, isLazyValue && refreshPath])

    const renderValue = isLazyValue ? (value.value ?? value.error) : value;

    return { isLazyValue, renderValue, lazyValueInited, lazyValueEmit }

}


export const RenderValue: React.FC<{

    value: any;
    isPreview: boolean;
    resolver?: Map<any, ResolverFn>;
    depth?: number;
    refreshPath: () => void
}> = withPromiseWrapper(
    ({ value, isPreview, resolver, refreshPath, depth = 0 }) => {

        const { isLazyValue, lazyValueEmit, lazyValueInited, renderValue } = useLazyValue({ value, refreshPath })

        const children = <>
            {isPreview
                ? <RenderPreview value={renderValue} resolver={resolver} depth={depth} />
                : <RenderRawValue value={renderValue} depth={depth} />}
        </>

        return <span
            onClick={lazyValueEmit}
            className={joinClasses(
                "value",
                `type-${typeof value}`,
                isPreview && 'value-preview',
                value == null && 'type-null',
                isLazyValue && 'pointer-cursor',
                value?.constructor?.name ? `type-object-${value?.constructor?.name}`?.toLowerCase() : ``
            )}>
            {isLazyValue
                ? <> {lazyValueInited ? children : "(...)"} </>
                : children}
        </span>;
    }

);
