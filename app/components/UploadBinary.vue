<script lang="ts" setup>
import { Notice, Request } from '~/share/Tools'
import Warning from './svg/Warning.vue'
import { Before } from '~/share/Time'

const props = defineProps({
    currentBuildDate: String,
    os: String,
    arch: String
})

const store = useMainStore()
const dark = computed(() => store.dark)

const yamlFile = ref<{ file?: File; content: string | ArrayBuffer | null; build_at?: string; version?: string }>({
    content: null
})

const oldVersion = computed(() => Before(yamlFile.value.build_at || '', props.currentBuildDate || ''))

const binFile = ref<{ file?: File; content: string | ArrayBuffer | null; build: { [p in string]: string } }>({
    content: null,
    build: {}
})

const dragStatus = ref<boolean>(false)

const dragEvent = (e: Event) => {
    e.preventDefault()
    switch (e.type) {
        case 'dragenter':
            dragStatus.value = true
            break
        case 'dragleave':
            //case 'dragend':
            dragStatus.value = false
            break
    }
}

const dropEvent = async (e: DragEvent) => {
    e.preventDefault()
    dragStatus.value = false
    handleFiles(e.dataTransfer?.files || [])
}

const PregMatchAll = (regex = new RegExp('', 'gm'), text = '') => {
    let handle
    let match = []

    while ((handle = regex.exec(text)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (handle.index === regex.lastIndex) {
            regex.lastIndex++
        }
        for (const index in handle) {
            if (!isNaN(index)) {
                if (!match[index]) {
                    match[index] = []
                }
                match[index].push(handle[index])
            }
        }
    }
    return match
}

const handleFiles = async (files: FileList = []) => {
    let ymlStatus = false
    let binStatus = false
    for (const file of files) {
        if (ymlStatus && binStatus) {
            break
        }

        const isYaml = /\.ya?ml$/i.test(file.name)

        if (isYaml && !ymlStatus) {
            if (file.size > 1024 * 1024) {
                continue
            }
            const reader = new FileReader()
            reader.onload = () => {
                const text = reader.result?.toString() || ''
                if (!text.includes('signature: ') || !text.includes('build_at: ') || !text.includes('version: ') || !text.includes('  ' + props.os + '_' + props.arch + ': ')) {
                    return
                }

                // simple but works LOL
                const metaKV = Object.fromEntries(
                    text.split('\n').map((l) => {
                        const s = l.split(':')
                        return [s[0]?.trim(), s.length > 1 ? s.slice(1).join(':').trim() : '']
                    })
                )

                yamlFile.value = { file, content: text, build_at: metaKV['build_at'], version: metaKV['version'] }
                ymlStatus = true
            }
            reader.readAsText(file)
        } else if (!isYaml && !binStatus) {
            if (file.size === 0) {
                continue
            }

            const reader = new FileReader()
            reader.onload = () => {
                const buffer = reader.result as ArrayBuffer | null

                const text = new TextDecoder().decode(new Uint8Array(buffer || []))

                let build: { [p in string]: string } = {}

                const r = PregMatchAll(/\nbuild\t([^=]+)=([^\n]+)/gm, text)
                for (let i = 0; i < r[0].length; i++) {
                    build[r[1][i]] = r[2][i]
                }

                if (build['GOOS'] !== props.os || build['GOARCH'] !== props.arch) {
                    Notice(build['GOOS'] + '_' + build['GOARCH'] + ' 不是 ' + props.os + '_' + props.arch + '，请选择其他运行文件', 'error')
                    return
                }
                binFile.value = { file, content: buffer, build }
                binStatus = true
            }

            reader.readAsArrayBuffer(file)
        }
    }
}

const uploadBinary = (e: Event) => {
    e.preventDefault()
    if (!binFile.value?.file || !yamlFile.value?.file) {
        Notice('更新文件不完整', 'error')
        return
    }

    const formData = new FormData()
    formData.append('metadata', yamlFile.value.file)
    formData.append('binary', binFile.value.file)

    Request(store.basePath + '/admin/server/upgrade/upload', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST',
        body: formData
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            Notice('已更新', 'success')
            //console.log(res)
        })
        .catch((e) => {
            Notice(e.toString(), 'error')
            console.error(e)
        })
}
</script>

