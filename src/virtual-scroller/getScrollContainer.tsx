export const getScrollContainer = (e: HTMLElement): HTMLElement => {
    let current: HTMLElement | null = e;
    while (current) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY ?? style.overflow;
        if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
            return current;
        }
        current = current.parentElement;
    }
    return document.documentElement;
};
