import React, { useEffect, useRef, useState } from "react"



export type VirtualScrollerProps<T> = {
    height: number,
    Component: React.FC<VirtualScrollerRenderProps<T>>
} & T


export type VirtualScrollerRenderProps<T> = {
    start: number
    end: number
    offset: number
} & T



const getScrollContainer = (e: HTMLElement): HTMLElement => {
    let current: HTMLElement | null = e
    while (current) {
        const style = window.getComputedStyle(current)
        const overflowY = style.overflowY ?? style.overflow
        if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
            return current
        }
        current = current.parentElement
    }
    return document.documentElement
}

export const VirtualScroller: React.FC<VirtualScrollerProps<any>> = ({ height, Component = React.Fragment, ...props }) => {

    const ref = useRef<HTMLDivElement>(null)

    const [{ start, end, offset }, setState] = useState({ start: 0, end: 0, offset: 0 })

    useEffect(() => {
        if (!ref.current) {
            return
        }

        const parent = getScrollContainer(ref.current)
        const isDocumentScroll = parent === document.documentElement || parent === document.body
        const scrollTarget: HTMLElement | Window = isDocumentScroll ? window : parent
        const listenerOptions: AddEventListenerOptions = { passive: true }
        let raf = 0

        const measure = () => {
            raf = 0
            const node = ref.current
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

    return <div ref={ref} style={{ height: height + 'px', position: 'relative' }}>
        <Component start={start} end={end} offset={offset} {...props} />
    </div>
}
