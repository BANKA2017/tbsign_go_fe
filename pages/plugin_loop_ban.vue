<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { getPubDate } from '~/share/Time'

const store = useMainStore()
const accounts = computed(() => store._cache?.accounts || [])
const pidNameKV = computed(() => store.pidNameKV)

const settings = ref<{ reason: string }>({ reason: '' })
const isVisualEditor = ref<boolean>(true)
const visualEditorSearchForm = ref<string>('')
const visualEditorSearchResponse = ref<
    {
        name: string
        name_show: string
        portrait: string
    }[]
>([])

const limit = ref<number>(0)

const tasksList = ref<
    {
        id: number
        pid: number
        name: string
        name_show: string
        portrait: string
        fname: string
        start: number
        end: number
        success: boolean
        log: string
        date: number
    }[]
>([])

const taskToAdd = ref<{
    pid: number
    start: string
    end: string
    fname: string
    ban_list: string
}>({
    pid: 0,
    start: '',
    end: '',
    fname: '',
    ban_list: ''
})

watch(
    taskToAdd,
    () => {
        //TODO ??? a better function?
        taskToAdd.value.ban_list = [
            ...new Set(
                taskToAdd.value.ban_list
                    .split('\n')
                    .map((tmpStr: string, index: number, list: string[]) => {
                        tmpStr = tmpStr.replace(/^@/g, '').replace(/\r$/g, '')
                        if (tmpStr.length === 0 && list.length - 1 > index) {
                            return null
                        }
                        let testPortrait = /tb.1.[\w-~]+\.[\w-~]+/g.exec(tmpStr) // portrait
                        if (testPortrait !== null) {
                            tmpStr = testPortrait[0]
                        }
                        return tmpStr
                    })
                    .filter((x: string | null) => x !== null)
            )
        ].join('\n')
    },
    { deep: true }
)

const getTaskLog = (_log = ''): string[] => {
    return _log
        .replaceAll('<font color="red">', '')
        .replaceAll('<font color="green">', '')
        .replaceAll('</font>', '')
        .split('<br>')
        .filter((x) => x)
}

const saveSettings = () => {
    fetch(store.basePath + '/plugins/loop_ban/reason', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PUT',
        body: new URLSearchParams(settings.value).toString()
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            console.log(res)
        })
}

const searchAccount = () => {
    visualEditorSearchResponse.value = []
    // 贴吧号#\d+#
    let testPortrait = /贴吧号#(\d+)#/g.exec(visualEditorSearchForm.value) // portrait
    if (testPortrait !== null) {
        visualEditorSearchForm.value = testPortrait[1]
    }

    if (visualEditorSearchForm.value.length === 0) {
        return
    }

    const isNumberFormValue = /^\d+$/g.test(visualEditorSearchForm.value)

    if (isNumberFormValue) {
        fetch(store.basePath + '/tools/userinfo/tieba_uid/' + visualEditorSearchForm.value, {
            headers: {
                Authorization: store.authorization
            }
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.code !== 200) {
                    return
                }
                visualEditorSearchResponse.value.push({
                    name: res.data.user.name,
                    name_show: res.data.user.name_show,
                    portrait: res.data.user.portrait.replace(/\?t=\d+$/, '')
                })
                console.log(res)
            })
    }
    fetch(store.basePath + '/tools/userinfo/panel/username/' + visualEditorSearchForm.value, {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            visualEditorSearchResponse.value.push({
                name: res.data.data.name,
                name_show: res.data.data.name_show,
                portrait: res.data.data.portrait.replace(/\?t=\d+$/, '')
            })
            console.log(res)
        })

    //visualEditorSearchResponse
}

const deleteTask = (id = 0) => {
    if (id <= 0) {
        return
    }
    fetch(store.basePath + '/plugins/loop_ban/list/' + id, {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            if (res.data.success) {
                tasksList.value = tasksList.value.filter((x) => x.id.toString() !== res.data.id)
            }
            console.log(res)
        })
}

