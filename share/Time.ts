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
        return '0'
    }
    let diff = end - now
    const seconds = diff % 60
    diff = (diff - seconds) / 60
    const minutes = diff % 60
    diff = (diff - minutes) / 60
    const hours = diff % 24
    diff = (diff - hours) / 24
    const days = diff
    return `${days.toString().padStart(2, '0')} 天 ${hours.toString().padStart(2, '0')} 小时 ${minutes.toString().padStart(2, '0')} 分钟 ${Math.ceil(seconds).toString().padStart(2, '0') + ' 秒'}`
}
