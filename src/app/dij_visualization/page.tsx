'use client'

import { useEffect, useRef } from 'react'
import style from './page.module.css'
import InfiniteCanvas, { InfiniteCanvasAPI } from './infinite_canvas'
import CanvasEventEmitter, { AddDrawableEvent, CanvasEvents, ClickDrawableEvent } from '../_canvas/events'
import ControlPanel, { ControlPanelAPI } from './control_panel'
import Node from '../_canvas/node/node'

export default function DijPlayground(){
    const canvasRef = useRef<InfiniteCanvasAPI>(null)
    const panelRefAPI = useRef<ControlPanelAPI>(null)

    useEffect(()=>{
        CanvasEventEmitter.subscribe<AddDrawableEvent>(CanvasEvents.addDrawableEvent, (event) => {
            console.log("新增结点:")
            console.log(event.context)
        })
        CanvasEventEmitter.subscribe<ClickDrawableEvent>(CanvasEvents.clickDrawableEvent, (event) => {
            console.log("检测到点击了Drawable")
            if(event.context instanceof Node){
                console.log("检测到点击了Node")
                if(!panelRefAPI.current) return
                console.log("检测到显示节点信息")
                panelRefAPI.current.displayNode(event.context)
            }
        })
        if(canvasRef.current){
        }
    }, [])

    return <div className={style.playground}>
        <ControlPanel canvasRef={canvasRef} panelAPIRef={panelRefAPI}/>
        <InfiniteCanvas ref={canvasRef} />
    </div>
}