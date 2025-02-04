import React from "react";
import style from './dark_button.module.css'

export default function DarkButton({
    children,
    onClick
}: {
    children?: React.ReactNode,
    onClick?: React.MouseEventHandler<HTMLButtonElement>
}){
    return <button className={style.darkButton} onClick={onClick}>
        {children}
    </button>
}