<template>
    <Modal
        class="inline-block"
        title="上传更新"
        aria-label="上传更新"
        @activeCallback="
            () => {
                yamlFile = { content: null }
                binFile = { content: null, build: {} }
            }
        "
    >
        <template #default>
            <button class="border-pink-500 hover:bg-pink-500 border-2 rounded-lg ml-3 mt-3 px-3 py-1 hover:text-gray-100 transition-colors" title="上传更新" aria-label="上传更新">手动更新</button>
        </template>
        <template #container>
            <form autocomplete="off">
                <label class="block cursor-pointer select-none" for="upload-backup-data">
                    <div @dragenter="dragEvent" @dragleave="dragEvent" @dragover="dragEvent" @drop="dropEvent">
                        <div
                            :class="{
                                'pointer-events-none my-2 rounded-lg bg-gray-300 dark:bg-gray-800 px-5 py-3 mb-3 relative': true,
                                'border-gray-400 border-dashed border-2': !yamlFile?.file,
                                'border-gray-300 dark:border-gray-800 border-2': yamlFile?.file
                            }"
                        >
                            <h5 class="font-bold text-xl" title="验证文件">
                                验证文件
                                <uno-icon class="i-fluent-emoji-flat:high-voltage inline-block -mt-1" style="width: 1em; height: 1em" />
                            </h5>
                            <span class="block truncate text-sm">{{ dragStatus && !yamlFile?.file ? '释放以读取文件' : yamlFile?.file ? yamlFile?.file.name : '用于验证运行文件来源的 YAML 文件，待提交' }}</span>
                            <ul v-if="yamlFile.file" role="list" class="my-1 marker:text-sky-500 list-disc list-inside text-sm">
                                <li>
                                    <span class="font-bold">构建时间 : </span><span class="font-mono">{{ yamlFile.build_at }}<Warning v-if="oldVersion" class="inline-block -mt-1 mr-1 ml-2" width="0.9rem" height="0.9rem" title="已过期" /></span>
                                </li>
                                <li>
                                    <span class="font-bold">版本号 : </span><span class="font-mono">{{ yamlFile.version }}</span>
                                </li>
                                <li>
                                    <span class="font-bold">系统版本 : </span><span class="font-mono">{{ os + '_' + arch }}</span>
                                </li>
                            </ul>
                        </div>
                        <div
                            class="pointer-events-none my-2 rounded-lg bg-gray-300 dark:bg-gray-800 px-5 py-3 mb-3 relative"
                            :class="{ 'my-2 rounded-lg bg-gray-300 dark:bg-gray-800 px-5 py-3 mb-3 relative': true, 'border-gray-400 border-dashed border-2': !binFile?.file, 'border-gray-300 dark:border-gray-800 border-2': binFile?.file }"
                        >
                            <h5 class="font-bold text-xl" title="运行文件">
                                运行文件
                                <uno-icon class="i-skill-icons:windows-dark inline-block -mt-0.5" v-if="dark && os === 'windows'" />
                                <uno-icon class="i-skill-icons:apple-dark inline-block -mt-0.5" v-if="dark && os === 'darwin'" />
                                <uno-icon class="i-skill-icons:linux-dark inline-block -mt-0.5" v-if="dark && os === 'linux'" />
                                <uno-icon class="i-skill-icons:windows-light inline-block -mt-0.5" v-if="!dark && os === 'windows'" />
                                <uno-icon class="i-skill-icons:apple-light inline-block -mt-0.5" v-if="!dark && os === 'darwin'" />
                                <uno-icon class="i-skill-icons:linux-light inline-block -mt-0.5" v-if="!dark && os === 'linux'" />
                            </h5>
                            <span class="block truncate text-sm">{{ dragStatus && !binFile?.file ? '释放以读取文件' : binFile?.file ? binFile?.file.name : '运行文件，待提交' }}</span>
                            <!--<ul v-if="binFile.file" role="list" class="my-1 marker:text-sky-500 list-disc list-inside text-sm">
                                <li v-for="(v, k) in binFile.build" :key="k">
                                    <span class="font-bold">{{ k }} : </span><span class="font-mono">{{ v }}</span>
                                </li>
                            </ul>-->
                        </div>
                    </div>

                    <input
                        type="file"
                        class="sr-only"
                        id="upload-backup-data"
                        lang="zh"
                        multiple
                        @change="
                            async (e) => {
                                e.preventDefault()
                                handleFiles(e.target?.files || [])
                                if (e?.target?.value) {
                                    e.target.value = ''
                                }
                            }
                        "
                    />
                </label>

                <input v-if="yamlFile.file && binFile.file" type="submit" role="button" class="text-gray-100 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 transition-colors" @click="uploadBinary" value="上传" />
            </form>
        </template>
    </Modal>
</template>
