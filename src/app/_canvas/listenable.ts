export type ObserverCallBack = () => void

export default interface Listenable{
    observers: ObserverCallBack[]
    addListener: (cb: ObserverCallBack)=>void
    removeListener: (cb: ObserverCallBack)=>void
}