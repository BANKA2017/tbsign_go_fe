import Noty from 'noty'

export const Notice = (text: string = '', type: Noty.Type = 'success', timeout: number = 1500) => {
    new Noty({
        text,
        type,
        timeout,
        theme: 'nest',
        layout: 'topRight',
        progressBar: true,
        closeWith: ['click']
    }).show()
}

export const Request = async (input: string | URL | globalThis.Request, init?: RequestInit, routeName?: string | null): Promise<any> => {
    const store = useMainStore()
    if (routeName === undefined) {
        const route = useRoute()
        routeName = route.name?.toString()
    }
    store.updateValue('loading', true)
    return fetch(input, init)
        .then((res) => {
            store.updateValue('loading', false)
            return res.json()
        })
        .then((res) => {
            if (init?.headers?.Authorization !== '' && res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                if (['signin', 'signup', 'reset_password', 'add_base_path'].includes(routeName || '')) {
                    navigateTo(routeName)
                } else {
                    navigateTo('/signin')
                }
            }
            return res
        })
        .catch((e) => {
            store.updateValue('loading', false)
            throw e
        })
}

export const DownloadFile = (filename = '', text = '') => {
    let element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}

export const ReadFileData = async (id = 'uploadFile'): Promise<any> => {
    return new Promise((resolve, reject) => {
        const inputElement = document.getElementById(id) as HTMLInputElement

        if (!inputElement || !inputElement.files || inputElement.files.length === 0) {
            reject(new Error('No file selected'))
            return
        }

        const file = inputElement.files[0]
        const fileReader = new FileReader()

        fileReader.onload = () => {
            try {
                const result = JSON.parse(fileReader.result as string)
                resolve(result)
            } catch (err) {
                console.error('Error parsing JSON:', err)
                reject(new Error('Unable to parse JSON file'))
            }
        }

        fileReader.onerror = () => {
            console.error('Error reading file:', fileReader.error)
            reject(new Error('File reading failed'))
        }

        fileReader.readAsText(file)
    })
}
