import { JSX } from "react"

export default interface SvgDrawable{
    getJSXElement: () => JSX.Element
    get id(): number
    set id(id: number)
}