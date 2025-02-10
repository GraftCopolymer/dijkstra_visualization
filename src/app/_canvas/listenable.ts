export type ObserverCallBack = () => void

export default abstract class Listenable{
    protected observers: ObserverCallBack[]

    constructor(){
        this.observers = []
    }

    addListener(cb: ObserverCallBack){
        this.observers.push(cb)
    }

    removeListener(cb: ObserverCallBack){ 
        this.observers = this.observers.filter((o) => o !== cb)
    }

    notifyListeners(){
        this.observers.forEach(o => {
            o()
        })
    }
    
}
