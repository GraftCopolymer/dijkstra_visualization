import { RefObject } from "react";
import Node from "../_canvas/node/node";
import { DijCanvasAPI } from "../dij_visualization/dij_canvas";
import { DijController, Status } from "../_canvas/dij_controller";
import Line from "../_canvas/line/line";
import CanvasEventEmitter, { CanvasEvents, StopDijEvent } from "../_canvas/events";

export class DijNode{
    public index: number
    public node: Node

    constructor(i: number, node: Node){
        this.index = i
        this.node = node
    }
}

export class DijAlgorithm{
    /// 暂停指定时间，单位为毫秒
    private static pause(duration: number) {
        return new Promise(resolve => {
            if(!DijController.dij){
                resolve(null)
            }
            const timer = setTimeout(resolve, duration)
            const onStopDij = (context: StopDijEvent) => {
                CanvasEventEmitter.unsubscribe<StopDijEvent>(CanvasEvents.stopDijEvent, onStopDij)
                clearTimeout(timer)
                resolve(null)
            }
            CanvasEventEmitter.subscribe<StopDijEvent>(CanvasEvents.stopDijEvent, onStopDij)
        });
    }

    /// 使用邻接矩阵的迪杰斯特拉算法
    static async dijWithAdMatrix(
        startNode: Node,
        matrix: number[][],
        nodeMap: Map<Node, number>,
        indexMap: Map<number, Node>,
        canvasRef: RefObject<DijCanvasAPI | null>
    ): Promise<{ distanceFromOrigin: Map<number, number>; shortestPaths: Map<Node, Line[]>; } | undefined> {
        if(!canvasRef.current) return
        // 获取所有Node对象
        const nodes = canvasRef.current!.getStates().drawableList.map(d => {
            if(d instanceof Node){
                return d
            }
        })
        const lines = canvasRef.current!.getStates().svgDrawableList.map(l => {
            if(l instanceof Line){
                return l
            }
        })


        const n = matrix.length;
        const startIndex = nodeMap.get(startNode)!;
        
        // 使用数组存储距离（索引对应节点顺序）
        const distances: number[] = new Array(n).fill(Infinity);
        const visited: boolean[] = new Array(n).fill(false);
        const predecessor: number[] = new Array(n).fill(-1);
        
        // 优先队列（[distance, nodeIndex]）
        const priorityQueue: [number, number][] = [];

        // 初始化起点
        distances[startIndex] = 0;
        predecessor[startIndex] = -1;
        priorityQueue.push([0, startIndex]);

        nodes.forEach(d => {
            if(d !== startNode){
                d!.outerStyle = {
                    ...d!.outerStyle,
                    transition: `all ${DijController.stepInterval}s`,
                    backgroundColor: "rgba(123, 123, 123, 0.8)"
                }
                d!.floatingText = `${distances[nodeMap.get(d!)!] || Infinity}`
            }
            else{
                // 高亮起点
                d!.outerStyle = {
                    ...d!.outerStyle,
                    transition: `all ${DijController.stepInterval}s`,
                    backgroundColor: DijController.startNodeColor
                }
                d!.floatingText = ''
            }
        })

        lines.forEach(l => {
            l!.outerStyle = {
                transition: `stroke ${DijController.stepInterval / 2}s, fill ${DijController.stepInterval / 2}s`
            }
            l!.color = DijController.defaultColor
        })

        await DijAlgorithm.pause(DijController.stepInterval * 1000)
        
        while (priorityQueue.length > 0 && DijController.dij) {
            // 按距离排序获取最小元素
            priorityQueue.sort((a, b) => a[0] - b[0]);
            const [currentDist, uIndex] = priorityQueue.shift()!;
            
            // 如果已经处理过则跳过
            if (visited[uIndex]) continue;
            const currentNode = indexMap.get(uIndex)
            visited[uIndex] = true;
            
            // 遍历所有邻接节点
            for (let vIndex = 0; vIndex < n; vIndex++) {
                const edgeWeight = matrix[uIndex][vIndex];
                const curEndNode = indexMap.get(vIndex)

                // 跳过不存在的边（假设-1表示不可达）
                if (edgeWeight === -1) {
                    continue
                }

                // 计算新距离
                const newDist = currentDist + edgeWeight;
                
                // 发现更短路径时更新
                if (newDist < distances[vIndex]) {
                    // 寻找目标边对象
                    const curLine = currentNode!.lines.start.find(l => l.end!.id === curEndNode!.id)
                    if(DijController.dij) canvasRef.current!.updateLineOuterStyle(curLine!.id, {
                        ...curLine!.outerStyle,
                        stroke: DijController.selectedColor,
                        fill: DijController.selectedColor
                    })
                    console.log(`已更新直线颜色, 权重: ${curLine!.weight}`)
                    await DijAlgorithm.pause(DijController.stepInterval * 1000)
                    if(DijController.dij) canvasRef.current!.updateNodeFloatingText(curEndNode!.id, `${newDist}`)
                    if(DijController.dij) canvasRef.current?.updateNodeOuterStyle(curEndNode!.id, {
                        ...curEndNode!.outerStyle,
                        backgroundColor: DijController.selectedColor
                    })
                    await DijAlgorithm.pause(DijController.stepInterval * 1000)

                    distances[vIndex] = newDist;
                    predecessor[vIndex] = uIndex;
                    priorityQueue.push([newDist, vIndex]);
                }
            }
        }
        
        // 转换结果为Map格式
        const distanceFromOrigin = new Map<number, number>();
        distances.forEach((dist, index) => {
            distanceFromOrigin.set(indexMap.get(index)!.id, dist);
        });
        // target node -> the node's shortest path(from origin node, including the node's self)
        const shortestPaths = new Map<Node, Line[]>()
        for(let i = 0; i < n; i++){
            const path: Line[] = []
            let targetNode: Node = indexMap.get(i)!
            // 初始为需要求得最短路径的点本身
            let curNode: Node = targetNode
            let preIndex = i
            // 还没走到起点
            while(predecessor[preIndex] !== -1){
                const preNode: Node = indexMap.get(predecessor[preIndex])!
                // 找到连接边
                const line: Line = preNode.lines.start.find(l => l.end.id === curNode.id)!
                path.push(line)
                curNode = preNode
                preIndex = predecessor[preIndex]
            }
            shortestPaths.set(targetNode, path)
        }

        // 将最终结果保存到算法控制器中
        if(priorityQueue.length != 0){
            DijController.status = Status.interrupted
            console.log("算法被终止")
        }
        else{
            DijController.status = Status.success
            DijController.distances = distanceFromOrigin
            DijController.shortestPaths = shortestPaths
            console.log("算法成功结束, 最短距离表如下: ")
            console.log(distanceFromOrigin)
            console.log(shortestPaths)
            return { distanceFromOrigin, shortestPaths }
        }
    }

