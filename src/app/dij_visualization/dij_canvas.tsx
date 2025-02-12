'use client'

import { Ref, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Drawable from '../_canvas/drawable'
import style from './page.module.css'
import Node from '../_canvas/node/node'
import SvgDrawable from '../_canvas/svg_drawable'
import Line, { LineBuilder } from '../_canvas/line/line'
import CanvasEventEmitter, { CanvasEvents, ClickCanvasEvent, ClickDrawableEvent, EndDijEvent, StartDijEvent } from '../_canvas/events'
import IdGenerator from '../_canvas/id_generator'
import { DijController } from '../_canvas/dij_controller'
import Utils from '../_utils/utils'

export interface CanvasStates{
    drawableList: Drawable[]
    svgDrawableList: SvgDrawable[]
    canvasSize: {width: number, height: number}
    draggingDrawable: Drawable | null
    originNode: Node | null
}

export interface DijCanvasAPI{
    draw: (drawable: Drawable) => void
    drawNode: (node: Node) => void
    /// 清除画布并绘制列表中的顶点
    drawNodes: (nodeList: Node[]) => void
    /// 清除画布并绘制列表中的直线
    drawLines: (lineList: Line[]) => void
    /// 将鼠标坐标变换为以屏幕中心点为原点的坐标
    translateMousePosition: (pos: Coordinate) => Coordinate
    /// 绘制直线
    drawLine: (line: Line) => void
    // 连接另一顶点
    connectNode: (origin: Node) => void
    // 停止连接
    stopConnectNode: () => void
    // 暴露画布状态
    getStates: () => CanvasStates
    // 删除顶点
    deleteNode: (node: Node) => void
    // 删除所有可绘制对象以及svg对象
    clearCanvas: () => void
    // // 开始迪杰斯特拉算法模拟
    // startDij: () => void
    // // 结束迪杰斯特拉撒算法模拟
    // endDij: () => void
    // 修改结点外部样式
    updateNodeOuterStyle: (id: number, data: any) => void
    // 修改直线外部样式
    updateLineOuterStyle: (id: string, data: any) => void
    // 修改结点悬浮文本
    updateNodeFloatingText: (id: number, text: string) => void
}

export default function DijCanvas({ref}: {ref?: Ref<DijCanvasAPI>}){
    // 是否处于算法模拟状态
    const [dij, setDij] = useState(false)
    const [drawableList, setDrawableList] = useState([] as Drawable[])
    const [svgDrawableList, setSvgDrawableList] = useState([] as SvgDrawable[])
    /// 将可绘制对象转化为JSX元素
    const drawableElementList = drawableList.map((d) => {
        const renderObj = <div 
        onMouseDown={(e: any) => {onDragDrawable(e, d)}} 
        onClick={(e: any) => {onClickDrawable(e, d)}}
        key={d.id} 
        style={{
            position: "absolute",
        }}>
            {d.getJSXElement()}
        </div>
        return renderObj
    })
    /// 将可绘制SVG对象转化为JSX元素
    const svgDrawableElementList = svgDrawableList.map((s) => {
        const renderObj = <g key={s.id}>
            {s.getJSXElement()}
        </g>
        return renderObj
    })

    // 画布尺寸
    const [canvasSize, setCanvasSize] = useState({width: 0, height: 0} as {width: number, height: number})
    const canvasRef = useRef(null)

    // 当前被拖动的Drawable对象，若为null则没有被拖动的对象
    const [draggingDrawable, setDraggingDrawable] = useState<Drawable | null>(null)
    const draggingOffset = useRef({x: 0, y: 0})

    // 当前画布状态
    // 存放选择状态时的起始Drawable，为null则表示不处于选择状态
    const originNode = useRef<Node | null>(null)

    /// Drawable对象被点击
    function onClickDrawable(e: MouseEvent, drawable: Drawable){
        console.log(drawable)
        if(dij) return
        // 派发可绘制对象被点击的事件
        CanvasEventEmitter.publish<ClickDrawableEvent>(CanvasEvents.clickDrawableEvent, {context: drawable})
        if(!originNode.current) return
        /// 不能连接到自己
        if(drawable === originNode.current || !(drawable instanceof Node)) return 
        // 不能重复绘制
        if(originNode.current.lines.start.some((line) => line.end.id === drawable.id)) return 
        const line = new LineBuilder(originNode.current!, drawable).weight(Utils.random(20, 100)).build()
        console.log(`绘制直线: ${line}`)
        drawLine(
            line
        )
    }

    /// 开始拖动Drawable对象
    function onDragDrawable(e: any, drawable: Drawable){
        if(originNode.current || dij) return
        e.stopPropagation()
        setDraggingDrawable(drawable)
        // 将鼠标坐标变换到以屏幕中心点为原点的坐标系
        const translated = translateMousePosition({
            x: e.clientX,
            y: e.clientY
        })
        // 计算鼠标与坐标的偏移
        draggingOffset.current = {
            x: translated.x - drawable.position.x,
            y: translated.y - drawable.position.y
        }
        // 禁止选择文本
        document.body.style.userSelect = 'none'
    }

    // 正在拖动Drawable对象
    function onDraggingDrawable(e: any){
        if(!draggingDrawable || originNode.current || dij) return
        // 计算被拖动对象的新位置
        const translated = translateMousePosition({
            x: e.clientX,
            y: e.clientY
        })
        let newx = translated.x - draggingOffset.current.x
        let newy = translated.y - draggingOffset.current.y
        // 检测屏幕边缘
        if(newx - draggingDrawable.width / 2 <= -canvasSize.width / 2){
            newx = -canvasSize.width / 2 + draggingDrawable.width / 2
        }
        if(newx + draggingDrawable.width / 2 >= canvasSize.width / 2){
            newx = canvasSize.width / 2 - draggingDrawable.width / 2
        }
        if(newy - draggingDrawable.height / 2 <= -canvasSize.height / 2){
            newy = -canvasSize.height / 2 + draggingDrawable.height / 2
        }
        if(newy + draggingDrawable.height / 2 >= canvasSize.height / 2){
            newy = canvasSize.height / 2 - draggingDrawable.height / 2
        }

        setDrawableList(drawableList.map(d => {
            if(d.id == draggingDrawable.id){
                d.position = {
                    x: newx,
                    y: newy
                }
            }
            return d
        }))
    }

    /// 停止拖动Drawable对象
    function onStopDragging(e: any){
        if(originNode.current || dij) return 
        e.stopPropagation()
        setDraggingDrawable(null)
        document.body.style.userSelect = ''
    }

    /// 点击画布的空白部分
    function onClickCanvas(e: any){
        if(e.currentTarget === canvasRef.current){
            const pos = translateMousePosition({
                x: e.clientX,
                y: e.clientY
            })
            CanvasEventEmitter.publish<ClickCanvasEvent>(CanvasEvents.clickCanvasEvent, {context: pos})
        }
    }

    useEffect(()=>{
        const handleMove = (e: MouseEvent) => onDraggingDrawable(e);
        const handleUp = (e: MouseEvent) => onStopDragging(e);

        if (draggingDrawable) {
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };
    }, [draggingDrawable])

    function draw(drawable: Drawable){
        // 添加到绘制列表
        setDrawableList([
            ...drawableList,
            drawable
        ])
    }

    function drawNode(node: Node){
        setDrawableList([
            ...drawableList,
            node
        ])
        CanvasEventEmitter.publish(CanvasEvents.addDrawableEvent, {context: node})
    }

    function drawNodes(nodeList: Node[]){
        setDrawableList([
            ...nodeList
        ])
    }

    function drawLine(line: Line){
        // 将线添加到顶点的边集中
        line.start.addAsStart(line)
        line.end.addAsEnd(line)
        setSvgDrawableList([
            ...svgDrawableList,
            line
        ])
    }

    function drawLines(lineList: Line[]){
        // 为结点同步直线
        lineList.forEach((line) => {
            line.start.addAsStart(line)
            line.end.addAsEnd(line)
        })
        setSvgDrawableList([
            ...lineList
        ])
    }

    function translateMousePosition(pos: Coordinate): Coordinate{
        return {
            x: pos.x - window.innerWidth / 2,
            y: pos.y - window.innerHeight / 2
        }
    }

    function getStates(): CanvasStates{
        return {
            drawableList: drawableList,
            svgDrawableList: svgDrawableList,
            canvasSize: canvasSize,
            draggingDrawable: draggingDrawable,
            originNode: originNode.current
        }
    }

    function connectNode(origin: Node){
        originNode.current = origin
        CanvasEventEmitter.publish(CanvasEvents.connectNodeEvent, {context: origin})
    }

    function stopConnectNode(){
        originNode.current = null
    }

    function deleteNode(node: Node): void{
        setDrawableList(drawableList.filter((d) => d.id !== node.id))
        // 从把要删除的顶点中的直线作为终点的顶点中删除直线
        node.lines.start.forEach((l) => {
            l.end.removeEndLine(l)
        })
        node.lines.end.forEach(l => {
            l.start.removeStartLine(l)
        })
        // 删除与该顶点关联的直线
        setSvgDrawableList(svgDrawableList.filter(s => {
            if(s instanceof Line){
                console.log(node.lines.start.includes(s))
                const result = !node.lines.start.includes(s) && !node.lines.end.includes(s)
                return result
            }
        }))
        CanvasEventEmitter.publish(CanvasEvents.removeNodeEvent, {context: node})
    }

    function clearCanvas(){
        setDrawableList([])
        setSvgDrawableList([])
        setDraggingDrawable(null)
        // 重置id迭代器
        IdGenerator.reset()
        originNode.current = null
    }

    // function startDij(){
    //     CanvasEventEmitter.publish<StartDijEvent>(CanvasEvents.startDijEvent)
    //     setDij(true)
    // }

    // function endDij(){
    //     CanvasEventEmitter.publish<EndDijEvent>(CanvasEvents.endDijEvent)
    //     setDij(false)
    // }

    function updateNodeOuterStyle(id: number, data: any){
        console.log("更新")
        setDrawableList(drawableList.map(d => {
            if(d.id == id){
                d.outerStyle = data
            }
            return d
        }))
    }

    function updateLineOuterStyle(id: string, data: any){
        setSvgDrawableList(svgDrawableList.map(l => {
            if(l.id == id && l instanceof Line){
                l.outerStyle = data
            }
            return l
        }))
    }

    function updateNodeFloatingText(id: number, text: string) {
        setDrawableList(drawableList.map(d => {
            if(d.id == id && d instanceof Node){
                d.floatingText = text
            }
            return d
        }))
    }

    /// 向外界暴露绘图API
    useImperativeHandle(ref, ()=>{
        return {
            draw,
            drawNode,
            drawNodes,
            translateMousePosition,
            drawLine,
            drawLines,
            connectNode,
            getStates,
            stopConnectNode,
            deleteNode,
            clearCanvas,
            // startDij,
            // endDij
            updateNodeOuterStyle,
            updateLineOuterStyle,
            updateNodeFloatingText
        }
    })

    useEffect(()=>{
        // 初始化窗口尺寸
        setCanvasSize({
            width: window.innerWidth,
            height: window.innerHeight
        }) 
        const onUpdateWindowSize = ()=>{
            setCanvasSize({
                width: window.innerWidth,
                height: window.innerHeight
            })
        }
        const onDijChange = () => {
            setDij(DijController.dij)
        }
        
        // 更新窗口尺寸
        window.addEventListener("resize", onUpdateWindowSize)
        // 监听算法模拟控制器
        DijController.addListener(onDijChange)
        
        return () => {
            window.removeEventListener("resize", onUpdateWindowSize)
            DijController.removeListener(onDijChange)
        }
    }, [])

    return <div className={style.infiniteBackground} onClickCapture={onClickCanvas} ref={canvasRef}>
        {
            // 画布中心点(不可见)
        }
        <div className={style.centerPoint}>
            {drawableElementList}
            <svg className={style.svgCanvas}>
                <g className={style.svgOriginPoint}>
                    {svgDrawableElementList}
                </g>
            </svg>
        </div>
    </div>
}


