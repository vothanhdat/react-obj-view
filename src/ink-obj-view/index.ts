export { InkObjectView, type InkObjectViewProps } from "./InkObjectView";
export { TerminalScroller, type TerminalScrollerHandle, type TerminalScrollerProps, clampFirstVisible } from "./TerminalScroller";
export { RenderNodeInk, type InkRowProps, type InkRowExtras } from "./RenderNodeInk";
export { useKeyboardNav, type KeyboardNavParams } from "./useKeyboardNav";
export { SearchInput, type SearchInputProps } from "./SearchInput";
export { formatValueRaw, formatValuePreview, segmentsText, type Segment } from "./formatValue";
export { highlightSegments, buildMarkRegex } from "./highlightSegments";

export {
    type InkTheme,
    type InkThemeEntry,
    type InkThemeKey,
    type InkThemeOverrides,
    inkThemeKeys,
    createInkTheme,
    extendInkTheme,
    themeDark,
    themeLight,
    themeMono,
    builtInInkThemes,
    type BuiltInInkThemeName,
} from "../ink-obj-view-themes";
