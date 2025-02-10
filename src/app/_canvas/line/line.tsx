import { ConsoleSqlOutlined } from "@ant-design/icons";
import Drawable from "../drawable";
import IdGenerator from "../id_generator";
import Node from "../node/node";
import SvgDrawable from "../svg_drawable";

export default class Line implements SvgDrawable{
    // 起点
    private _start: Node
    // 终点
    private _end: Node
    private _strokeWidth: number
    private _color: string
    private _id: number
    private _arrowSize: number

    constructor(start: Node, end: Node, id: number){
        this._start = start
        this._end = end
        this._strokeWidth = 2
        this._color = "white"
        this._id = id
        this._arrowSize = 5
    }
    getJSXElement(){
        const { x: x1, y: y1 } = this._start.position;
        const { x: x2, y: y2 } = this._end.position;
        const radius = this._end.radius;

        // 计算方向向量
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / length;
        const uy = dy / length;

        // 计算箭头尖端紧贴 Node 外圆
        const arrowTipX = x2 - ux * radius / 2;
        const arrowTipY = y2 - uy * radius / 2;

        // 计算箭头基部
        const arrowBaseX = arrowTipX - ux * this._arrowSize;
        const arrowBaseY = arrowTipY - uy * this._arrowSize;

        // 计算箭头两侧点 (旋转 ±30°)
        const angle = Math.PI / 3; // 30度
        const leftX = arrowBaseX + (Math.cos(angle) * -ux - Math.sin(angle) * -uy) * this._arrowSize;
        const leftY = arrowBaseY + (Math.sin(angle) * -ux + Math.cos(angle) * -uy) * this._arrowSize;
        const rightX = arrowBaseX + (Math.cos(-angle) * -ux - Math.sin(-angle) * -uy) * this._arrowSize;
        const rightY = arrowBaseY + (Math.sin(-angle) * -ux + Math.cos(-angle) * -uy) * this._arrowSize;

        return (
            <g>
                {/* 直线 */}
                <line
                    x1={x1}
                    y1={y1}
                    x2={arrowTipX} // 终点为箭头尖端
                    y2={arrowTipY}
                    stroke={this._color}
                    strokeWidth={this._strokeWidth}
                />
                {/* 箭头 (三角形) */}
                <polygon
                    points={`${arrowTipX},${arrowTipY} ${leftX},${leftY} ${rightX},${rightY}`}
                    fill={this._color}
                />
            </g>
        );
        
    }
    
    get start() {
        return this._start
    }
    set start(d:Node){
        this._start = d
    }

    get end(){
        return this._end
    }
    set end(d: Node){
        this._end = d
    }

    get strokeWidth(){
        return this._strokeWidth
    }
    set strokeWidth(width: number){
        this._strokeWidth = width
    }

    get color(){
        return this._color
    }
    set color(color: string){
        this._color = color
    }

    get id(){
        return this._id
    }
    set id(id: number){
        this._id = id
    }
}

export class LineBuilder{
    private _line: Line

    constructor(start: Node, end: Node){
        this._line = new Line(start, end, IdGenerator.next())
    }

    start(start: Node){
        this._line.start = start
        return this
    }
    end(end: Node){
        this._line.end = end
        return this
    }
    color(color: string){
        this._line.color = color
        return this
    }
    strokeWidth(width: number){
        this._line.strokeWidth = width
        return this
    }

    build(){
        return this._line
    }

}