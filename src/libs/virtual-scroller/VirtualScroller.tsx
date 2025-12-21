
import React, { ReactNode, useEffect, useRef, useState } from "react"
import { getScrollContainer } from "./getScrollContainer"
import type { VirtualScrollerProps, VirtualScrollerHandler } from "./types"


export const VirtualScroller = <T,>(
    { height, Component = React.Fragment as any, ref, ...props }: VirtualScrollerProps<T> & { ref?: React.Ref<VirtualScrollerHandler> }
) => {

    const innerRef = useRef<HTMLDivElement>(null)

    const [{ start, end, offset }, setState] = useState({ start: 0, end: 0, offset: 0 })

    React.useImperativeHandle(ref, () => ({
        scrollTo: (options: ScrollToOptions, offsetTop = 200, offsetBottom = 100) => {
            if (!innerRef.current) {
                return
            }
            const parent = getScrollContainer(innerRef.current)
            const isDocumentScroll = parent === document.documentElement || parent === document.body
            // const scrollTarget: HTMLElement | Window = isDocumentScroll ? window : parent

            const top = (options.top ?? 0)

            // If checking absolute position relative to document/parent?
            // Usually scrollTo(y) means scrolling the container so that the point y inside the scroller is at top.

            // Calculate absolute top of the scroller element
            const nodeRect = innerRef.current.getBoundingClientRect()

            // If window scroll
            if (isDocumentScroll) {
                const scrollToMax = window.scrollY + nodeRect.top + top - offsetTop
                const scrollToMin = window.scrollY + nodeRect.top + top - window.innerHeight + offsetBottom
                if (window.scrollY < scrollToMin) {
                    window.scrollTo({
                        ...options,
                        top: scrollToMax
                    })
                } else if (window.scrollY > scrollToMax) {
                    window.scrollTo({
                        ...options,
                        top: scrollToMin
                    })
                }

            } else {
                // If element scroll
                // parent.scrollTop should be such that ref.current.top is 0 (relative to parent) + top

                // parent.scrollTop = (ref.current.offsetTop - parent.offsetTop) + top? 
                // Easier: get relative position.

                // Relative position of ref.current within parent:
                // We can use the difference in getBoundingClientRect().top + parent.scrollTop

                const parentRect = parent.getBoundingClientRect()
                const scrollToMax = nodeRect.top - parentRect.top + parent.scrollTop + top - offsetTop
                const scrollToMin = nodeRect.top - parentRect.top + parent.scrollTop + top - parentRect.height + offsetBottom

                if (parent.scrollTop < scrollToMin) {
                    parent.scrollTo({
                        ...options,
                        top: scrollToMax
                    })
                } else if (parent.scrollTop > scrollToMax) {
                    parent.scrollTo({
                        ...options,
                        top: scrollToMin
                    })
                }


            }
        }
    }), [])


    useEffect(() => {

        if (!isFinite(height)) {
            console.error("Height is not valid", { height })
        }

        if (!innerRef.current) {
            return
        }


        const parent = getScrollContainer(innerRef.current)
        const isDocumentScroll = parent === document.documentElement || parent === document.body
        const scrollTarget: HTMLElement | Window = isDocumentScroll ? window : parent
        const listenerOptions: AddEventListenerOptions = { passive: true }
        let raf = 0

        const measure = () => {
            raf = 0
            const node = innerRef.current
            if (!node) {
                return
            }
            // console.time("measure")
            const parentRect = isDocumentScroll ? null : parent.getBoundingClientRect()
            const nodeRect = node.getBoundingClientRect()
            const viewportHeight = parentRect ? parentRect.height : window.innerHeight
            const relativeTop = parentRect ? nodeRect.top - parentRect.top : nodeRect.top
            const viewportTop = -relativeTop
            const viewportBottom = viewportTop + viewportHeight
            const nextStart = Math.min(height, Math.max(0, viewportTop))
            const nextEnd = Math.min(height, Math.max(0, viewportBottom))

            const parentScrollTop = isDocumentScroll ? window.scrollY : parent.scrollTop

            const nextOffset = Math.min(height, Math.max(0, parentScrollTop - viewportTop))

            setState(prev => {
                if (prev.start === nextStart && prev.end === nextEnd && prev.offset == nextOffset) {
                    return prev
                }
                return { start: nextStart, end: nextEnd, offset: nextOffset }
            })
            // console.timeEnd("measure")

        }

        const scheduleMeasure = () => {
            if (raf) {
                return
            }
            raf = requestAnimationFrame(measure)
        }

        measure()
        parent.addEventListener("wheel", scheduleMeasure, listenerOptions)
        scrollTarget.addEventListener("scroll", scheduleMeasure, listenerOptions)
        window.addEventListener("resize", scheduleMeasure)

        return () => {
            parent.removeEventListener("wheel", scheduleMeasure, listenerOptions)
            scrollTarget.removeEventListener("scroll", scheduleMeasure, listenerOptions)
            window.removeEventListener("resize", scheduleMeasure)
            if (raf) {
                cancelAnimationFrame(raf)
            }
        }
    }, [height])

    return isFinite(height) && <div ref={innerRef} style={{ height: height + 'px', position: 'relative' }}>
        <Component start={start} end={end} offset={offset} {...props as any} />
    </div>
}

