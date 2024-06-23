const ScrollTo = (top: number | Element | null = 0): void => {
    if (typeof top === 'number') {
        window.scrollTo({
            top,
            behavior: 'smooth'
        })
    } else if (top !== null) {
        top.scrollIntoView({ behavior: 'smooth' })
    }
}

export const ScrollToHere = (e: MouseEvent) => {
    if (e.currentTarget instanceof Element) {
        ScrollTo(e.currentTarget)
    }
}

export default ScrollTo
