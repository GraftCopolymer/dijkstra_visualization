import { CSSProperties } from "react";
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
    private _id: string
    private _arrowSize: number
    // 权重
    private _weight: number
    private _outerStyle: CSSProperties

    constructor(start: Node, end: Node, id: string){
        this._start = start
        this._end = end
        this._strokeWidth = 2
        this._color = "white"
        this._id = id
        this._arrowSize = 10
        this._weight = 0
        this._outerStyle = {}
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
        const arrowTipX = x2 - ux * radius;
        const arrowTipY = y2 - uy * radius;

        // 计算箭头基部
        const arrowBaseX = arrowTipX - ux * this._arrowSize;
        const arrowBaseY = arrowTipY - uy * this._arrowSize;

        // 计算箭头两侧点 (旋转 ±30°)
        const angle = Math.PI / 3; // 30度
        const leftX = arrowBaseX + (Math.cos(angle) * -ux - Math.sin(angle) * -uy) * this._arrowSize;
        const leftY = arrowBaseY + (Math.sin(angle) * -ux + Math.cos(angle) * -uy) * this._arrowSize;
        const rightX = arrowBaseX + (Math.cos(-angle) * -ux - Math.sin(-angle) * -uy) * this._arrowSize;
        const rightY = arrowBaseY + (Math.sin(-angle) * -ux + Math.cos(-angle) * -uy) * this._arrowSize;

        // 计算中点
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        // 计算旋转角度
        let textAngle = Math.atan2(dy, dx) * (180 / Math.PI);

        // 修正文本角度，防止倒置
        if (textAngle > 90 || textAngle <= -90) {
            textAngle += 180; 
        }

        // 沿法线方向偏移文本
        const offset = 15; // 上移 15 像素，防止重叠
        const normalX = midX - uy * offset; // -uy 表示沿法线方向上移
        const normalY = midY + ux * offset; // ux 方向偏移

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
                    style={{
                        ...this._outerStyle
                    }}
                />
                {/* 箭头 (三角形) */}
                <polygon
                    points={`${arrowTipX},${arrowTipY} ${leftX},${leftY} ${rightX},${rightY}`}
                    fill={this._color}
                    style={{
                        ...this._outerStyle
                    }}
                />
                 <text
                    x={normalX}
                    y={normalY}
                    fill="white"
                    fontSize="14"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    transform={`rotate(${textAngle}, ${normalX}, ${normalY})`} // **旋转文本**
                >
                    {this._weight}
                </text>
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
    set id(id: string){
        this._id = id
    }

    get weight(){
        return this._weight
    }
    set weight(weight: number){
        this._weight = weight
    }

    get arrowSize(){
        return this._arrowSize
    }
    set arrowSize(size: number){
        this._arrowSize = size
    }

    get outerStyle(){
        return this._outerStyle
    }
    set outerStyle(s: CSSProperties){
        this._outerStyle = s
    }
}

export class LineBuilder{
    private _line: Line

    constructor(start: Node, end: Node){
        this._line = new Line(start, end, IdGenerator.nextSvgId())
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
    weight(weight: number){
        this._line.weight = weight
        return this
    }
    arrowSize(size: number){
        this._line.arrowSize = size
        return this
    }

    build(){
        return this._line
    }

}