    /// 使用邻接链表的迪杰斯特拉算法
    static dijWithAdLinkedList(){

    }

    static getConnectedComponent(startNode: Node): Node[] {
        const visited = new Set<Node>();
        const queue: Node[] = [startNode];
        visited.add(startNode);

        while (queue.length > 0) {
            const current = queue.shift()!;

            // 处理出边（当前节点作为起点的边）
            for (const line of current.lines.start) {
                const neighbor = line.end;
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }

            // 处理入边（当前节点作为终点的边）
            for (const line of current.lines.end) {
                const neighbor = line.start;
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        return Array.from(visited);
    }

    static createNodeIndexMap(nodes: Node[]): {nodeMap: Map<Node, number>, indexMap: Map<number, Node>} {
        const nodeMap = new Map<Node, number>();
        const indexMap = new Map<number, Node>()
        // 根据id排序，防止顺序不一致
        // nodes.sort((a, b) => a.id - b.id)
        nodes.forEach((node, index) => {
            nodeMap.set(node, index)
            indexMap.set(index, node)
        });
        return {nodeMap, indexMap};
    }

    static computeAdjacencyStructures(startNode: Node): { adjacencyMatrix: number[][], adjacencyList: Map<Node, {node: Node, weight: number}[]> , nodeMap: Map<Node, number>, indexMap: Map<number, Node>} {
        // 获取弱连通分支中的所有节点
        const connectedNodes = DijAlgorithm.getConnectedComponent(startNode);
        // 创建节点到索引的映射
        const {nodeMap, indexMap} = DijAlgorithm.createNodeIndexMap(connectedNodes);
        const n = connectedNodes.length;

        // 初始化邻接矩阵和邻接链表
        const adjacencyMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(-1));
        const adjacencyList: Map<Node, {node: Node, weight: number}[]> = new Map();

        // 填充邻接矩阵和链表
        for (const node of connectedNodes) {
            const uIndex = nodeMap.get(node)!;

            // 遍历当前节点的所有出边
            for (const line of node.lines.start) {
                const v = line.end;
                if (nodeMap.has(v)) { // 确保目标节点在连通分支中
                    const vIndex = nodeMap.get(v)!;
                    adjacencyMatrix[uIndex][vIndex] = line.weight;
                    // adjacencyList[uIndex].push(vIndex);
                    if(!adjacencyList.has(node)){
                        adjacencyList.set(node, [])
                    }
                    adjacencyList.get(node)!.push({node: v, weight: line.weight})
                }
            }
        }

        return { adjacencyMatrix, adjacencyList, nodeMap, indexMap };
    }
}