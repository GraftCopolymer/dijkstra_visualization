'use client'

import { JSX, RefObject, useEffect, useImperativeHandle, useRef, useState } from "react"
import { InfiniteCanvasAPI } from "./infinite_canvas"
import GraphUtils from "../_utils/graph_utils"
import Node, { NodeBuilder } from "../_canvas/node/node"
import style from './page.module.css'
import DarkButton from "../_widgets/dark_button/dark_button"
import { PlusOutlined, RightOutlined } from "@ant-design/icons"

export interface ControlPanelAPI{
    /// 展示指定的Node对象的信息
    displayNode: (node: Node) => void
}

function NodeDetail({node}: {node: Node}){
    const [data, setData] = useState({
        position: {x: node.position.x, y: node.position.y}
    })

    useEffect(()=>{
        console.log("JHHHHH")
        setData({
            position: {x: node.position.x, y: node.position.y}
        })
    }, [node.position.x, node.position.y])

    return <div>
        <p>坐标</p>
        <p>[{data.position.x}, {data.position.y}]</p>
    </div>
}

/// 悬浮式控制面板
export default function ControlPanel({
    canvasRef,
    panelAPIRef
}: {
    canvasRef: RefObject<InfiniteCanvasAPI | null>,
    panelAPIRef?: RefObject<ControlPanelAPI | null>
}){
    // 控制面板尺寸
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const [titleBarHeight, setTitleHeight] = useState(0)
    // 拖拽相关的状态
    const [isDragging, setIsDragging] = useState(false)
    const [position, setPosition] = useState({x: 30, y: 90})
    // 是否处于缩小状态
    const [minimize, setMinimize] = useState(false)
    // 鼠标位置和面板(left, top)的偏移
    const offset = useRef({x: 0, y: 0})

    const panelRef = useRef<HTMLDivElement>(null)
    const panelTransition = useRef('none')

    /// 控制面板显示的内容
    const panelContents = useRef<{ [key: string]: (() => JSX.Element) | JSX.Element}>({
        'default': () => {
            return createControlItem(
                "创建结点",
                <>
                    <DarkButton onClick={createNode}>
                        快速创建 <PlusOutlined />
                    </DarkButton>
                </>
            )
        },
        'node': () => {
            return <div></div>
        }
    })
    /// 控制面板当前显示的内容
    const [currentContent, setCurrentContent] = useState('default')

    useEffect(()=>{
        if(panelRef.current){
            // 初始化控制面板尺寸
            const style = getComputedStyle(panelRef.current)
            setWidth(parseInt(style.width.slice(0,style.width.indexOf('px'))))
            setHeight(parseInt(style.height.slice(0,style.height.indexOf('px'))))
            setTitleHeight(
                GraphUtils.getTitleBarHeight()
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
        if(panelRef.current){
            const styles = getComputedStyle(panelRef.current)
            // 保存现有的过渡效果
            panelTransition.current = styles.transition
            // 取消组件的过渡效果，防止拖动延迟
            panelRef.current.style.transition = "none"
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
        if(panelRef.current){
            // 恢复过渡效果
            panelRef.current.style.transition = panelTransition.current
        }
        // 恢复文本选择
        document.body.style.userSelect = ''
    }

    /// 缩小控制面板
    function toggleMinimize(){
        setMinimize(!minimize)
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

    /// 控制面板API
    function displayNode(node: Node){
        console.log(node)
        panelContents.current['node'] = ()=>{
            return <NodeDetail node={node}></NodeDetail>
        }
        setCurrentContent('node')
    }

    useImperativeHandle(panelAPIRef, ()=>{
        return {
            displayNode
        }
    })
    
    if(minimize){
        return <div className={style.minimizedControlPanel} onClick={toggleMinimize}>
            <RightOutlined />
        </div>
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
            {/* 缩小按钮 */}
            <div className={style.minimizeButton} onClick={toggleMinimize}>
            </div>
            控制面板
        </div>
        <div>
            {
                panelContents.current[currentContent] instanceof Function ? panelContents.current[currentContent]() : panelContents.current[currentContent]
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
