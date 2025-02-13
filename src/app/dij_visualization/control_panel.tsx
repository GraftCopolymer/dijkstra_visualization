'use client'

import { JSX, RefObject, useEffect, useImperativeHandle, useRef, useState } from "react"
import { DijCanvasAPI } from "./dij_canvas"
import Utils from "../_utils/utils"
import Node, { NodeBuilder } from "../_canvas/node/node"
import style from './page.module.css'
import nodeDetailStyle from './node_detail.module.css'
import DarkButton from "../_widgets/dark_button/dark_button"
import { ArrowLeftOutlined, PlusOutlined, RightOutlined } from "@ant-design/icons"
import CanvasEventEmitter, { CanvasEvents, RemoveNodeEvent, StopDijEvent } from "../_canvas/events"
import IdGenerator from "../_canvas/id_generator"
import Line, { LineBuilder } from "../_canvas/line/line"
import { DijAlgorithm } from "../_utils/algorithm"
import { DijController, Status } from "../_canvas/dij_controller"
import DarkInput from "../_widgets/dark_input/dark_input"

export interface ControlPanelAPI{
    /// 展示指定的Node对象的信息
    displayNode: (node: Node) => void
    displayDefault: () => void
    /// 正在选择另一顶点
    startSelectingNode: (node: Node) => void
    /// 结束另一顶点的选择
    endSelectNode: () => void
    /// 根据传入的二维数组生成有向图
    genRandomDirectedMap: (minNodes: number, maxNodes: number, minWeight: number, maxWeight: number) => void
}

