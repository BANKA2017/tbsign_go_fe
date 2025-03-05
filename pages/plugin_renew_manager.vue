<script setup lang="ts">
import { Eta, getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

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
    Request(store.basePath + '/plugins/kd_renew_manager/list/' + id, {
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
    Request(store.basePath + '/plugins/kd_renew_manager/list', {
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
    }).then((res) => {
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
    Request(store.basePath + '/account/check/' + taskToAdd.value.pid + '/is_manager/' + taskToAdd.value.fname, {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
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
    Request(store.basePath + '/plugins/kd_renew_manager/switch', {
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

const tasksSettings = reactive<{
    report_switch: boolean
    action_interval: number
}>({
    report_switch: false,
    action_interval: 1
})

const saveSettings = () => {
    Request(store.basePath + '/plugins/kd_renew_manager/settings', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: new URLSearchParams({
            report_switch: tasksSettings.report_switch ? '1' : '0',
            action_interval: tasksSettings.action_interval.toString()
        }).toString()
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        tasksSettings.report_switch = res.data?.report_switch || false
        tasksSettings.action_interval = res.data?.action_interval || 1
        //console.log(res)
    })
}

const getRenewTasksList = () => {
    Request(store.basePath + '/plugins/kd_renew_manager/list', {
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
}

onMounted(() => {
    getRenewTasksList()

    Request(store.basePath + '/plugins/kd_renew_manager/switch', {
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

    Request(store.basePath + '/plugins/kd_renew_manager/settings', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        tasksSettings.report_switch = res.data?.report_switch || false
        tasksSettings.action_interval = res.data?.action_interval || 1
        //console.log(res)
    })
    nowIntervalHandle = setInterval(() => {
        now.value = Date.now() / 1000
    }, 500)
})
</script>

<template>
    <div class="px-3 py-2">
        <h4 class="text-lg mb-4">设置</h4>

        <button :class="{ 'bg-sky-500': !tasksSwitch, 'bg-pink-500': tasksSwitch, 'rounded-lg': true, 'px-3': true, 'py-1': true, 'text-gray-100': true, 'transition-colors': true }" @click="updateTasksSwitch">
            {{ tasksSwitch ? '已开启' : '已停止' }}
        </button>

        <div class="my-5">
            <p class="my-2">是否添加到每日报告</p>
            <select v-model="tasksSettings.report_switch" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl">
                <option :value="true">是</option>
                <option :value="false">否</option>
            </select>
            <p class="my-2">执行间隔（天），默认每天执行，可以适当调大间隔避免吧务后台操作记录刷屏</p>
            <input
                type="number"
                min="1"
                max="29"
                class="form-input placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 min-w-[8rem] bg-gray-100 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark] rounded-xl"
                v-model="tasksSettings.action_interval"
            />
        </div>

        <button class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 transition-colors rounded-lg px-3 py-1 text-gray-100" @click="saveSettings">保存</button>
    </div>

    <div class="px-3 py-2">
        <h4 class="text-lg">任务列表</h4>

        <div class="my-5 grid grid-cols-6 gap-2 max-w-[48em]">
            <Modal class="col-span-6 sm:col-span-3 lg:col-span-1" title="添加考核任务">
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
                            <span v-if="!taskToAdd.tid" class="inline-block my-1 underline break-all" target="_blank">https://tieba.baidu.com/p/${tid}</span>
                            <NuxtLink v-else :to="'https://tieba.baidu.com/p/' + taskToAdd.tid" class="inline-block my-1 underline break-all" target="_blank">https://tieba.baidu.com/p/{{ taskToAdd.tid }}</NuxtLink>
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
                    <span class="font-bold">吧主账号 : </span><NuxtLink class="font-mono hover:underline underline-offset-1" :to="'https://tieba.baidu.com/home/main?un=' + pidNameKV[task.pid]" target="blank">{{ pidNameKV[task.pid] }}</NuxtLink>
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

            <hr class="border-gray-400 dark:border-gray-600 my-3" />
            <Modal class="inline-block mr-1" :title="'确认删除考核任务: ' + task.fname + '@' + pidNameKV[task.pid] + ' ？'" :aria-label="'确认删除考核任务: ' + task.fname + '@' + pidNameKV[task.pid] + ' ？'">
                <template #default>
                    <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-gray-100 transition-colors">删除</button>
                </template>
                <template #container>
                    <button class="bg-pink-500 hover:bg-pink-600 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="deleteTask(task.id)">确认删除</button>
                </template>
            </Modal>
            <Modal class="mx-1 inline-block" title="日志">
                <template #default>
                    <button class="rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1 text-gray-900 dark:text-gray-100 transition-colors" title="日志">日志</button>
                </template>
                <template #container>
                    <ul class="marker:text-sky-500 list-disc list-inside gap-3 ml-5">
                        <li class="break-all" v-for="(log_, i) in task.log.split('<br />')" :key="task.pid.toString() + '_' + task.fid + i" v-show="log_">{{ log_ }}</li>
                    </ul>
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
        @click="getRenewTasksList"
    >
        <uno-icon :class="{ 'i-bi:arrow-clockwise': true, 'animate-spin': loading }" />
    </div>
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
