import style from './page.module.css'

function TitleBar(){
    return <div className={style.titleBar}>
        <p>Visual Dijkstra Tools</p>
    </div>
}

export default function VisualizationLayout({
    children
} : Readonly<{children: React.ReactNode}>){
    return <div>
        <TitleBar />
    </div>
}