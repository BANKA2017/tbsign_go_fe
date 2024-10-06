<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { Eta, getPubDate } from '~/share/Time'
import { Notice } from '~/share/Tools'

const store = useMainStore()
const pidNameKV = computed(() => store.pidNameKV)
const loading = computed(() => store.loading)
const now = ref<number>(0)
let nowIntervalHandle: any = null

const tasksList = ref<
    {
        id: number
        pid: number
        uid: number
        fname: string
        fid: number
        tid: string
        status: string
        date: number
        end: number
        log: string
    }[]
>([])

const taskToAdd = ref<{
    pid: number
    fname: string
    tid: string
}>({
    pid: 0,
    fname: '',
    tid: ''
})

const deleteTask = (id = 0) => {
    if (id <= 0) {
        return
    }
    fetch(store.basePath + '/plugins/kd_renew_manager/list/' + id, {
        headers: {
            Authorization: store.authorization
        },
        method: 'DELETE'
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
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
    fetch(store.basePath + '/plugins/kd_renew_manager/list', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PATCH',
        body: new URLSearchParams({
            pid: taskToAdd.value.pid.toString(),
            fname: taskToAdd.value.fname,
            tid: taskToAdd.value.tid
        }).toString()
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
            if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
                Notice(res.message, 'error')
                return
            }
            Notice(res.message, 'success')
            tasksList.value.push(res.data)
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
    fetch(store.basePath + '/account/check/' + taskToAdd.value.pid + '/is_manager/' + taskToAdd.value.fname, {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            if (res.data?.is_manager && res.data?.role === '吧主') {
                isManagerMessage.value = '此账号是 ' + taskToAdd.value.fname + ' 吧吧主'
            } else {
                isManagerMessage.value = '此账号不是 ' + taskToAdd.value.fname + ' 吧吧主'
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
    if (nowIntervalHandle) {
        clearInterval(nowIntervalHandle)
    }
})

const tasksSwitch = ref<boolean>(false)

const updateTasksSwitch = () => {
    fetch(store.basePath + '/plugins/kd_renew_manager/switch', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            tasksSwitch.value = res.data
            //console.log(res)
        })
}

const tasksAlertSwitch = ref<boolean>(false)

const updateAlertTasksSwitch = () => {
    fetch(store.basePath + '/plugins/kd_renew_manager/alert/switch', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            tasksAlertSwitch.value = res.data
            //console.log(res)
        })
}

const getRenewTasksList = () => {
    store.updateValue('loading', true)
    fetch(store.basePath + '/plugins/kd_renew_manager/list', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            store.updateValue('loading', false)
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
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
            store.updateValue('loading', false)
        })
}

onMounted(() => {
    getRenewTasksList()

    fetch(store.basePath + '/plugins/kd_renew_manager/switch', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            tasksSwitch.value = res.data
            //console.log(res)
        })

    fetch(store.basePath + '/plugins/kd_renew_manager/alert/switch', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                Notice(res.message, 'error')
                store.logout()
                navigateTo('/login')
                return
            }
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            tasksAlertSwitch.value = res.data
            //console.log(res)
        })
    nowIntervalHandle = setInterval(() => {
        now.value = Date.now() / 1000
    }, 500)
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="px-3 py-2">
                <h4 class="text-lg mb-4">设置</h4>

                <button :class="{ 'bg-sky-500': !tasksSwitch, 'bg-pink-500': tasksSwitch, 'rounded-lg': true, 'px-3': true, 'py-1': true, 'text-gray-100': true, 'transition-colors': true }" @click="updateTasksSwitch">
                    {{ tasksSwitch ? '已开启' : '已停止' }}
                </button>

                <div class="my-5">
                    <p class="my-2">根据设置，当本地记录时间小于15天将会每天推送手动完成任务提醒</p>
                    <button :class="{ 'bg-sky-500': !tasksAlertSwitch, 'bg-pink-500': tasksAlertSwitch, 'rounded-lg': true, 'px-3': true, 'py-1': true, 'text-gray-100': true, 'transition-colors': true }" @click="updateAlertTasksSwitch">
                        {{ tasksAlertSwitch ? '已开启推送' : '已停止推送' }}
                    </button>
                </div>
            </div>

            <div class="px-3 py-2">
                <h4 class="text-lg">任务列表</h4>

                <div class="my-5 grid grid-cols-6 gap-2 max-w-[48em]">
                    <Modal class="col-span-6 sm:col-span-3 lg:col-span-1" title="添加封禁账号">
                        <template #default>
                            <button class="w-full rounded-2xl border-2 border-gray-300 hover:bg-gray-300 px-4 py-1 hover:text-black transition-colors" title="添加封禁账号">添加账号</button>
                        </template>
                        <template #container>
                            <div class="my-2">
                                <label for="pid-to-froum-manager">吧主账号</label>
                                <select id="pid-to-froum-manager" v-model="taskToAdd.pid" class="bg-gray-200 dark:bg-gray-900 dark:text-gray-100 form-select block w-full my-3 rounded-xl">
                                    <option v-for="(name, pid) in pidNameKV" :key="pid" :value="pid">{{ name }}</option>
                                </select>
                            </div>

                            <div class="my-2">
                                <label for="froum-name">贴吧名称</label>
                                <input id="froum-name" class="form-input bg-gray-200 dark:bg-gray-900 w-full rounded-xl" type="text" v-model="taskToAdd.fname" placeholder="输入贴吧名（不带末尾吧字）" />
                                <span class="text-sm my-1">{{ isManagerMessage }}</span>
                            </div>

                            <div class="my-2">
                                <label for="end-date">帖子 ID</label>
                                <p class="text-sm my-1">
                                    通过对
                                    <span v-if="!taskToAdd.tid" class="inline-block text-gray-200 my-1 underline break-all" target="_blank">https://tieba.baidu.com/p/${tid}</span>
                                    <NuxtLink v-else :to="'https://tieba.baidu.com/p/' + taskToAdd.tid" class="inline-block text-gray-200 my-1 underline break-all" target="_blank">https://tieba.baidu.com/p/{{ taskToAdd.tid }}</NuxtLink>
                                    进行吧务操作重置倒计时，请选择可靠可信的帖子
                                </p>

                                <input id="end-date" class="form-input bg-gray-200 dark:bg-gray-900 dark:[color-scheme:dark] w-full rounded-xl" type="text" v-model="taskToAdd.tid" placeholder="tid" />
                            </div>

                            <button class="px-3 py-1 rounded-lg my-2 bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 text-gray-100 transition-colors" @click="addTask">保存</button>
                        </template>
                    </Modal>
                </div>
                <div class="border-4 border-gray-400 dark:border-gray-700 rounded-xl p-5 my-3" v-for="task in tasksList" :key="task.pid.toString() + '_' + task.fname">
                    <div class="text-sm progress bg-gray-300 dark:bg-gray-700">
                        <div :style="{ width: Math.ceil((1 - (task.end - now) / (30 * 24 * 60 * 60)) * 100) + '%' }" :class="{ 'progress-bar': true, 'bg-sky-500': true }"></div>
                        <div class="progress-data">
                            <span class="font-bold">{{ Eta(now, task.end) }}</span>
                        </div>
                    </div>
                    <ul class="marker:text-sky-500 list-disc list-inside">
                        <li>
                            <!--TODO use portrait-->
                            <span class="font-bold">吧主账号 : </span
                            ><NuxtLink class="font-mono hover:underline underline-offset-1" :to="'https://tieba.baidu.com/home/main?un=' + pidNameKV[task.pid]" target="blank">{{ pidNameKV[task.pid] }}</NuxtLink>
                        </li>
                        <li>
                            <span class="font-bold">执行贴吧 : </span><NuxtLink class="font-mono hover:underline underline-offset-1" :to="'https://tieba.baidu.com/f?ie=utf-8&kw=' + task.fname" target="blank">{{ task.fname }}</NuxtLink>
                        </li>
                        <li>
                            <span class="font-bold">考核截止 : </span
                            ><NuxtLink class="font-mono hover:underline underline-offset-1" :to="'https://tieba.baidu.com/mo/q/bawu/taskinfoview?tbioswk=1&fid=' + task.fid" target="blank">{{ getPubDate(new Date(task.end * 1000)) }}</NuxtLink>
                        </li>
                        <li>
                            <span class="font-bold">任务帖子 : </span
                            ><span class="font-mono"
                                ><NuxtLink class="font-mono underline underline-offset-2" :to="'https://tieba.baidu.com/p/' + task.tid" target="blank">{{ task.tid }}</NuxtLink></span
                            >
                        </li>
                        <li>
                            <span class="font-bold">上次结果 : </span><span class="font-mono">{{ task.status }}</span>
                        </li>
                        <li>
                            <span class="font-bold">上次执行 : </span><span class="font-mono">{{ getPubDate(new Date(task.date * 1000)) }}</span>
                        </li>
                    </ul>

                    <details class="marker:text-sky-500">
                        <summary class="cursor-pointer"><span class="font-bold ml-1">日志</span></summary>
                        <ul class="marker:text-sky-500 list-disc list-inside gap-3 ml-5">
                            <li class="break-all" v-for="(log_, i) in task.log.split('<br />')" :key="task.pid.toString() + '_' + task.fid + i" v-show="log_">{{ log_ }}</li>
                        </ul>
                    </details>
                    <hr class="border-gray-400 dark:border-gray-600 my-3" />
                    <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-gray-100 transition-colors" @click="deleteTask(task.id)">删除</button>
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
                @click="getRenewTasksList"
            >
                <svg :class="{ 'animate-spin': loading }" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
                    <g fill="currentColor">
                        <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
                        <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182a.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z" />
                    </g>
                </svg>
            </div>
        </frame-work>
    </NuxtLayout>
</template>

<style scoped lang="scss">
.progress {
    height: 2em;
    font-size: 1em;
    border-radius: 0.375em;
    position: relative;
    width: 100%;
    margin-bottom: 0.375em;
    & > .progress-data {
        position: absolute;
        padding: 0.35em 0.75em;
        display: flex;
        justify-content: space-between;
        width: 100%;
        height: 100%;
    }
    & > .progress-bar {
        position: absolute;
        height: 100%;
        border-radius: 0.375em;
    }
}
</style>
