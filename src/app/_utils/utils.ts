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

    /// 返回html标准颜色名的7字符十六进制格式
    static colorNameToHex(colorName: string) {
        const tempElement = document.createElement('div');
        tempElement.style.color = colorName;
        document.body.appendChild(tempElement);
        const color = window.getComputedStyle(tempElement).color;
        document.body.removeChild(tempElement);
      
        // 将rgba颜色格式转为十六进制
        const rgba = color.match(/^rgba?\((\d+), (\d+), (\d+)(?:, (\d+(\.\d+)?))?\)$/);
        if (rgba) {
          const r = parseInt(rgba[1]).toString(16).padStart(2, '0');
          const g = parseInt(rgba[2]).toString(16).padStart(2, '0');
          const b = parseInt(rgba[3]).toString(16).padStart(2, '0');
          return `#${r}${g}${b}`;
        }
        return colorName; // 返回原色名（如果无法解析）
      }
}