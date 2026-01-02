import { useRef, useCallback } from "react";
import { FlattenNodeWrapper } from "../../libs/react-tree-view";
import { ObjectWalkingAdapter } from "../../object-tree";
import { ObjectWalkingMetaParser } from "../../object-tree/types";

export function useHoverInteractions(
    childCount: number,
    getNodeByIndex: (index: number) => FlattenNodeWrapper<ObjectWalkingAdapter, ObjectWalkingMetaParser> | undefined
) {
    const containerRef = useRef<HTMLDivElement>(null);
    // const timeoutRef = useRef({ timeout: undefined as any });
    const ref = useRef({ getNodeByIndex, childCount, timeout: undefined as any })

    ref.current.getNodeByIndex = getNodeByIndex
    ref.current.childCount = childCount

    const onMouseEnter = useCallback(
        (index: number) => {

            clearTimeout(ref.current.timeout);

            ref.current.timeout = setTimeout(() => {

                const { getNodeByIndex, childCount } = ref.current
                let containerStyles = containerRef?.current?.style;
                if (index < childCount && containerStyles) {
                    let node = getNodeByIndex(index)
                    if (!node) return;
                    let parentIndex = node.childCount > 1
                        ? node.parentIndex.at(-1)
                        : node.parentIndex.at(-2)
                        ?? 0
                    containerStyles.setProperty('--active-index', String(index));
                    containerStyles.setProperty('--active-parent', String(parentIndex));
                }
            }, 50);

        },
        [containerRef, ref]
    );

    const onMouseLeave = useCallback(
        (index: number) => {
            clearTimeout(ref.current.timeout);

            ref.current.timeout = setTimeout(() => {
                const { getNodeByIndex, childCount } = ref.current

                let containerStyles = containerRef?.current?.style;

                if (index < childCount && containerStyles) {
                    let current = containerStyles.getPropertyValue('--active-index');
                    if (current == String(index)) {
                        containerStyles.setProperty('--active-index', String(-1));
                        containerStyles.setProperty('--active-parent', String(-1));
                    }

                }
            }, 100);
        },
        [containerRef, ref]
    );

    return { onMouseEnter, onMouseLeave, containerRef };
}
