import Drawable from "./drawable"
import Node from "./node/node"
import SvgDrawable from "./svg_drawable"

/// 画布事件
export const CanvasEvents = {
    addDrawableEvent: "addDrawableEvent",
    addSvgDrawableEvent: "addSvgDrawableEvent",
    removeDrawableEvent: "removeDrawableEvent",
    removeSvgDrawableEvent: "removeSvgDrawableEvent",
    removeNodeEvent: "removeNodeEvent",
    clickDrawableEvent: "clickDrawableEvent",
    clickCanvasEvent: "clickCanvasEvent",
    connectNode: "connectNode",
    connectedNode: "connectedNode",
}

type EventCallBack<T extends CanvasEvent = CanvasEvent> = (context: T) => void

class CanvasEventEmitterClass{
    public events: Map<string, Set<EventCallBack<any>>>

    constructor(){
        this.events = new Map()
    }

    /// 订阅事件
    subscribe<T extends CanvasEvent>(event: string, callback: EventCallBack<T>): () => void{
        if(!this.events.has(event)){
            this.events.set(event, new Set())
        }
        this.events.get(event)!.add(callback);
        return () => this.unsubscribe(event, callback)
    }

    /// 取消订阅
    unsubscribe<T extends CanvasEvent>(event: string, callback: EventCallBack<T>): void{
        if(this.events.has(event)){
            this.events.get(event)!.delete(callback)
            if(this.events.get(event)!.size == 0){
                this.events.delete(event)
            }
        }
    }

    /// 发布事件
    publish<T extends CanvasEvent>(event: string, context?: T): void{
        if(this.events.get(event)){
            this.events.get(event)!.forEach((callback) => callback(context))
        }
    }
}

const CanvasEventEmitter = new CanvasEventEmitterClass()
export default CanvasEventEmitter

export interface CanvasEvent{
    context: object
}

/// 添加可绘制对象
export interface AddDrawableEvent extends CanvasEvent{
    context: Drawable
}

/// 开始移动可绘制对象
export interface StartMoveDrawableEvent extends CanvasEvent{
    context: Drawable
}

/// 移动可绘制对象
export interface MovingDrawableEvent extends CanvasEvent{
    context: Drawable
}

/// 可绘制对象移动结束
export interface StopMovingDrawableEvent extends CanvasEvent{
    context: Drawable
}

/// 点击可绘制对象
export interface ClickDrawableEvent extends CanvasEvent{
    context: Drawable
}

/// 点击画布空白处
export interface ClickCanvasEvent extends CanvasEvent{
    context: Coordinate
}

/// 开始选择另一结点
export interface ConnectNodeEvent extends CanvasEvent{
    context: Node
}

/// 选择完毕另一结点
export interface ConnectedNodeEvent extends CanvasEvent{
    context: {origin: Node, end: Node}
}

/// 添加可绘制Svg对象
export interface AddSvgDrawableEvent{
    svgDrawable: SvgDrawable
}

/// 删除可绘制对象
export interface RemoveDrawableEvent extends CanvasEvent{
    context: Drawable
}

/// 删除顶点
export interface RemoveNodeEvent extends CanvasEvent{
    context: Node
}

/// 删除可绘制Svg对象
export interface RemoveSvgDrawableEvent{
    svgDrawable: SvgDrawable
}


