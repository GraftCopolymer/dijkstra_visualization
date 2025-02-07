'use client'
import { JSX, MouseEventHandler, Ref, RefObject, useEffect, useImperativeHandle, useReducer, useRef, useState } from 'react'
import Drawable from '../_canvas/drawable'
import style from './page.module.css'
import { useImmer } from 'use-immer'
import DarkButton from '../_widgets/dark_button/dark_button'
import { PlusOutlined, WindowsOutlined } from '@ant-design/icons'
import Node, { NodeBuilder } from '../_canvas/node/node'
import SvgDrawable from '../_canvas/svg_drawable'
import Line from '../_canvas/line/line'
import CanvasEventEmitter, { CanvasEvents } from '../_canvas/events'

export interface InfiniteCanvasAPI{
    draw: (drawable: Drawable) => void
    drawNode: (node: Node) => void
    /// 将鼠标坐标变换为以屏幕中心点为原点的坐标
    translateMousePosition: (pos: Coordinate) => Coordinate
    /// 绘制直线
    drawLine: (line: Line) => void
    getDrawable: () => Drawable[]
    // modifyColor: (action: ColorAction) => void
}

function getTitleBarHeight(): number{
    const rootStyle = getComputedStyle(document.documentElement)
    return parseInt(
        rootStyle.getPropertyValue('--titleBarHeight')
        .slice(0,rootStyle.getPropertyValue('--titleBarHeight').indexOf('px'))
    )
    +
    parseInt(
        rootStyle.getPropertyValue('--titleBarPadding')
        .slice(0, rootStyle.getPropertyValue('--titleBarPadding').indexOf('px'))
    ) 
}

