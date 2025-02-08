import { CSSProperties, JSX } from "react"

export default interface Drawable{
    color: string
    _position: Coordinate
    zIndex: number
    opacity: number
    width: number,
    height: number,
    id: number


    getColor: () => string
    setColor: (c: string) => void

    getZIndex: () => number
    setZIndex: (z: number) => void

    getOpacity: () => number
    setOpacity: (o: number) => void

    getDynamicStyle: () => CSSProperties
    getJSXElement: () => JSX.Element

    getChild?: () => JSX.Element | null
    setChild?: (c: JSX.Element) => void 

    getId: () => number
    setId: (id: number) => void
}