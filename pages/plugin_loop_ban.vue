<script setup lang="ts">
import { getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const pidNameKV = computed(() => store.pidNameKV)
const loading = computed(() => store.loading)

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

const saveSettings = () => {
    Request(store.basePath + '/plugins/ver4_ban/reason', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PUT',
        body: new URLSearchParams(settings.value).toString()
    }).then((res) => {
        if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
            Notice(res.message, 'error')
            return
        }
        Notice('设置已保存', 'success')
        //console.log(res)
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
        Request(store.basePath + '/tools/userinfo/tieba_uid/' + visualEditorSearchForm.value, {
            headers: {
                Authorization: store.authorization
            }
        }).then((res) => {
            if (res.code !== 200) {
                Notice('贴吧ID:' + res.message, 'error')
                return
            }
            visualEditorSearchResponse.value.push({
                name: res.data.user.name,
                name_show: res.data.user.name_show,
                portrait: res.data.user.portrait.replace(/\?t=\d+$/, '')
            })
            //console.log(res)
        })
    }
    Request(store.basePath + '/tools/userinfo/panel/username/' + visualEditorSearchForm.value, {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice('账号查找:' + res.message, 'error')
            return
        }
        visualEditorSearchResponse.value.push({
            name: res.data.data.name,
            name_show: res.data.data.name_show,
            portrait: res.data.data.portrait.replace(/\?t=\d+$/, '')
        })
        //console.log(res)
    })
    //visualEditorSearchResponse
}

const deleteTask = (id = 0) => {
    if (id <= 0) {
        return
    }
    Request(store.basePath + '/plugins/ver4_ban/list/' + id, {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        if (res.data.success) {
            Notice('已删除 任务:' + id, 'success')
            tasksList.value = tasksList.value.filter((x) => x.id.toString() !== res.data.id)
        } else {
            Notice('未能删除 任务:' + id, 'error')
        }
        //console.log(res)
    })
}

const addTask = () => {
    if (!Object.keys(pidNameKV.value).includes(taskToAdd.value.pid.toString())) {
        return
    }
    Request(store.basePath + '/plugins/ver4_ban/list', {
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
    }).then((res) => {
        if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
            Notice(res.message, 'error')
            return
        }
        Notice(res.message, 'success')
        tasksList.value.push(...res.data.filter((x) => x.success))
        //console.log(res)
    })
}

const taskToAddPID = computed(() => taskToAdd.value.pid)
const taskToAddFname = computed(() => taskToAdd.value.fname)

let taskToAddFnameTimeoutHandle = setTimeout(() => {}, 0)
const isManagerMessage = ref<string>('')

const preCheckManager = () => {
    if (!Object.keys(pidNameKV.value).includes(taskToAdd.value.pid.toString())) {
        isManagerMessage.value = ''
        return
    }
    if (taskToAdd.value.fname.length === 0) {
        isManagerMessage.value = ''
        return
    }
    isManagerMessage.value = '检查权限中'
    Request(store.basePath + '/account/check/' + taskToAdd.value.pid + '/is_manager/' + taskToAdd.value.fname, {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        if (res.data?.is_manager) {
            isManagerMessage.value = '此账号在 ' + taskToAdd.value.fname + ' 吧为 ' + (res.data?.role || '未知管理员角色')
        } else {
            isManagerMessage.value = '此账号在 ' + taskToAdd.value.fname + ' 吧没有封禁权限'
        }
        //console.log(res)
    })
}

watch([taskToAddPID, taskToAddFname], () => {
    clearTimeout(taskToAddFnameTimeoutHandle)
    taskToAddFnameTimeoutHandle = setTimeout(preCheckManager, 500)
})

onBeforeUnmount(() => {
    clearTimeout(taskToAddFnameTimeoutHandle)
})

const tasksSwitch = ref<boolean>(false)

const updateTasksSwitch = () => {
    Request(store.basePath + '/plugins/ver4_ban/switch', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        tasksSwitch.value = res.data
        //console.log(res)
    })
}

