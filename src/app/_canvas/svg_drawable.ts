import { JSX } from "react"

export default interface SvgDrawable{
    getJSXElement: () => JSX.Element
    get id(): string
    set id(id: string)
}