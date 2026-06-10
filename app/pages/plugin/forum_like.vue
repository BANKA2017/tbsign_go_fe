<script setup lang="ts">
import { clamp } from '@vueuse/core'
import { getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const accounts = computed(() => store.cache.accounts || [])
const pidNameKV = computed(() => store.pidNameKV)
const pidNameKVWithoutTarget = computed(() => Object.fromEntries(Object.entries(pidNameKV.value).filter((kv) => kv[0] !== taskToAdd.value.pid.toString())))
const loading = computed(() => store.loading)
const now = ref<number>(0)

let nowIntervalHandle: any = null

interface taskItem {
    id: number
    uid: number
    pid: number
    fid: number
    fname: string
    status: number
    last_error: string
    date: number
}

const tasksList = ref<taskItem[]>([])
interface taskGroup {
    portrait: string
    succeed: number
    failed: number
    waiting: number
    lastTask?: taskItem
    tasks: taskItem[]
}
const buildTaskGroup = () => {
    let taskGroupByPid: { [p in number]: taskGroup } = {}

    for (const task of tasksList.value) {
        if (!taskGroupByPid[task.pid]) {
            taskGroupByPid[task.pid] = {
                portrait: accounts.value.find((account) => account.id === task.pid)?.portrait || '',
                succeed: 0,
                failed: 0,
                waiting: 0,
                lastTask: undefined,
                tasks: []
            }
        }

        if (task.status === 0 && task.date > 0) {
            taskGroupByPid[task.pid].succeed++
        } else if (task.status > 0 && task.date > 0) {
            taskGroupByPid[task.pid].failed++
        } else {
            taskGroupByPid[task.pid].waiting++
        }

        if (task.date && (!taskGroupByPid[task.pid].lastTask || taskGroupByPid[task.pid].lastTask?.date < task.date)) {
            taskGroupByPid[task.pid].lastTask = task
        }

        taskGroupByPid[task.pid]?.tasks?.push(task)
    }

    return taskGroupByPid
}

const taskGroup = ref<{ [p in number]: taskGroup }>(buildTaskGroup())
watch(
    tasksList,
    () => {
        taskGroup.value = buildTaskGroup()
    },
    { deep: true }
)

const hasSucceed = computed(() => Object.entries(taskGroup.value).reduce((pre: number, cur: taskItem) => pre + cur[1].succeed, 0) > 0)

const taskStatus = (task: taskItem) => {
    if (task.status === 0 && task.date > 0 && task.last_error.startsWith('关注成功')) {
        return 'succeed'
    } else if (task.status !== 0 && task.date > 0) {
        return 'failed'
    } else {
        return 'waiting'
    }
}

const taskToAdd = ref<{
    pid: number
    fname: string
}>({
    pid: 0,
    fname: ''
})

watch(
    taskToAdd,
    () => {
        const forumListRemain = tasksConfig.limit - (taskGroup.value?.[taskToAdd.value.pid]?.tasks?.length || 0)
        taskToAdd.value.fname = [
            ...new Set(
                taskToAdd.value.fname
                    .split('\n')
                    .map((tmpStr: string, index: number, list: string[]) => {
                        tmpStr = tmpStr.trim()
                        if ((tmpStr.length === 0 && list.length - 1 > index) || index >= forumListRemain) {
                            return null
                        }

                        return tmpStr
                    })
                    .filter((x: string | null) => x !== null)
            )
        ].join('\n')
    },
    { deep: true }
)

const deleteTask = (pid = 0, tid = 0) => {
    if (pid <= 0 || tid < 0) {
        return
    }

    // pid & tid
    if ((pid > 0 && !pidNameKV.value[pid]) || (tid > 0 && !tasksList.value.find((task) => task.id === tid))) {
        Notice('任务不存在', 'error')
        return
    }

    let link = store.basePath + '/plugins/kd_forum_like/list'

    if (pid > 0) {
        link += '/' + pid
        if (tid > 0) {
            link += '/' + tid
        }
    }

    Request(link, {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        if (res.data?.length) {
            Notice('已删除 ' + res.data.length + ' 个任务:', 'success')
            const deletedTidList = res.data.map((task: taskItem) => task.id) || []

            tasksList.value = tasksList.value.filter((x) => {
                return !deletedTidList.includes(x.id)
            })
        } else {
            Notice('删除失败', 'error')
        }
        //console.log(res)
    })
}

const toRemoveSucceedPid = ref<number>(0)

const deleteSucceedTask = () => {
    const pid = toRemoveSucceedPid.value

    if (pid < 0) {
        return
    }

    // pid & tid
    if (pid > 0 && !pidNameKV.value[pid]) {
        Notice('任务不存在', 'error')
        return
    }

    let link = store.basePath + '/plugins/kd_forum_like/list'

    if (pid > 0) {
        link += '/' + pid + '/succeed'
    } else {
        link += '/succeed'
    }

    Request(link, {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        Notice('已删除 ' + res.data.length + ' 个任务:', 'success')
        const deletedTidList = res.data.map((task: taskItem) => task.id) || []

        tasksList.value = tasksList.value.filter((x) => {
            return !deletedTidList.includes(x.id)
        })
        //console.log(res)
    })
}

const isCloneMode = ref<boolean>(false)

const taskToClone = ref<{
    source_pid: number
    clone_source: 'forum_list' | 'plugin_tasks'
}>({
    source_pid: 0,
    clone_source: 'forum_list'
})

const addTask = () => {
    if (!Object.keys(pidNameKV.value).includes(taskToAdd.value.pid.toString())) {
        return
    }

    if (taskToAdd.value.fname.length === 0) {
        return
    }

    const form = new URLSearchParams()
    for (const f of taskToAdd.value.fname.split('\n')) {
        const trimedFname = f.trim()
        if (trimedFname) {
            form.append('fname', trimedFname)
        }
    }

    Request(store.basePath + '/plugins/kd_forum_like/list/' + taskToAdd.value.pid.toString(), {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PUT',
        body: form
    }).then((res) => {
        if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
            Notice(res.message, 'error')
            return
        }
        if (res.data.length === 0) {
            Notice('没有符合的贴吧', 'success')
        } else {
            Notice('添加完成，已添加 ' + res.data.length + ' 个贴吧', 'success')
            tasksList.value.push(...res.data)
        }
        //console.log(res)
    })
}