const addTask = () => {
    if (taskToAdd.value.pid <= 0) {
        return
    }
    fetch(store.basePath + '/plugins/loop_ban/list', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PATCH',
        body: new URLSearchParams({
            pid: taskToAdd.value.pid.toString(),
            start: taskToAdd.value.start,
            end: taskToAdd.value.end,
            fname: taskToAdd.value.fname,
            portrait: taskToAdd.value.ban_list.trim()
        }).toString()
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            tasksList.value.push(...res.data.filter((x) => x.success))
            console.log(res)
        })
}

const tasksSwitch = ref<boolean>(false)

const updateTasksSwitch = () => {
    fetch(store.basePath + '/plugins/loop_ban/switch', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            tasksSwitch.value = res.data
            console.log(res)
        })
}

onMounted(() => {
    fetch(store.basePath + '/plugins/loop_ban/reason', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            settings.value = res.data
            console.log(res)
        })
    fetch(store.basePath + '/plugins/loop_ban/switch', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            tasksSwitch.value = res.data
            console.log(res)
        })
    fetch(store.basePath + '/plugins/loop_ban/list', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            tasksList.value = res.data?.list || []
            limit.value = res.data?.limit || 0
            if (limit.value < 0) {
                limit.value = 0
            }
            console.log(res)
        })
})

const banPortraitListPlaceholder = '输入待封禁的用户的 Portrait，一行一个，Portrait 仅支持新版 portrait 的格式，即 tb.1.xxx.xxxxx，粘贴个人页链接会自动处理，用户名 和 贴吧 uid 请使用可视化编辑器添加'

