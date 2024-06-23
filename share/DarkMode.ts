type darkModeType = '0' | '1' | '2'

const switchDarkMode = (darkMode: darkModeType = '0'): darkModeType => {
    switch (darkMode) {
        case '0':
            darkMode = '1'
            break
        case '1':
            darkMode = '2'
            break
        case '2':
            darkMode = '0'
            break
    }
    switchDarkModeAction(darkMode)
    localStorage.darkMode = darkMode
    return darkMode
}

const switchDarkModeAction = (darkMode: darkModeType = '0'): void => {
    switch (darkMode) {
        case '0':
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                if (document.documentElement.classList.value === '') {
                    document.documentElement.classList.add('dark')
                }
            } else {
                document.documentElement.classList.remove('dark')
            }
            break
        case '1':
            if (document.documentElement.classList.value !== '') {
                document.documentElement.classList.remove('dark')
            }
            break
        case '2':
            if (document.documentElement.classList.value === '') {
                document.documentElement.classList.add('dark')
            }
            break
    }
}

export { switchDarkMode, switchDarkModeAction }
export type { darkModeType }
