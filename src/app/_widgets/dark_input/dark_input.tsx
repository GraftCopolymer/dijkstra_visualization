import React from "react";
import style from './dark_input.module.css'

export default function DarkInput({
    onInput,
    onBlur,
    value
}: {
    onInput?: React.FormEventHandler<HTMLInputElement>
    onBlur?: React.FocusEventHandler<HTMLInputElement>
    value?: string | number
}){

    return <input className={style.darkInput} type="number" onInput={onInput} onBlur={onBlur} value={value} />
}