export default function InfiniteCanvas({ref}: {ref?: Ref<InfiniteCanvasAPI>}){
    const [drawableList, setDrawableList] = useState([] as Drawable[])
    const [svgDrawableList, setSvgDrawableLIst] = useState([] as SvgDrawable[])
    const drawableElementList = drawableList.map((d) => {
        const renderObj = <div onMouseDown={(e: any) => {onDragDrawable(e, d)}} key={d.getId()} style={{
            position: "absolute",
        }}>
            {d.getJSXElement()}
        </div>
        return renderObj
    })
    // 画布尺寸
    const [canvasSize, setCanvasSize] = useState({width: 0, height: 0} as {width: number, height: number})

    const svgDrawableElementList = svgDrawableList.map((s) => {
        const renderObj = <g>
            {s.getJSXElement()}
        </g>
        return renderObj
    })

    // 当前被拖动的Drawable对象，若为null则没有被拖动的对象
    const [draggingDrawable, setDraggingDrawable] = useState<Drawable | null>(null)
    const draggingOffset = useRef({x: 0, y: 0})

    function onDragDrawable(e: any, drawable: Drawable){
        e.stopPropagation()
        setDraggingDrawable(drawable)
        // 将鼠标坐标变换到以屏幕中心点为原点的坐标系
        const translated = translateMousePosition({
            x: e.clientX,
            y: e.clientY
        })
        // 计算鼠标与坐标的偏移
        draggingOffset.current = {
            x: translated.x - drawable.getPosition().x,
            y: translated.y - drawable.getPosition().y
        }
        // 禁止选择文本
        document.body.style.userSelect = 'none'
    }

    function onDraggingDrawable(e: any){
        if(!draggingDrawable) return
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

    function onStopDragging(e: any){
        e.stopPropagation()
        setDraggingDrawable(null)
        document.body.style.userSelect = ''
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

    function drawLine(line: Line){
        setSvgDrawableLIst([
            ...svgDrawableList,
            line
        ])
    }

    function translateMousePosition(pos: Coordinate): Coordinate{
        return {
            x: pos.x - window.innerWidth / 2,
            y: pos.y - window.innerHeight / 2
        }
    }

    function getDrawable(){
        return drawableList
    }

    /// 向外界暴露绘图API
    useImperativeHandle(ref, ()=>{
        return {
            draw,
            drawNode,
            translateMousePosition,
            getDrawable,
            drawLine
        }
    })

    useEffect(()=>{
        // 初始化窗口尺寸
        setCanvasSize({
            width: window.innerWidth,
            height: window.innerHeight - getTitleBarHeight()
        }) 
        // 更新窗口尺寸
        window.addEventListener("resize", ()=>{
            setCanvasSize({
                width: window.innerWidth,
                height: window.innerHeight - getTitleBarHeight()
            })
        })
    }, [])

    return <div className={style.infiniteBackground}>
        
        {
            // 画布中心点(不可见)
        }
        <div className={style.centerPoint}>
            {drawableElementList}
            <svg className={style.svgCanvas}>
                <g className={style.svgOriginPoint}>
                    <path d="M 30 100 L 170 100" strokeWidth="40px" stroke="#948134" strokeLinecap="round"/>
                    <circle cx="100" cy="100" r="50" fill="blue" stroke="black" strokeWidth="2" />
                    <circle cx="0px" cy="0px" r="50" fill="blue" stroke="black" strokeWidth="2" />
                    {svgDrawableElementList}
                </g>
            </svg>
        </div>
    </div>
}

/// 悬浮式控制面板
export function ControlPanel({
    canvasRef,
}: {
    canvasRef: RefObject<InfiniteCanvasAPI | null>,
}){
    // 控制面板尺寸
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const [titleBarHeight, setTitleHeight] = useState(0)
    // 拖拽相关的状态
    const [isDragging, setIsDragging] = useState(false)
    const [position, setPosition] = useState({x: 30, y: 90})
    // 鼠标位置和面板(left, top)的偏移
    const offset = useRef({x: 0, y: 0})

    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(()=>{
        if(panelRef.current){
            // 初始化控制面板尺寸
            const style = getComputedStyle(panelRef.current)
            setWidth(parseInt(style.width.slice(0,style.width.indexOf('px'))))
            setHeight(parseInt(style.height.slice(0,style.height.indexOf('px'))))
            setTitleHeight(
                getTitleBarHeight()
            )
        }
    }, [])

    function handleMouseDown(e: any){
        e.stopPropagation()
        setIsDragging(true)
        offset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        }
        // 禁止选择文本
        document.body.style.userSelect = 'none'
    }

    function handleMouseMove(e: any){
        e.stopPropagation()
        if(!isDragging){
            return
        }
        // 禁止将对话框拖动到屏幕之外
        let newX = e.clientX - offset.current.x
        let newY = e.clientY - offset.current.y
        if(newX + width >= window.innerWidth){
            newX = window.innerWidth - width
        }
        if(newX <= 0){
            newX = 0
        }
        if(newY + height >= window.innerHeight){
            newY = window.innerHeight - height
        }
        if(newY <= titleBarHeight){
            newY = titleBarHeight
        }

        setPosition({
            x: newX,
            y: newY
        })
    }

    function handleMouseUp(e: any){
        e.stopPropagation()
        setIsDragging(false)
        // 恢复文本选择
        document.body.style.userSelect = ''
    }

    // 使用 useEffect 在组件挂载和卸载时处理事件监听
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            // 清理事件监听器
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    /// 绘制相关
    /// 在画板中心生成一个结点
    function createNode(){
        const node = new NodeBuilder()
            .position({x: 0, y: 0})
            .radius(90)
            .color("red")
            .build()
        canvasRef.current!.drawNode(node)
    }

    return <div 
    className={style.controlPanel}
    style={{
        left: `${position.x}px`,
        top: `${position.y}px`
    }}
    ref={panelRef}>
        <div 
        className={style.panelTitle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}>
            <div className={style.minimizeButton}>
            </div>
            控制面板
        </div>
        <div>
            {
                createControlItem(
                    "创建结点",
                    <>
                        <DarkButton onClick={createNode}>
                            快速创建 <PlusOutlined />
                        </DarkButton>
                    </>
                )
            }
        </div>
    </div>
}

/// 创建控制项
function createControlItem(title: string, child: JSX.Element): JSX.Element{
    return <div className={style.controlItemContainer}>
        <p className={style.controlItemTitle}>
            {title}
        </p>
        <div>
            {child}
        </div>
    </div>
}