const getLoopBanList = () => {
    Request(store.basePath + '/plugins/ver4_ban/list', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            tasksList.value = res.data?.list || []
            limit.value = res.data?.limit || 0
            if (limit.value < 0) {
                limit.value = 0
            }
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
}

const parseLogs = (log_: string = '') => {
    if (!log_) {
        return []
    }
    return log_
        .replaceAll('<font color="red">', '')
        .replaceAll('<font color="green">', '')
        .replaceAll('</font>', '')
        .split('<br>')
        .map((log) => {
            if (!log || log?.length < 20) {
                return null
            }
            const [status, error] = log.slice(20).split('#')
            return {
                date: log.slice(0, 19),
                status,
                error: error?.split(' ') || []
            }
        })
        .filter((x) => x)
}

onMounted(() => {
    getLoopBanList()
    Request(store.basePath + '/plugins/ver4_ban/reason', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        settings.value = res.data
        //console.log(res)
    })
    Request(store.basePath + '/plugins/ver4_ban/switch', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        tasksSwitch.value = res.data
        //console.log(res)
    })
})

const banPortraitListPlaceholder = '输入待封禁的用户的 Portrait，一行一个，Portrait 仅支持新版 portrait 的格式，即 tb.1.xxx.xxxxx，粘贴个人页链接会自动处理，用户名 和 贴吧 uid 请使用可视化编辑器添加'
</script>