const cloneTask = () => {
    if (!Object.keys(pidNameKV.value).includes(taskToAdd.value.pid.toString())) {
        return
    }

    if (!Object.keys(pidNameKV.value).includes(taskToClone.value.source_pid.toString())) {
        Notice('来源账号不存在', 'error')
        return
    }

    Request(store.basePath + '/plugins/kd_forum_like/list/' + taskToAdd.value.pid.toString() + '/clone/' + taskToClone.value.source_pid + '/' + taskToClone.value.clone_source, {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST'
    }).then((res) => {
        if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
            Notice(res.message, 'error')
            return
        }

        if (res.data.length === 0) {
            Notice('没有符合的贴吧', 'success')
        } else {
            Notice('克隆完成，已添加 ' + res.data.length + ' 个贴吧', 'success')
            tasksList.value.push(...res.data)
        }
        //console.log(res)
    })
}

const resetTask = (pid = 0, tid = 0) => {
    if (pid <= 0 || tid <= 0) {
        return
    }

    // pid & tid
    const task = tasksList.value.find((task) => task.id === tid)
    if ((pid > 0 && !pidNameKV.value[pid]) || !task) {
        Notice('任务不存在', 'error')
        return
    }

    Request(store.basePath + '/passport/plugin/kd_forum_like/reset/' + pid + '/' + tid, {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            //console.log(res)
            return
        }

        task.date = 0
        task.status = 0
        task.last_error = ''

        Notice('已重置任务:' + tid, 'success')
        //console.log(res)
    })
}

const tasksSwitch = ref<boolean>(false)

