export const getPubDate = (date: Date | string = new Date()): string => {
    if (typeof date === 'string') {
        date = new Date(date.replaceAll('-', '/'))
    }
    return (
        date.getFullYear() +
        '/' +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        '/' +
        date.getDate().toString().padStart(2, '0') +
        ' ' +
        date.getHours().toString().padStart(2, '0') +
        ':' +
        date.getMinutes().toString().padStart(2, '0') +
        ':' +
        date.getSeconds().toString().padStart(2, '0')
    )
}

// Unix, NOT UnixMilli!!!
export const Eta = (now: number = Date.now() / 1000, end: number = 0) => {
    if (now > end) {
        return '0 天 00 小时 00 分钟 00 秒'
    }
    let diff = Math.floor(end) - Math.floor(now)
    const seconds = diff % 60
    diff = (diff - seconds) / 60
    const minutes = diff % 60
    diff = (diff - minutes) / 60
    const hours = diff % 24
    diff = (diff - hours) / 24
    const days = diff
    return `${days.toString()} 天 ${hours.toString().padStart(2, '0')} 小时 ${minutes.toString().padStart(2, '0')} 分钟 ${Math.ceil(seconds).toString().padStart(2, '0') + ' 秒'}`
}

export const DayList = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
