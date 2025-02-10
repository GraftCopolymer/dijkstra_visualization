'use client'

import { useEffect, useRef } from 'react'
import style from './page.module.css'
import DijCanvas, { DijCanvasAPI } from './infinite_canvas'
import CanvasEventEmitter, { AddDrawableEvent, CanvasEvents, ClickDrawableEvent } from '../_canvas/events'
import ControlPanel, { ControlPanelAPI } from './control_panel'
import Node from '../_canvas/node/node'

export default function DijPlayground(){
    const canvasRef = useRef<DijCanvasAPI>(null)
    const panelRefAPI = useRef<ControlPanelAPI>(null)

    useEffect(()=>{
        CanvasEventEmitter.subscribe<AddDrawableEvent>(CanvasEvents.addDrawableEvent, (event) => {
            console.log(event.context)
        })
        CanvasEventEmitter.subscribe<ClickDrawableEvent>(CanvasEvents.clickDrawableEvent, (event) => {
            if(event.context instanceof Node){
                if(!panelRefAPI.current) return
                panelRefAPI.current.displayNode(event.context)
            }
        })
        CanvasEventEmitter.subscribe(CanvasEvents.clickCanvasEvent, (event) => {
            if(panelRefAPI.current){
                panelRefAPI.current.displayDefault()
            }
        })
        if(canvasRef.current){
        }
    }, [])

    return <div className={style.playground}>
        <ControlPanel canvasRef={canvasRef} panelAPIRef={panelRefAPI}/>
        <DijCanvas ref={canvasRef} />
    </div>
}