definePageMeta({
    middleware: ['auth', 'init-cache']
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="px-3 py-2">
                <h4 class="text-lg mb-4">设置</h4>

                <button :class="{ 'bg-sky-500': !tasksSwitch, 'bg-pink-500': tasksSwitch, 'rounded-lg': true, 'px-3': true, 'py-1': true, 'text-white': true }" @click="updateTasksSwitch">{{ tasksSwitch ? '停止循环封禁' : '开启循环封禁' }}</button>

                <div class="my-5">
                    <p class="my-2">封禁提示内容，用户被封禁后消息中心显示的提示内容</p>
                    <input type="text" v-model="settings.reason" class="dark:bg-black dark:text-white form-input w-full" />
                </div>

                <button class="bg-sky-500 rounded-lg px-3 py-1 text-white" @click="saveSettings">保存</button>
            </div>

            <div class="px-3 py-2">
                <h4 class="text-lg">任务列表</h4>

                <p v-show="tasksList.length > limit">注：任务数已超出上限，请删除一些任务后再添加</p>

                <details class="marker:text-sky-500 my-5" v-show="tasksList.length <= limit">
                    <summary class="cursor-pointer">添加 ({{ tasksList.length }}/{{ limit }})</summary>

                    <div class="my-2">
                        <label for="pid-to-froum-manager">吧务帐号</label>
                        <select id="pid-to-froum-manager" v-model="taskToAdd.pid" class="dark:bg-black dark:text-white form-select block w-full my-3">
                            <option v-for="(name, pid) in pidNameKV" :key="pid" :value="pid">{{ name }}</option>
                        </select>
                    </div>

                    <div class="my-2">
                        <label for="start-date">开始日期 (留空默认立即开始)</label>
                        <input class="form-input dark:bg-black dark:[color-scheme:dark] w-full" :max="taskToAdd.end" type="date" v-model="taskToAdd.start" placeholder="日期格式：yyyy-mm-dd,留空默认立即开始" />
                    </div>

                    <div class="my-2">
                        <label for="end-date">结束日期</label>
                        <input class="form-input dark:bg-black dark:[color-scheme:dark] w-full" :min="taskToAdd.start" type="date" v-model="taskToAdd.end" placeholder="日期格式：yyyy-mm-dd" />
                    </div>

                    <div class="my-2">
                        <label for="froum-name">贴吧名称</label>
                        <input class="form-input dark:bg-black w-full" type="text" v-model="taskToAdd.fname" placeholder="输入贴吧名（不带末尾吧字）" />
                    </div>

                    <div class="my-2">
                        <label for="froum-name">封禁列表({{ taskToAdd.ban_list.split('\n').filter((x) => x).length }} / {{ limit - tasksList.length }})</label>
                        <!--TODO limit issue ...-->
                        <div v-if="isVisualEditor">
                            <div class="flex w-full">
                                <input type="text" class="form-input dark:bg-black grow" v-model="visualEditorSearchForm" placeholder="用户名、贴吧UID" />
                                <button class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-white px-3 py-1" @click="searchAccount">搜索</button>
                            </div>
                            <div class="border border-sky-500 flex" v-for="user in visualEditorSearchResponse" :key="user.portrait">
                                <img :alt="`baidu-avatar-` + user.portrait" :src="`https://himg.bdimg.com/sys/portrait/item/${user.portrait}`" class="w-16 h-16" />
                                <div class="my-2 mx-5 grow">
                                    <span class="block">{{ user.name }} [ {{ user.name_show }} ]</span>
                                    <span class="block">{{ user.portrait }}</span>
                                </div>
                                <button v-if="tasksList.find((x) => x.portrait === user.portrait)" class="bg-gray-500 hover:bg-gray-600 dark:hover:bg-gray-400 text-white px-3 py-1" disabled>重复</button>
                                <button
                                    v-else-if="taskToAdd.ban_list.includes(user.portrait)"
                                    class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 text-white px-3 py-1"
                                    @click="taskToAdd.ban_list = taskToAdd.ban_list.replace(user.portrait, '')"
                                >
                                    移除
                                </button>
                                <button v-else class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-white px-3 py-1" @click="taskToAdd.ban_list += '\n' + user.portrait">添加</button>
                            </div>
                        </div>
                        <textarea v-else id="banUserList" v-model="taskToAdd.ban_list" class="form-input dark:bg-black w-full" rows="10" :placeholder="banPortraitListPlaceholder"></textarea>
                    </div>

                    <button class="px-3 py-1 rounded-lg my-2 bg-sky-500 text-white mr-2" @click="isVisualEditor = !isVisualEditor">切换编辑器</button>
                    <button class="px-3 py-1 rounded-lg my-2 bg-sky-500 text-white" @click="addTask">保存</button>
                </details>

                <div class="border border-sky-500 rounded-xl p-5 my-3" v-for="task in tasksList" :key="task.pid.toString() + '_' + task.portrait + '_' + task.fname">
                    <li class="marker:text-sky-500">
                        <span class="font-bold">账号 : </span
                        ><NuxtLink class="font-mono hover:underline underline-offset-1" :to="`https://tieba.baidu.com/home/main?id=${task.portrait}`" target="blank">{{ task.name_show || task.name || task.portrait || '全无账号（？）' }}</NuxtLink
                        ><span class="font-mono"></span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">封禁贴吧 : </span><NuxtLink class="font-mono hover:underline underline-offset-1" :to="'https://tieba.baidu.com/f?ie=utf-8&kw=' + task.fname" target="blank">{{ task.fname }}</NuxtLink>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">执行时间 : </span><span class="font-mono">{{ getPubDate(new Date(task.start * 1000)) }} ~ {{ getPubDate(new Date(task.end * 1000)) }}</span>
                    </li>
                    <hr class="my-3" />
                    <li class="marker:text-sky-500">
                        <!--TODO use portrait-->
                        <span class="font-bold">吧务账号 : </span><NuxtLink class="font-mono hover:underline underline-offset-1" :to="'https://tieba.baidu.com/home/main?un=' + pidNameKV[task.pid]" target="blank">{{ pidNameKV[task.pid] }}</NuxtLink>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">上次执行 : </span><span class="font-mono">{{ getPubDate(new Date(task.date * 1000)) }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">执行情况 : </span><span>{{ task.success ? '✅' : '❌' }}</span>
                    </li>
                    <details class="marker:text-sky-500">
                        <summary class="cursor-pointer"><span class="font-bold ml-1">日志</span></summary>
                        <li class="marker:text-sky-500 ml-3 break-all" v-for="(log_, i) in getTaskLog(task.log)" :key="task.pid.toString() + '_' + task.portrait + '_' + task.fname + i">{{ log_ }}</li>
                    </details>
                    <hr class="my-3" />
                    <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-white" @click="deleteTask(task.id)">删除</button>
                </div>
            </div>
        </frame-work>
    </NuxtLayout>
</template>

<style scoped></style>
