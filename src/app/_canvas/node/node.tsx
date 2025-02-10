import { CSSProperties, JSX } from "react"
import Drawable from "../drawable"
import IdGenerator from "../id_generator"
import style from './base.module.css'
import Listenable, { ObserverCallBack } from "../listenable"
import Line from "../line/line"

/// 画布节点
export default class Node extends Listenable implements Drawable{
    private _position: Coordinate
    private _radius: number
    private _width: number
    private _height: number
    private _color: string
    private _zIndex: number
    private _opacity: number
    private _id: string
    private _name: string
    // 连接到该点的线段集合
    // start表示以该点作为起点的线段，end表示以该点作为终点的线段
    private _lines: {"start": Line[], "end": Line[]}

    constructor(id: string, name?: string){
        super()
        this._position = {x: 0, y: 0}
        this._radius = 50
        this._width = this._radius * 2
        this._height = this._radius * 2
        this._color = "blue"
        this._zIndex = 101
        this._opacity = 1
        this._id = id
        this._name = name ?? `${id}` 
        this._lines = {
            "start": [],
            "end": []
        }
    }

    get opacity(): number {
        return this._opacity
    }
    set opacity(o: number) {
        this._opacity = o
        this.notifyListeners()
    }
    
    get zIndex(): number {
        return this._zIndex
    }
    set zIndex(zIndex: number) {
        this._zIndex = zIndex
        this.notifyListeners()
    }

    get width(): number {
        return this._radius * 2
    }
    set width(width: number) {
        this._radius = width / 2
        this._height = width
        this._width = width
        this.notifyListeners()
    }

    get height(): number {
        return this._radius * 2
    }
    set height(height: number) {
        this._radius = height / 2
        this._height = height
        this._width = height
        this.notifyListeners()
    }

    get radius(){
        return this._radius
    }
    set radius(radius: number){
        this._width = radius * 2
        this._height = radius * 2
        this._radius = radius
        this.notifyListeners()
    }

    get id(): string {
        return this._id
    }
    set id(id: string) {
        this._id = id
        this.notifyListeners()
    }

    get color(): string {
        return this._color
    }
    set color(color: string) {
        this._color = color
        this.notifyListeners()
    }

    get position(){
        return this._position
    }
    set position(pos: Coordinate){
        this._position = pos
        this.notifyListeners()
    }

    get name(){
        return this._name
    }
    set name(name: string){
        this._name = name
        this.notifyListeners()
    }

    get lines(){
        return this._lines
    }
    set lines(lines: {"start": Line[], "end": Line[]}){
        this._lines = lines
        this.notifyListeners()
    }
    // 将线段作为起点添加
    addAsStart(line: Line){
        // 检查该直线是否已经存在
        if(this._lines.start.some((value) => {
            value.id === line.id
        })){
            return
        }
        if(this._lines.end.some((value)=>{
            value.id === line.id
        })){
            return
        }
        this._lines.start.push(line)
        this.notifyListeners()
    }
    // 将线段作为终点添加
    addAsEnd(line: Line){
        // 检查该直线是否已经存在
        if(this._lines.end.some((value) => {
            value.id === line.id
        })){
            return
        }
        if(this._lines.start.some((value)=>{
            value.id === line.id
        })){
            return
        }
        this._lines.end.push(line)
        this.notifyListeners()
    }
    // 删除作为终点的直线
    removeEndLine(line: Line){
        this._lines.end = this._lines.end.filter((l) => l.id !== line.id)
        this.notifyListeners()
    }
    // 删除作为起点的直线
    removeStartLine(line: Line){
        this._lines.start = this._lines.start.filter((l) => l.id !== line.id)
        this.notifyListeners()
    }


    setChild?: ((c: JSX.Element) => void) | undefined

    getDynamicStyle(): CSSProperties {
        const css: CSSProperties = {
            backgroundColor: this.color,
            zIndex: this.zIndex,
            width: this._radius * 2,
            height: this._radius * 2,
            left: `${this.position.x}px`,
            top: `${this.position.y}px`,
        }
        return css
    }

    getJSXElement(): JSX.Element{
        return <div
        style={this.getDynamicStyle()}
        className={style.node}
        key={this.id}>
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

    
}

export class NodeBuilder{
    public node: Node

    constructor(){
        this.node = new Node(IdGenerator.nextDrawableId())
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