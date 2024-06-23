const getPubDate = (date: Date | string = new Date()): string => {
    if (typeof date === 'string') {
        date = new Date(date.replaceAll('-', '/'))
    }
    return (
        dayToShortString[date.getUTCDay()] +
        ', ' +
        date.getUTCDate().toString().padStart(2, '0') +
        ' ' +
        monthToShortString[date.getUTCMonth()] +
        ' ' +
        date.getUTCFullYear() +
        ' ' +
        date.getUTCHours().toString().padStart(2, '0') +
        ':' +
        date.getUTCMinutes().toString().padStart(2, '0') +
        ':' +
        date.getUTCSeconds().toString().padStart(2, '0') +
        ' GMT'
    )
}

const dayToShortString: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const monthToShortString: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const getFragmentDate = (timestamp: number = 0) => {
    const tmpDate = new Date(timestamp)
    const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Set', 'Oct', 'Nov', 'Dec']
    //4:22 PM · 19 Aug, 2022
    return `${tmpDate.getHours()}:${tmpDate.getMinutes().toString().padStart(2, '0')} · ${tmpDate.getDate()} ${monthName[tmpDate.getMonth()]}, ${tmpDate.getFullYear()}`
}

export { getPubDate, getFragmentDate, dayToShortString, monthToShortString }