<template>
    <div class="px-3 py-2">
        <h4 class="text-lg mb-4">设置</h4>

        <button :class="{ 'bg-sky-500': !tasksSwitch, 'bg-pink-500': tasksSwitch, 'rounded-lg': true, 'px-3': true, 'py-1': true, 'text-gray-100': true, 'transition-colors': true }" @click="updateTasksSwitch">
            {{ tasksSwitch ? '已开启循环封禁' : '已停止循环封禁' }}
        </button>

        <div class="my-5">
            <p class="my-2">封禁提示内容，用户被封禁后消息中心显示的提示内容</p>
            <input type="text" v-model="settings.reason" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-input w-full rounded-xl" />
        </div>

        <button class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 transition-colors rounded-lg px-3 py-1 text-gray-100" @click="saveSettings">保存</button>
    </div>

    <div class="px-3 py-2">
        <h4 class="text-lg">任务列表({{ tasksList.length }}/{{ limit }})</h4>

        <p v-show="tasksList.length >= limit" class="text-sm">注：任务数已达到或超出上限</p>

        <div class="my-5 grid grid-cols-6 gap-2 max-w-[48em]">
            <Modal class="col-span-6 sm:col-span-3 lg:col-span-1" title="添加封禁账号" v-show="tasksList.length < limit">
                <template #default>
                    <button class="w-full rounded-2xl border-2 border-gray-300 hover:bg-gray-300 px-4 py-1 hover:text-black transition-colors" title="添加封禁账号">添加账号</button>
                </template>
                <template #container>
                    <div class="my-2">
                        <label for="pid-to-froum-manager">吧务账号</label>
                        <select id="pid-to-froum-manager" v-model="taskToAdd.pid" class="bg-gray-200 dark:bg-gray-900 dark:text-gray-100 form-select block w-full my-3 rounded-xl">
                            <option v-for="(name, pid) in pidNameKV" :key="pid" :value="pid">{{ name }}</option>
                        </select>
                    </div>

                    <div class="my-2">
                        <label for="start-date">开始日期 (留空默认立即开始)</label>
                        <input
                            id="start-date"
                            class="form-input bg-gray-200 dark:bg-gray-900 dark:[color-scheme:dark] w-full rounded-xl"
                            :max="taskToAdd.end"
                            type="date"
                            v-model="taskToAdd.start"
                            placeholder="日期格式：yyyy-mm-dd,留空默认立即开始"
                        />
                    </div>

                    <div class="my-2">
                        <label for="end-date">结束日期</label>
                        <input id="end-date" class="form-input bg-gray-200 dark:bg-gray-900 dark:[color-scheme:dark] w-full rounded-xl" :min="taskToAdd.start" type="date" v-model="taskToAdd.end" placeholder="日期格式：yyyy-mm-dd" />
                    </div>

                    <div class="my-2">
                        <label for="froum-name">贴吧名称</label>
                        <input id="froum-name" class="form-input bg-gray-200 dark:bg-gray-900 w-full rounded-xl" type="text" v-model="taskToAdd.fname" placeholder="输入贴吧名（不带末尾吧字）" />
                        <span class="text-sm my-1">{{ isManagerMessage }}</span>
                    </div>

                    <div class="my-2">
                        <label for="ban-user-list">封禁列表({{ taskToAdd.ban_list.split('\n').filter((x) => x).length }} / {{ limit - tasksList.length }})</label>
                        <!--TODO limit issue ...-->
                        <div v-if="isVisualEditor">
                            <div class="flex w-full rounded-xl mb-3">
                                <input type="text" class="form-input bg-gray-200 dark:bg-gray-900 grow rounded-l-xl" v-model="visualEditorSearchForm" placeholder="用户名、贴吧UID" />
                                <button class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-gray-100 px-3 py-1 transition-colors rounded-r-xl" @click="searchAccount">搜索</button>
                            </div>
                            <div class="border border-sky-500 flex rounded-xl" v-for="user in visualEditorSearchResponse" :key="user.portrait">
                                <img :alt="`baidu-avatar-` + user.portrait" :src="`https://himg.bdimg.com/sys/portrait/item/${user.portrait}`" class="w-10 h-10 sm:w-16 sm:h-16 rounded-l-xl" />
                                <div class="my-2 mx-5 grow">
                                    <span class="block" :title="user.name + ' [ ' + user.name_show + ' ] ' + user.portrait">{{ user.name }} [ {{ user.name_show }} ]</span>
                                    <span class="hidden sm:block" :title="user.portrait">{{ user.portrait }}</span>
                                </div>
                                <button v-if="tasksList.find((x) => x.portrait === user.portrait)" class="bg-gray-500 hover:bg-gray-600 dark:hover:bg-gray-400 text-gray-100 px-3 py-1 transition-colors rounded-r-xl" disabled>重复</button>
                                <button
                                    v-else-if="taskToAdd.ban_list.includes(user.portrait)"
                                    class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 text-gray-100 px-3 py-1 transition-colors rounded-r-xl"
                                    @click="taskToAdd.ban_list = taskToAdd.ban_list.replace(user.portrait, '')"
                                >
                                    移除
                                </button>
                                <button v-else class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-gray-100 px-3 py-1 transition-colors rounded-r-xl" @click="taskToAdd.ban_list += '\n' + user.portrait">添加</button>
                            </div>
                        </div>
                        <textarea v-else id="ban-user-list" v-model="taskToAdd.ban_list" class="form-textarea bg-gray-200 dark:bg-gray-900 w-full rounded-xl" rows="10" :placeholder="banPortraitListPlaceholder"></textarea>
                    </div>

                    <button class="px-3 py-1 rounded-lg my-2 bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-gray-100 mr-2 transition-colors" @click="isVisualEditor = !isVisualEditor">切换编辑器</button>
                    <button class="px-3 py-1 rounded-lg my-2 bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-gray-100 transition-colors" @click="addTask">保存</button>
                </template>
            </Modal>
        </div>
        <div class="border-4 border-gray-400 dark:border-gray-700 rounded-xl p-5 my-3" v-for="task in tasksList" :key="task.pid.toString() + '_' + task.portrait + '_' + task.fname">
            <ul class="marker:text-sky-500 list-disc list-inside">
                <li>
                    <span class="font-bold">账号 : </span
                    ><NuxtLink class="font-mono hover:underline underline-offset-1" :to="`https://tieba.baidu.com/home/main?id=${task.portrait}`" target="blank">{{ task.name_show || task.name || task.portrait || '全无账号（？）' }}</NuxtLink
                    ><span class="font-mono"></span>
                </li>
                <li>
                    <span class="font-bold">封禁贴吧 : </span><NuxtLink class="font-mono hover:underline underline-offset-1" :to="'https://tieba.baidu.com/f?ie=utf-8&kw=' + task.fname" target="blank">{{ task.fname }}</NuxtLink>
                </li>
                <li>
                    <span class="font-bold">执行时间 : </span><span class="font-mono">{{ getPubDate(new Date(task.start * 1000)) }} ~ {{ getPubDate(new Date(task.end * 1000)) }}</span>
                </li>
                <hr class="border-gray-400 dark:border-gray-600 my-3" />
                <li>
                    <!--TODO use portrait-->
                    <span class="font-bold">吧务账号 : </span><NuxtLink class="font-mono hover:underline underline-offset-1" :to="'https://tieba.baidu.com/home/main?un=' + pidNameKV[task.pid]" target="blank">{{ pidNameKV[task.pid] }}</NuxtLink>
                </li>
                <li>
                    <span class="font-bold">上次执行 : </span><span class="font-mono">{{ getPubDate(new Date(task.date * 1000)) }}</span>
                </li>
                <li>
                    <span class="font-bold">执行情况 : </span>
                    <span>
                        <SvgCheck v-if="task.success" height="1em" width="1em" class="inline-block -mt-0.5" />
                        <SvgCross v-else height="1em" width="1em" class="inline-block -mt-0.5" />
                    </span>
                </li>
            </ul>

            <hr class="border-gray-400 dark:border-gray-600 my-3" />

            <Modal class="mr-1 inline-block" :title="'确认删除封禁任务: ' + task.fname + '@' + task.name_show + ' ？'" :aria-label="'确认删除封禁任务: ' + task.fname + '@' + task.name_show + ' ？'">
                <template #default>
                    <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-gray-100 transition-colors">删除</button>
                </template>
                <template #container>
                    <button class="bg-pink-500 hover:bg-pink-600 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="deleteTask(task.id)">确认删除</button>
                </template>
            </Modal>
            <Modal class="mx-1 inline-block" :title="task.fname + ' 吧封禁 @' + (task.name_show || task.name || task.portrait || '全无账号（？）') + ' 记录'">
                <template #default>
                    <button class="rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1 text-gray-900 dark:text-gray-100 transition-colors" title="日志">日志</button>
                </template>
                <template #container>
                    <div class="rounded-lg bg-gray-300 dark:bg-gray-800 px-5 py-3 mb-3" v-for="(log_, i) in parseLogs(task.log)" :key="task.pid.toString() + '_' + task.portrait + '_' + task.fname + i">
                        <h5 class="font-bold text-xl">{{ log_.date }}</h5>
                        <SvgCheck v-if="log_.error.length === 0" height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                        <SvgCross v-else height="1em" width="1em" class="inline-block -mt-0.5 mr-1" />
                        <span>{{ log_.error.length ? log_.error.join('#') : log_.status }}</span>
                    </div>
                </template>
            </Modal>
        </div>
    </div>
    <div
        :class="{
            fixed: true,
            'right-5': true,
            'bottom-32': true,
            'px-3': true,
            'py-2': true,
            'cursor-pointer': true,
            'transition-colors': true,
            'duration-150': true,
            'select-none': true,
            'text-gray-100': true,
            'bg-sky-500': true,
            'hover:bg-sky-600': true,
            'dark:hover:bg-sky-400': true,
            'rounded-md': true
        }"
        style="z-index: 9999"
        @click="getLoopBanList"
    >
        <uno-icon :class="{ 'i-bi:arrow-clockwise': true, 'animate-spin': loading }" />
    </div>
</template>

<style scoped></style>
