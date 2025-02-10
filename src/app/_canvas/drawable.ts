import { CSSProperties, JSX } from "react"

export default interface Drawable{
    get position(): Coordinate
    set position(pos: Coordinate)

    get opacity(): number
    set opacity(o: number)

    get zIndex(): number
    set zIndex(zIndex: number)

    get width(): number
    set width(width: number)

    get height(): number
    set height(height: number)

    get id(): number
    set id(id: number)

    get color(): string
    set color(color: string)

    getDynamicStyle: () => CSSProperties
    getJSXElement: () => JSX.Element

    getChild?: () => JSX.Element | null
    setChild?: (c: JSX.Element) => void 
}