/// 展示结点详细信息的组件
/// 还可以对结点进行一些特定的操作
function NodeDetail(
    {node, canvasRef, panelAPIRef , onBack}: 
    {
        node: Node,
        canvasRef: RefObject<DijCanvasAPI | null>, 
        panelAPIRef: RefObject<ControlPanelAPI | null> ,
        onBack?: () => void,
    }
){
    const [position, setPosition] = useState(node.position)
    const [id, setId] = useState(node.id)
    const [selectingNode, setSelectingNode] = useState(false)
    const [dijing, setDijing] = useState(DijController.dij)
    // 每步时间间隔
    const [stepInterval, setStepInterval] = useState(DijController.stepInterval)
    const lastStepInterval = useRef(stepInterval)
    // 算法进行状态
    const [status, setStatus] = useState<Status>(DijController.status)

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
        const onDijChange = async () => {
            setStatus(DijController.status)
            if(!DijController.dij || DijController.status == Status.success) {
                console.log([DijController.dij, DijController.status])
                return
            }
            setDijing(DijController.dij)
            const {adjacencyMatrix, adjacencyList, nodeMap, indexMap} = DijAlgorithm.computeAdjacencyStructures(node)
            await DijAlgorithm.dijWithAdMatrix(node, adjacencyMatrix, nodeMap, indexMap, canvasRef)
        }

        node.addListener(onUpdateNode)
        CanvasEventEmitter.subscribe<RemoveNodeEvent>(CanvasEvents.removeNodeEvent, onRemoveNode)
        DijController.addListener(onDijChange)
        return () => {
            CanvasEventEmitter.unsubscribe<RemoveNodeEvent>(CanvasEvents.removeNodeEvent, onRemoveNode)
            DijController.removeListener(onDijChange)
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

    function onStartDij(){
        setDijing(true)
        DijController.dij = true
    }

    function onEndDij(){
        setDijing(false)
        CanvasEventEmitter.publish<StopDijEvent>(CanvasEvents.stopDijEvent, {context: {}})
        // 恢复结点状态
        if(!canvasRef.current) return
        // 获取所有Node对象
        const nodes = canvasRef.current!.getStates().drawableList.map(d => {
            if(d instanceof Node){
                return d
            }
        })
        nodes.forEach(d => {
            d!.outerStyle = {
                transition: '',
                backgroundColor: d!.color
            }
            d!.floatingText = ""
        })
        // 恢复直线状态
        const lines = canvasRef.current!.getStates().svgDrawableList.map(s => {
            if(s instanceof Line){
                return s
            }
        })
        lines.forEach(l => {
            l!.outerStyle = {
                ...l!.outerStyle,
                fill: "white",
                stroke: "white",
                transition: ""
            }
        })
        DijController.dij = false
    }

    function handleStepIntervalInput(e: any){
        setStepInterval(e.target.value)
    }

    function handleBlur(e: any){
        // 校验数据合法性
        const number = parseFloat(e.target.value)
        if(Number.isNaN(number) || e.target.value === "" || number < 0) {
            setStepInterval(lastStepInterval.current)
        }
        else{
            DijController.stepInterval = number
            lastStepInterval.current = number
        }
    }

    return dijing ? <div>
            <DarkButton onClick={() => {onEndDij()}}>
                停止可视化
            </DarkButton>
            {status == Status.running ? <p>算法进行中...</p> : (status == Status.success ? <p>算法执行完毕, 将鼠标置于节点上即可查看最短路径</p> : <p>算法中断</p>)}
        </div>  : <div>
        <ArrowLeftOutlined 
        onClick={onBack}
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
        {
            createControlItem("模拟", <div>
                <span>每步时间间隔: </span><DarkInput onInput={handleStepIntervalInput} onBlur={handleBlur} value={stepInterval}/><span>秒</span>
                <DarkButton style={{
                    display: "block"
                }} onClick={() => {onStartDij()}}>从该点开始迪杰斯特拉算法</DarkButton>
            </div>)
        }
    </div>
            
}

/// 悬浮式控制面板
export default function ControlPanel({
    canvasRef,
    panelAPIRef
}: {
    canvasRef: RefObject<DijCanvasAPI | null>,
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
    // 是否正在进行算法可视化
    const [dijing, setDijing] = useState(false)
    // 是否正在选择另一顶点
    const originNode = useRef<Node | null>(null)
    // 鼠标位置和面板(left, top)的偏移
    const offset = useRef({x: 0, y: 0})

    const panelRef = useRef<HTMLDivElement>(null)
    const panelTransition = useRef('none')

    /// 控制面板显示的内容
    const panelContents = useRef<{ [key: string]: (() => JSX.Element) | JSX.Element}>({
        'default': () => {
            return <div>
                {createControlItem(
                    "创建",
                    <>
                        <DarkButton onClick={createNode}>
                            创建结点 <PlusOutlined />
                        </DarkButton>
                        <DarkButton onClick={() => genRandomDirectedMap()}>
                            生成随机有向图 
                        </DarkButton>
                    </>
                )}
                {
                    createControlItem("画布操作", <>
                        <DarkButton onClick={() => canvasRef.current?.clearCanvas()}>
                            清空画布
                        </DarkButton>
                    </>)
                }
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
                Utils.getTitleBarHeight()
            )
        }

        const onDijChange = () => {
            setDijing(DijController.dij)
        }
        DijController.addListener(onDijChange)

        return () => {
            DijController.removeListener(onDijChange)
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
    function toggleMinimize(e: React.MouseEvent){
        e.stopPropagation(); // 阻止事件冒泡
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
            .radius(25)
            .color("red")
            .build()
        canvasRef.current!.drawNode(node)
    }

    /// 控制面板API
    function displayNode(node: Node){
        panelContents.current['node'] = ()=>{
            return <NodeDetail 
            node={node} 
            canvasRef={canvasRef} 
            panelAPIRef={panelAPIRef} 
            onBack={() => displayDefault()}></NodeDetail>
        }
        setCurrentContent('node')
    }

    function displayDefault(){
        // 正在选择另一顶点时不能恢复默认显示页面
        if(originNode.current || dijing) return
        setCurrentContent('default')
    }

    function startSelectingNode(node: Node){
        originNode.current = node
    }

    function endSelectNode(){
        originNode.current = null
    }

    // 生成随机邻接矩阵
    function generateRandomAdjMatrix(size: number, density = 0.5, minWeight: number, maxWeight: number) {
        let adMatrix = Array.from({ length: size }, () => Array(size).fill(-1));
        let edgeCount = Math.floor(density * size * (size - 1));
        let edges = new Set();
        
        while (edges.size < edgeCount) {
            let i = Math.floor(Math.random() * size);
            let j = Math.floor(Math.random() * size);
            
            if (i !== j && !edges.has(`${i},${j}`) && !edges.has(`${j},${i}`)) {
                adMatrix[i][j] = Utils.random(minWeight, maxWeight);
                edges.add(`${i},${j}`);
            }
        }
        
        // 确保没有孤立点
        for (let i = 0; i < size; i++) {
            // 如果该节点没有任何边
            if (!adMatrix[i].some(val => val !== -1)) {
                // 随机选择一个未连接的节点，避免平行边
                let possibleConnections = [];
                for (let j = 0; j < size; j++) {
                    if (i !== j && !edges.has(`${i},${j}`) && !edges.has(`${j},${i}`)) {
                        possibleConnections.push(j);
                    }
                }
                if (possibleConnections.length > 0) {
                    // 随机选择一个节点进行连接
                    let randIndex = possibleConnections[Math.floor(Math.random() * possibleConnections.length)];
                    let weight = Utils.random(minWeight, maxWeight);
                    adMatrix[i][randIndex] = weight;
                    edges.add(`${i},${randIndex}`);
                }
            }
        }
        return adMatrix;
    }

    function genRandomDirectedMap(minNodes: number = 4, maxNodes: number = 8, minWeight: number = 20, maxWeight: number = 100){
        if(!canvasRef.current) return 
        // 清空画布
        canvasRef.current.clearCanvas()
        IdGenerator.reset()
        const nodeNumber = Utils.random(minNodes, maxNodes)
        
        const adMatrix = generateRandomAdjMatrix(nodeNumber, 0.1, minWeight, maxWeight)

        // 根据邻接矩阵生成图
        // 生成所有的结点
        const radius = 50
        const canvasSize = canvasRef.current.getStates().canvasSize
        const nodes: Node[] = []
        const lines: Line[] = []
        for(let i = 0; i < nodeNumber; i++){
            nodes.push(
                new NodeBuilder()
                .position({x: Utils.random( -canvasSize.width / 2 + radius * 2, canvasSize.width / 2 - radius * 2), y: Utils.random(-canvasSize.height / 2 + radius * 2, canvasSize.height / 2 - radius * 2)})
                .radius(25)
                .build()
            )
        }
        for(let row = 0; row < nodeNumber; row++){
            for(let column = 0; column < nodeNumber; column++){
                if(adMatrix[row][column] !== -1){
                    lines.push(new LineBuilder(nodes[column], nodes[row]).weight(adMatrix[row][column]).build())
                }
            }
        }
        canvasRef.current.drawNodes(nodes)
        canvasRef.current.drawLines(lines)
    }

    useImperativeHandle(panelAPIRef, ()=>{
        return {
            displayNode,
            displayDefault,
            startSelectingNode,
            endSelectNode,
            genRandomDirectedMap
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
