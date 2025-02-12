import React, { CSSProperties } from "react";
import s from './dark_button.module.css'

export default function DarkButton({
    children,
    onClick,
    style
}: {
    children?: React.ReactNode,
    onClick?: React.MouseEventHandler<HTMLButtonElement>
    style?: CSSProperties
}){
    return <button className={s.darkButton} onClick={onClick} style={style}>
        {children}
    </button>
}