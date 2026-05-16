//https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
export const base64_to_buffer = function (base64) {
    let binaryString = atob(base64)
    let bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
}
//https://stackoverflow.com/questions/56846930/how-to-convert-raw-representations-of-ecdh-key-pair-into-a-json-web-key
export const hex_to_uintarray = (hex) => {
    const a = []
    for (let i = 0, len = hex.length; i < len; i += 2) {
        a.push(parseInt(hex.substr(i, 2), 16))
    }
    return new Uint8Array(a)
}
export const buffer_to_base64 = (buf) => {
    let binary = ''
    const bytes = new Uint8Array(buf)
    for (var i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
}
export const base64_to_base64url = (base64) => base64.replaceAll('/', '_').replaceAll('+', '-').replaceAll('=', '')
export const base64url_to_base64 = (base64url) => base64url.replaceAll('_', '/').replaceAll('-', '+')
//https://stackoverflow.co=/questions/40031688/javascript-arraybuffer-to-hex
export const buffer_to_hex = function (buffer) {
    // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, '0')).join('')
}
//https://gist.github.com/72lions/4528834
export const concatBuffer = function (...buffer) {
    const length = buffer.reduce((acc, cur) => acc + cur.byteLength, 0)
    let tmp = new Uint8Array(length)
    buffer.reduce((acc, cur) => {
        tmp.set(new Uint8Array(cur), acc)
        return acc + cur.byteLength
    }, 0)
    return tmp.buffer
}
