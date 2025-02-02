'use client'

import { useEffect, useRef, useState } from 'react'
import style from './page.module.css'

/// 悬浮式控制面板
function ControlPanel(){
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
            const rootStyle = getComputedStyle(document.documentElement)
            setWidth(parseInt(style.width.slice(0,style.width.indexOf('px'))))
            setHeight(parseInt(style.height.slice(0,style.height.indexOf('px'))))
            setTitleHeight(
                parseInt(
                    rootStyle.getPropertyValue('--titleBarHeight')
                    .slice(0,rootStyle.getPropertyValue('--titleBarHeight').indexOf('px'))
                )
                +
                parseInt(
                    rootStyle.getPropertyValue('--titleBarPadding')
                    .slice(0, rootStyle.getPropertyValue('--titleBarPadding').indexOf('px'))
                ) 
            )
        }
    }, [])

    function handleMouseDown(e: any){
        setIsDragging(true)
        offset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        }
        // 禁止选择文本
        document.body.style.userSelect = 'none'
    }

    function handleMouseMove(e: any){
        e.preventDefault()
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
    </div>
}

export default function DijPlayground(){
    return <div className={style.playground}>
        <ControlPanel />
    </div>
}