'use client'

import { useEffect, useRef } from 'react'
import style from './page.module.css'
import InfiniteCanvas, { InfiniteCanvasAPI } from './infinite_canvas'
import CanvasEventEmitter, { AddDrawableEvent, CanvasEvents } from '../_canvas/events'
import ControlPanel from './control_panel'

export default function DijPlayground(){
    const canvasRef = useRef<InfiniteCanvasAPI>(null)

    useEffect(()=>{
        CanvasEventEmitter.subscribe<AddDrawableEvent>(CanvasEvents.addDrawableEvent, (event) => {
            console.log("新增结点:")
            console.log(event.context)
        })
        if(canvasRef.current){
        }
    }, [])

    return <div className={style.playground}>
        <ControlPanel canvasRef={canvasRef}/>
        <InfiniteCanvas ref={canvasRef} />
    </div>
}