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
