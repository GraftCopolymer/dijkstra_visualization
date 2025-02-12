class IdGeneratorClass{
    private current: number
    private initValue: number

    constructor(initValue: number){
        this.current = initValue
        this.initValue = initValue
    }

    nextDrawableId(){
        return this.current++
    }
    nextSvgId(){
        return `svg-${this.current++}`
    }
    set(value: number){
        this.current = value
    }
    reset(){
        this.current = this.initValue
    }
}

const IdGenerator = new IdGeneratorClass(0)

export default IdGenerator