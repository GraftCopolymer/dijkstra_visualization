'use client'

import { JSX, RefObject, useEffect, useImperativeHandle, useRef, useState } from "react"
import { InfiniteCanvasAPI } from "./infinite_canvas"
import GraphUtils from "../_utils/graph_utils"
import Node, { NodeBuilder } from "../_canvas/node/node"
import style from './page.module.css'
import nodeDetailStyle from './node_detail.module.css'
import DarkButton from "../_widgets/dark_button/dark_button"
import { ArrowLeftOutlined, PlusOutlined, RightOutlined } from "@ant-design/icons"
import CanvasEventEmitter, { CanvasEvents, RemoveNodeEvent } from "../_canvas/events"

export interface ControlPanelAPI{
    /// 展示指定的Node对象的信息
    displayNode: (node: Node) => void
    displayDefault: () => void
    /// 正在选择另一顶点
    startSelectingNode: (node: Node) => void
    /// 结束另一顶点的选择
    endSelectNode: () => void
    /// 根据传入的二维数组生成有向图
    genDirectedMap: (matrix: [][]) => void
}

/// 展示结点详细信息的组件
/// 还可以对结点进行一些特定的操作
function NodeDetail(
    {node, canvasRef, panelAPIRef , onClick}: 
    {
        node: Node,
        canvasRef: RefObject<InfiniteCanvasAPI | null>, 
        panelAPIRef: RefObject<ControlPanelAPI | null> ,
        onClick?: () => void
    }
){
    const [position, setPosition] = useState(node.position)
    const [id, setId] = useState(node.id)
    const [selectingNode, setSelectingNode] = useState(false)

    useEffect(()=>{
        const onUpdateNode = ()=>{
            setPosition({
                x: node.position.x,
                y: node.position.y
            })
            setId(node.id)
        }
        const onRemoveNode = (context: RemoveNodeEvent) => {
            if(context.context.id === node.id){
                if(panelAPIRef.current){
                    panelAPIRef.current.displayDefault()
                }
            }
        }

        node.addListener(onUpdateNode)
        CanvasEventEmitter.subscribe<RemoveNodeEvent>(CanvasEvents.removeNodeEvent, onRemoveNode)

        return () => {
            CanvasEventEmitter.unsubscribe<RemoveNodeEvent>(CanvasEvents.removeNodeEvent, onRemoveNode)
            node.removeListener(onUpdateNode)
        }
    }, [node])
    

    function onConnectNode(e: any){
        setSelectingNode(true)
        if(!canvasRef.current || !panelAPIRef.current) return
        panelAPIRef.current.startSelectingNode(node)
        canvasRef.current.connectNode(node)
    }

    function onCancelSelect(e: any){
        setSelectingNode(false)
        if(!panelAPIRef.current || !canvasRef.current) return 
        panelAPIRef.current.endSelectNode()
        canvasRef.current.stopConnectNode()
    }

    function onDeleteNode(e: any){
        if(!canvasRef.current || !panelAPIRef.current) return
        canvasRef.current.deleteNode(node)
    }

    return <div>
        <ArrowLeftOutlined 
        onClick={onClick}
        className={nodeDetailStyle.backButton} />
        {
            createControlItem(`结点id`, <p style={{
                fontWeight: "bold",
                margin: "5px"
            }}>
                {id}
            </p>)
        }
        {
            createControlItem("坐标", <p style={{
                fontWeight: "bold",
                margin: "5px"
            }}>
                ({position.x}, {position.y})
            </p>)
        }
        {
            createControlItem("操作", <div>
                {selectingNode ? <p>
                    请点击另一顶点
                    <DarkButton onClick={onCancelSelect}>
                        结束连接
                    </DarkButton>
                </p> : <DarkButton onClick={onConnectNode}>
                    连接另一顶点
                </DarkButton>}
                {
                    selectingNode ? <div></div> :
                    <DarkButton onClick={onDeleteNode}>删除该顶点</DarkButton>
                }
            </div>)
        }
        
    </div>
}

/// 悬浮式控制面板
export default function ControlPanel({
    canvasRef,
    panelAPIRef
}: {
    canvasRef: RefObject<InfiniteCanvasAPI | null>,
    panelAPIRef: RefObject<ControlPanelAPI | null>
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
    // 是否正在选择另一顶点
    const [originNode, setOriginNode] = useState<Node | null>(null)
    // 鼠标位置和面板(left, top)的偏移
    const offset = useRef({x: 0, y: 0})

    const panelRef = useRef<HTMLDivElement>(null)
    const panelTransition = useRef('none')

    /// 控制面板显示的内容
    const panelContents = useRef<{ [key: string]: (() => JSX.Element) | JSX.Element}>({
        'default': () => {
            return <div>
                {createControlItem(
                    "创建结点",
                    <>
                        <DarkButton onClick={createNode}>
                            快速创建 <PlusOutlined />
                        </DarkButton>
                        <DarkButton onClick={createNode}>
                            生成随机有向图 
                        </DarkButton>
                    </>
                )}
            </div>
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
            .radius(50)
            .color("red")
            .build()
        canvasRef.current!.drawNode(node)
    }

    /// 控制面板API
    function displayNode(node: Node){
        panelContents.current['node'] = ()=>{
            return <NodeDetail node={node} canvasRef={canvasRef} panelAPIRef={panelAPIRef} onClick={() => displayDefault()}></NodeDetail>
        }
        setCurrentContent('node')
    }

    function displayDefault(){
        // 正在选择另一顶点时不能恢复默认显示页面
        if(originNode) return
        setCurrentContent('default')
    }

    function startSelectingNode(node: Node){
        setOriginNode(node)
    }

    function endSelectNode(){
        setOriginNode(null)
    }

    function genDirectedMap(matrix: [][]){
        if(matrix[0].length != matrix.length){
            throw "Invalid adjacency matrix"
        }
        
    }

    useImperativeHandle(panelAPIRef, ()=>{
        return {
            displayNode,
            displayDefault,
            startSelectingNode,
            endSelectNode,
            genDirectedMap
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
