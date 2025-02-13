import Line from "./line/line";
import Listenable from "./listenable";
import Node from "./node/node";

export enum Status {
    success,
    interrupted,
    running
}

class DijControllerClass extends Listenable{
    

    private _dij: boolean
    // 每步的时间间隔，单位为秒
    private _stepInterval: number
    private _startNodeColor: string
    // 算法完成状态
    private _status: Status
    // 完成后的结果
    // 最短距离: 结点id -> 最短距离
    private _distances: Map<number, number>
    // 路径: 结点 -> 路径列表
    private _shortestPaths: Map<Node, Line[]>
    // 高亮路径颜色
    private _highlightColor: string
    // 正常状态路径颜色
    private _defaultColor: string
    // 算法过程中被选择的线段和顶点颜色
    private _selectedColor: string

    constructor(dij: boolean){
        super()
        this._dij = dij
        this._stepInterval = 0.8
        this._startNodeColor = "green"
        this._status = Status.interrupted
        this._distances = new Map()
        this._shortestPaths = new Map()
        this._highlightColor = "white"
        this._defaultColor = "grey"
        this._selectedColor = "red"
    }

    get dij(){
        return this._dij
    }
    set dij(dij: boolean){
        // 算法准备启动
        if(!this._dij && dij){
            this._status = Status.running
        }
        this._dij = dij
        if(!this._dij){
            this._status = Status.interrupted
        }
        this.notifyListeners()
    }

    get stepInterval(){
        return this._stepInterval
    }
    set stepInterval(interval: number){
        this._stepInterval = interval
        // this.notifyListeners()
    }

    get startNodeColor(){
        return this._startNodeColor
    }
    set startNodeColor(color: string){
        this._startNodeColor = color
        this.notifyListeners()
    }

    get status(){
        return this._status
    }
    set status(s: Status){
        this._status = s
        this.notifyListeners()
    }

    get highlightColor(){
        return this._highlightColor
    }
    set highlightColor(color: string){
        this._highlightColor = color
    }

    get defaultColor(){
        return this._defaultColor
    }
    set defaultColor(color: string){
        this._defaultColor = color
    }

    get selectedColor(){
        return this._selectedColor
    }
    set selectedColor(color: string){
        this._selectedColor = color
    }

    get distances(){
        if(this._status != Status.success){
            throw "There is no result, because dijkstra have't run yet"
        }
        return this._distances
    }
    set distances(dis: Map<number, number>){
        this._distances = dis
        this.notifyListeners()
    }

    get shortestPaths(){
        if(this._status != Status.success){
            throw "There is no result, because dijkstra have't run yet"
        }
        return this._shortestPaths
    }
    set shortestPaths(sp: Map<Node, Line[]>){
        this._shortestPaths = sp
        this.notifyListeners()
    }
}

export const DijController = new DijControllerClass(false)