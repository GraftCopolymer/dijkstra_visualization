import Drawable from "../drawable";
import Node from "../node/node";
import SvgDrawable from "../svg_drawable";

export default class Line implements SvgDrawable{
    // 起点
    public start: Drawable
    // 终点
    public end: Drawable
    public strokeWidth: number
    public color: string

    constructor(start: Node, end: Node){
        this.start = start
        this.end = end
        this.strokeWidth = 2
        this.color = "white"
    }
    getJSXElement(){
        return <line 
        x1={this.start.position.x} y1={this.start.position.y}
        x2={this.end.position.x} y2={this.end.position.y}
        stroke={this.color}
        strokeWidth={this.strokeWidth}/>
    }


}