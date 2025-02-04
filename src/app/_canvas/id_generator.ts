class IdGeneratorClass{
    private current: number
    public initValue: number

    constructor(initValue: number){
        this.current = initValue
        this.initValue = initValue
    }

    next(){
        return this.current++
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