const updateTasksSwitch = () => {
    Request(store.basePath + '/plugins/kd_forum_like/switch', {
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

const tasksConfig = reactive<{
    limit: number
    pid_cooldown_time: number
    fname_cooldown_time: number
}>({
    limit: 0,
    pid_cooldown_time: 0,
    fname_cooldown_time: 0
})

const loadingTasks = ref<boolean>(false)

const getLikeTasksList = () => {
    loadingTasks.value = true
    Request(store.basePath + '/plugins/kd_forum_like/list', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            tasksList.value = res.data || []
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
        .finally(() => {
            loadingTasks.value = false
        })
}

const getSettings = () => {
    Request(store.basePath + '/plugins/kd_forum_like/settings', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        tasksConfig.limit = res.data?.limit
        tasksConfig.pid_cooldown_time = res.data?.pid_cooldown_time
        tasksConfig.fname_cooldown_time = res.data?.fname_cooldown_time
        //console.log(res)
    })
}

onMounted(() => {
    getSettings()
    getLikeTasksList()

    Request(store.basePath + '/plugins/kd_forum_like/switch', {
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

    nowIntervalHandle = setInterval(() => {
        now.value = Date.now() / 1000
    }, 500)
})

onBeforeUnmount(() => {
    if (nowIntervalHandle) {
        clearInterval(nowIntervalHandle)
    }
})
</script>

<template>
    <div class="px-3 py-2">
        <div class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-2">
            <ul class="col-span-2 md:col-span-1 list-disc list-inside marker:text-pink-500">
                <li>短期内关注过多会导致账号被永久封禁</li>
                <li>删除或重置任务会影响冷却时间，建议在没有待关注贴吧时再操作</li>
            </ul>
        </div>

        <h3 class="text-2xl mb-4">设置</h3>

        <button :class="{ 'bg-sky-500': !tasksSwitch, 'bg-pink-500': tasksSwitch, 'rounded-lg': true, 'px-3': true, 'py-1': true, 'text-gray-100': true, 'transition-colors': true }" @click="updateTasksSwitch">
            {{ tasksSwitch ? '已开启' : '已停止' }}
        </button>
    </div>

    <div class="px-3 py-2">
        <h4 class="text-xl">任务列表</h4>

        <div class="my-5 grid grid-cols-6 gap-2 max-w-[48em]">
            <Modal
                class="col-span-3 sm:col-span-2 lg:col-span-1"
                :title="'添加贴吧' + (isCloneMode ? ' [ 克隆 ]' : '')"
                @active-callback="
                    () => {
                        taskToAdd.pid = 0
                        taskToAdd.fname = ''
                        taskToClone.source_pid = 0
                        taskToClone.clone_source = 'forum_list'
                    }
                "
            >
                <template #default>
                    <button class="w-full rounded-2xl border-2 border-gray-300 hover:bg-gray-300 px-4 py-1 hover:text-black transition-colors" title="添加贴吧">添加贴吧</button>
                </template>
                <template #container>
                    <ul class="col-span-2 md:col-span-1 list-disc list-inside marker:text-pink-500 text-sm">
                        <li>
                            超出容量限制的贴吧会被忽略<span v-if="taskToAdd.pid"
                                >（还可以添加<span class="text-pink-500 font-mono mx-1">{{
                                    clamp(tasksConfig.limit - (taskGroup?.[taskToAdd.pid]?.tasks?.length || 0) - (taskToAdd.fname ? taskToAdd.fname.split('\n').length : 0), 0, tasksConfig.limit)
                                }}</span
                                >个贴吧）</span
                            >
                        </li>
                        <li>
                            同一贴吧账号连续两次关注至少间隔 <span class="text-pink-500 font-mono">{{ tasksConfig.pid_cooldown_time }}</span> 秒
                        </li>
                        <li>
                            同一贴吧被任意账号连续两次关注至少间隔 <span class="text-pink-500 font-mono">{{ tasksConfig.fname_cooldown_time }}</span> 秒
                        </li>
                    </ul>

                    <div class="my-3">
                        <label for="pid-to-froum-manager">贴吧账号</label>
                        <select id="pid-to-froum-manager" v-model="taskToAdd.pid" class="bg-gray-200 dark:bg-gray-900 dark:text-gray-100 form-select block w-full mt-1 rounded-xl">
                            <option v-for="(name, pid) in pidNameKV" :key="pid" :value="pid">{{ name }}</option>
                        </select>
                    </div>

                    <div v-if="isCloneMode">
                        <div class="my-3">
                            <label for="pid-to-froum-manager">来源账号</label>
                            <select id="pid-to-froum-manager" v-model="taskToClone.source_pid" class="bg-gray-200 dark:bg-gray-900 dark:text-gray-100 form-select block w-full mt-1 rounded-xl">
                                <option v-for="(name, pid) in pidNameKVWithoutTarget" :key="pid" :value="pid">{{ name }}</option>
                            </select>
                        </div>
                        <div class="my-3">
                            <label for="pid-to-froum-manager">贴吧列表</label>
                            <select id="pid-to-froum-manager" v-model="taskToClone.clone_source" class="bg-gray-200 dark:bg-gray-900 dark:text-gray-100 form-select block w-full mt-1 rounded-xl">
                                <option value="forum_list">贴吧列表</option>
                                <option value="plugin_tasks">本插件任务列表</option>
                            </select>
                        </div>
                    </div>
                    <div v-else class="my-3">
                        <label for="froum-name">贴吧名称</label>
                        <textarea id="froum-name" v-model="taskToAdd.fname" class="form-textarea bg-gray-200 dark:bg-gray-900 w-full rounded-xl mt-1" rows="10" placeholder="输入贴吧名（不带末尾吧字），一行一个"></textarea>
                    </div>

                    <button :class="{ 'px-3 py-1 rounded-lg my-2 border-2 border-sky-500 hover:bg-sky-500 text-gray-100 mr-2 transition-colors': true, 'bg-sky-500': isCloneMode }" @click="isCloneMode = !isCloneMode">克隆模式</button>
                    <button
                        v-if="isCloneMode"
                        class="px-3 py-1 rounded-lg my-2 border-2 border-sky-500 bg-sky-500 hover:bg-sky-600 hover:border-sky-600 dark:hover:bg-sky-400 dark:hover:border-sky-400 text-gray-100 transition-colors"
                        @click="cloneTask"
                    >
                        克隆
                    </button>
                    <button v-else class="px-3 py-1 rounded-lg my-2 border-2 border-sky-500 bg-sky-500 hover:bg-sky-600 hover:border-sky-600 dark:hover:bg-sky-400 dark:hover:border-sky-400 text-gray-100 transition-colors" @click="addTask">
                        保存
                    </button>
                </template>
            </Modal>

            <Modal
                v-show="hasSucceed"
                title="清空已完成"
                class="inline-block col-span-3 sm:col-span-2 lg:col-span-1"
                @active-callback="
                    () => {
                        toRemoveSucceedPid = 0
                    }
                "
            >
                <template #default>
                    <button class="w-full rounded-2xl border-2 border-gray-300 hover:bg-gray-300 px-4 py-1 hover:text-black transition-colors" title="清空已完成">清空已完成</button>
                </template>
                <template #container>
                    <ul class="mb-3 col-span-2 md:col-span-1 marker:text-pink-500 list-disc list-inside text-sm">
                        <li>清空会影响冷却时间，建议在没有待关注贴吧时再操作</li>
                    </ul>

                    <div class="my-3">
                        <label for="pid-to-plugin-reset">账号</label>
                        <select id="pid-to-plugin-reset" v-model="toRemoveSucceedPid" class="bg-gray-200 dark:bg-gray-900 dark:text-gray-100 form-select block w-full mt-1 rounded-xl">
                            <option :key="0" :value="0">全选</option>
                            <option v-for="(_, pid) in taskGroup" :key="pid" :value="pid">{{ pidNameKV[pid] }}</option>
                        </select>
                    </div>

                    <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click.stop="deleteSucceedTask">确认</button>
                </template>
            </Modal>
        </div>
        <div v-if="loadingTasks" class="w-full h-32 rounded-xl bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
        <template v-else>
            <div class="bg-gray-200 dark:bg-gray-800 col-span-12 rounded-2xl mb-3" v-for="(taskInfo, pid) in taskGroup" :key="pid">
                <div :class="{ flex: true, 'justify-between': true, 'bg-gray-200': true, 'dark:bg-gray-800': true, 'z-10': true, 'px-3': true, 'pt-2': true, ' rounded-2xl': true }">
                    <div class="flex flex-row gap-3">
                        <div :class="{ relative: true, hidden: true, '2xs:block': true, 'xs:block': true }">
                            <img :alt="`baidu-avatar-` + taskInfo.portrait" :src="`https://himg.bdimg.com/sys/portraitn/item/${taskInfo.portrait}`" loading="lazy" class="w-10 h-10 rounded-full my-1 bg-gray-300 dark:bg-gray-700" />
                        </div>
                        <div :class="{ 'max-w-40': true, 'xs:max-w-40': true, flex: true, 'flex-col': true }">
                            <NuxtLink
                                :class="{
                                    'overflow-hidden': true,
                                    truncate: true,
                                    'whitespace-nowrap': true,
                                    'inline-block': true,
                                    'hover:underline': true,
                                    'underline-offset-2': true
                                }"
                                :title="taskInfo.portrait"
                                :to="`https://tieba.baidu.com/home/main?id=${taskInfo.portrait}`"
                                target="blank"
                            >
                                {{ pidNameKV[pid] }}</NuxtLink
                            >
                            <div
                                :class="{ 'text-sm': true, flex: true, 'flex-row': true, 'xs:flex-row': true }"
                                :title="(taskInfo?.succeed || 0) + '成功，' + (taskInfo?.failed || 0) + '失败，' + (taskInfo?.waiting || 0) + '等待'"
                                :aria-label="(taskInfo?.succeed || 0) + '成功，' + (taskInfo?.failed || 0) + '失败，' + (taskInfo?.waiting || 0) + '等待'"
                            >
                                <div>
                                    <span class="text-green-500">{{ taskInfo?.succeed || 0 }}</span
                                    ><span class="mx-0.5">/</span><span class="text-pink-500">{{ taskInfo?.failed || 0 }}</span
                                    ><span class="mx-0.5">/</span>
                                </div>
                                <div>
                                    <span class="text-orange-500">{{ taskInfo?.waiting || 0 }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        class="flex gap-2"
                        @click="
                            (e) => {
                                e.stopPropagation()
                            }
                        "
                    >
                        <div :class="{ 'max-w-40': true, 'xs:max-w-40': true, flex: true, 'flex-col': true, 'gap-2': true }">
                            <div v-if="taskInfo.lastTask" class="overflow-hidden truncate whitespace-nowrap inline-block text-sm">
                                <div v-if="taskInfo.lastTask.status === 0 && taskInfo.lastTask.date > 0 && taskInfo.lastTask.last_error.startsWith('关注成功')" class="text-green-500 inline-block">
                                    <uno-icon class="i-bi:check-circle-fill" style="width: 0.75rem; height: 0.75rem" />
                                </div>
                                <div v-else-if="taskInfo.lastTask.status === 0 && taskInfo.lastTask.date === 0" class="text-orange-500 inline-block">
                                    <uno-icon class="i-bi:clock-history" style="width: 0.75rem; height: 0.75rem" />
                                </div>
                                <div v-else class="text-pink-500 inline-block">
                                    <uno-icon class="i-bi:exclamation-circle-fill" style="width: 0.75rem; height: 0.75rem" />
                                </div>
                                <span class="ml-1">{{ getPubDate(new Date(taskInfo.lastTask.date * 1000)) }}</span>
                            </div>
                            <div v-if="taskInfo.lastTask">
                                <div class="w-full h-1 bg-gray-400 dark:bg-gray-600 rounded-full relative">
                                    <div
                                        :class="{
                                            'h-1 rounded-full absolute l-0 transition-colors': true,
                                            'bg-sky-600 dark:bg-sky-400': now < taskInfo.lastTask.date + tasksConfig.pid_cooldown_time,
                                            'bg-green-600 dark:bg-green-400': now >= taskInfo.lastTask.date + tasksConfig.pid_cooldown_time
                                        }"
                                        :style="{ width: clamp(Number((((Number(now.toFixed(0)) - taskInfo.lastTask.date) / tasksConfig.pid_cooldown_time) * 100).toFixed(0)), 0, 100) + '%' }"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="px-3 py-3">
                    <Modal class="inline-block mr-1" title="贴吧列表" aria-label="贴吧列表">
                        <template #default>
                            <button class="rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1 text-gray-900 dark:text-gray-100 transition-colors text-sm">贴吧列表</button>
                        </template>
                        <template #container>
                            <div v-for="(task, i) in taskInfo.tasks" :key="task.fname">
                                <hr v-if="i > 0" class="border-gray-400 dark:border-gray-600" />
                                <div
                                    :class="{
                                        flex: true,
                                        'justify-between': true,
                                        'py-1': true
                                    }"
                                >
                                    <div class="flex flex-col">
                                        <div>
                                            <NuxtLink class="hover:underline underline-offset-2" :to="`https://tieba.baidu.com/f?kw=${task.fname}`" target="blank">{{ task.fname }}</NuxtLink>
                                        </div>
                                        <div class="text-xs text-gray-500 block">
                                            <div class="inline-block">
                                                <div v-if="task.status === 0 && task.date > 0 && task.last_error.startsWith('关注成功')" class="text-green-500 inline-block mr-1">
                                                    <uno-icon class="i-bi:check-circle-fill" style="width: 0.75rem; height: 0.75rem" />
                                                </div>
                                                <div v-else-if="task.status !== 0 && task.date > 0" class="text-pink-500 inline-block mr-1">
                                                    <uno-icon class="i-bi:exclamation-circle-fill" style="width: 0.75rem; height: 0.75rem" />
                                                </div>
                                            </div>
                                            <div class="inline-block">
                                                <span v-if="task.status === 0 && task.date > 0 && task.last_error.startsWith('关注成功')" class="text-green-500">{{ task.last_error }}</span>
                                                <span v-else-if="task.status !== 0 && task.date > 0" class="text-pink-500" :title="task.status + '#' + task.last_error" :aria-label="task.status + '#' + task.last_error">{{
                                                    task.status + '#' + task.last_error
                                                }}</span>
                                                <span v-else class="text-orange-500">待关注</span>
                                            </div>
                                            <div class="inline-block ml-1" v-if="task.date > 0">
                                                <span class="dark:text-gray-300 text-gray-700">{{ getPubDate(new Date(task.date * 1000)) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <div v-if="taskStatus(task) === 'failed'" :title="'重置贴吧关注任务：' + task.fname + '@' + pidNameKV[pid]" :aria-label="'重置贴吧关注任务：' + task.fname + '@' + pidNameKV[pid]">
                                            <button @click.stop="resetTask(task.pid, task.id)" class="text-orange-500 inline-block pt-2">
                                                <uno-icon class="i-bi:bootstrap-reboot" style="width: 1.5em; height: 1.5em" />
                                            </button>
                                        </div>
                                        <div :title="'删除贴吧关注任务：' + task.fname + '@' + pidNameKV[pid]" :aria-label="'删除贴吧关注任务：' + task.fname + '@' + pidNameKV[pid]">
                                            <button @click.stop="deleteTask(task.pid, task.id)" class="text-pink-500 inline-block pt-2">
                                                <uno-icon class="i-bi:x-circle-fill" style="width: 1.5em; height: 1.5em" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Modal>

                    <Modal class="inline-block mr-1" :title="'确认清空: @' + pidNameKV[Number(pid)] + ' ？'" :aria-label="'确认清空: @' + pidNameKV[Number(pid)] + ' ？'">
                        <template #default>
                            <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-gray-100 transition-colors text-sm">清空列表</button>
                        </template>
                        <template #container>
                            <button class="bg-pink-500 hover:bg-pink-600 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="deleteTask(Number(pid), 0)">确认删除</button>
                        </template>
                    </Modal>
                </div>
            </div>
        </template>
    </div>
    <SyncModule
        :loading="loading"
        :callback="
            () => {
                getLikeTasksList()
                getSettings()
            }
        "
    />
</template>
