import { CSSProperties, JSX } from "react"
import Drawable from "../drawable"
import IdGenerator from "../id_generator"
import style from './base.module.css'

/// 画布节点
export default class Node implements Drawable{
    public position: Coordinate
    public radius: number
    public width: number
    public height: number
    public color: string
    public zIndex: number
    public opacity: number
    public id: number
    public name: string

    constructor(id: number, name?: string){
        this.position = {x: 0, y: 0}
        this.radius = 5
        this.width = this.radius
        this.height = this.radius
        this.color = "blue"
        this.zIndex = 101
        this.opacity = 1
        this.id = id
        this.name = name ?? `${id}` 
    }

    getDynamicStyle(): CSSProperties {
        const css: CSSProperties = {
            backgroundColor: this.color,
            zIndex: this.zIndex,
            width: this.radius,
            height: this.radius,
            left: `${this.position.x}px`,
            top: `${this.position.y}px`,
        }
        return css
    }

    getJSXElement(): JSX.Element{
        return <div
        style={this.getDynamicStyle()}
        className={style.node}
        key={this.getId()}>
            {
                this.getChild()
            }
        </div>
    }

    getChild(){
        return <div className={style.nodeText}>
            {this.name}
        </div>
    }

    getColor(): string {
        return this.color
    }
    setColor(color: string){
        this.color = color
    }


    getZIndex(): number {
        return this.zIndex
    }
    setZIndex(zIndex: number){
        this.zIndex = zIndex
    }

    getOpacity(): number {
        return this.opacity
    }
    setOpacity(opacity: number){
        this.opacity = opacity
    }

    getPosition(): Coordinate {
        return this.position
    }
    setPosition(coor: Coordinate){
        this.position = coor
    }

    getId(){
        return this.id
    }
    setId(id: number){
        this.id = id
    }
}

export class NodeBuilder{
    public node: Node

    constructor(){
        this.node = new Node(IdGenerator.next())
    }

    static copy(node: Node): Node{
        return new NodeBuilder()
            .color(node.color)
            .opacity(node.opacity)
            .position({
                x: node.position.x,
                y: node.position.y
            })
            .radius(node.radius)
            .zIndex(node.zIndex)
            .build()
    }

    radius(radius: number){
        this.node.radius = radius
        return this
    }

    color(color: string){
        this.node.color = color
        return this
    }

    position(pos: Coordinate){
        this.node.position = pos
        return this
    }

    zIndex(zIndex: number){
        this.node.zIndex = zIndex
        return this
    }

    opacity(opacity: number){
        this.node.opacity = opacity
        return this
    }

    build(){
        return this.node
    }

}