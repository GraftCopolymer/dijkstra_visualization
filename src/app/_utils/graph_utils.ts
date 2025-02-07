export default class GraphUtils{
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
}