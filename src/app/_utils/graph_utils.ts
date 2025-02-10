export default class Utils{
    static getTitleBarHeight(){
        const rootStyle = getComputedStyle(document.documentElement)
        return parseInt(
            rootStyle.getPropertyValue('--titleBarHeight')
            .slice(0,rootStyle.getPropertyValue('--titleBarHeight').indexOf('px'))
        )
        +
        parseInt(
            rootStyle.getPropertyValue('--titleBarPadding')
            .slice(0, rootStyle.getPropertyValue('--titleBarPadding').indexOf('px'))
        ) 
    }

    /// 生成[min, max]的随机数
    static random(min: number, max: number){
        return Math.floor(Math.random() * (max - min + 1)) + min
    }
}