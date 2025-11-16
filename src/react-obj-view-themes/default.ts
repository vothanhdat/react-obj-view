import { ThemeColor, colorThemeKeys as k } from "./type";

export const themeDefault: ThemeColor = {
    [k.color]: "light-dark(#333b3c, #efefec)",
    [k.bg]: "light-dark(#f9f9f9, #212121)",
    [k.change]: "rgb(255, 50, 0)",
    [k.fontsize]: "12px",
    [k.bool]: "#08f",
    [k.number]: "red",
    [k.bigint]: "red",
    [k.string]: "orange",
    [k.array]: "#0aa",
    [k.object]: "#0aa",
    [k.promise]: "#0aa",
    [k.map]: "#0aa",
    [k.set]: "#0aa",
    [k.fn]: "#08f",
    [k.regex]: "red",
    [k.date]: "#08f",
    [k.error]: "red",
};
