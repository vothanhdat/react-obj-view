import React from "react"


export const EMPTY_ARR = Object.freeze([]) as never
export const EMPTY_OBJ = Object.freeze({}) as never
export const EMPTY_MAP = new Map()
export const EMPTY_SET = new Set()
export const DefaultRender: React.FC<{ children: any }> = ({ children, ...props }) => <>{children}</>