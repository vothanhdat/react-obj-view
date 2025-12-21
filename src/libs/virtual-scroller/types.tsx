import React from "react";



export type VirtualScrollerProps<T> = {
    height: number;
    Component: React.FC<VirtualScrollerRenderProps<T>>;
} & T;


export type VirtualScrollerRenderProps<T> = {
    start: number;
    end: number;
    offset: number;
} & T;

export type VirtualScrollerHandler = {
    scrollTo: (options: ScrollToOptions, offsetTop?: number, offsetBottom?: number) => void
}
