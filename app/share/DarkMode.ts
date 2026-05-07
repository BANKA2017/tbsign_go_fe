type darkModeType = '0' | '1' | '2'

const switchDarkMode = (darkMode: darkModeType = '0'): { darkMode: darkModeType; currentScheme: 'dark' | 'light' } => {
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
    const currentScheme = switchDarkModeAction(darkMode)
    localStorage.darkMode = darkMode
    return { darkMode, currentScheme }
}

function setColorScheme(content: string) {
    let meta = document.querySelector('meta[name="color-scheme"]')
    if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'color-scheme'
        document.head.appendChild(meta)
    }
    meta.content = content
}

const switchDarkModeAction = (darkMode: darkModeType = '0'): 'dark' | 'light' => {
    let colorScheme: 'dark' | 'light' = 'light'
    switch (darkMode) {
        case '0':
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                if (document.documentElement.classList.value === '') {
                    document.documentElement.classList.add('dark')
                    setColorScheme('dark')
                }
                colorScheme = 'dark'
            } else {
                document.documentElement.classList.remove('dark')
                setColorScheme('light')
            }
            break
        case '1':
            if (document.documentElement.classList.value !== '') {
                document.documentElement.classList.remove('dark')
                setColorScheme('light')
            }
            break
        case '2':
            if (document.documentElement.classList.value === '') {
                document.documentElement.classList.add('dark')
                setColorScheme('dark')
            }
            colorScheme = 'dark'
            break
    }

    return colorScheme
}

export { switchDarkMode, switchDarkModeAction }
export type { darkModeType }
