<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const pidNameKV = computed(() => store.pidNameKV)
const loading = computed(() => store.loading)

const settings = ref<{ checkin_only: '0' | '1'; vip_matrix: '0' | '1' }>({ checkin_only: '0', vip_matrix: '0' })
const selectedPID = ref<number>(0)

const tasksList = ref<
    {
        date: number
        id: number
        log: string
        pid: number
        status: string
        uid: number
    }[]
>([])
const tasksSignDayKV = computed(() =>
    Object.fromEntries(
        tasksList.value.map((task, index) => {
            let signDay = -1
            try {
                signDay = JSON.parse(task.status).find((task) => task.task_id === 1)?.sign_day || 0
            } catch {}
            return [index, signDay]
        })
    )
)

const canSelectPIDList = computed(() => Object.fromEntries(Object.entries(pidNameKV.value).filter((x) => !tasksList.value.find((y) => y.pid.toString() === x[0]))))

const saveSettings = () => {
    Request(store.basePath + '/plugins/kd_wenku_tasks/settings', {
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

const deleteTask = (id = 0) => {
    if (id <= 0) {
        return
    }
    Request(store.basePath + '/plugins/kd_wenku_tasks/list/' + id, {
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
            Notice('已删除任务 ' + id, 'success')
            tasksList.value = tasksList.value.filter((x) => x.id.toString() !== res.data.id)
        } else {
            Notice(res.message, 'error')
        }
        //console.log(res)
    })
}

const addTask = () => {
    if (selectedPID.value <= 0) {
        return
    }
    Request(store.basePath + '/plugins/kd_wenku_tasks/list', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'PATCH',
        body: new URLSearchParams({ pid: selectedPID.value.toString() }).toString()
    }).then((res) => {
        if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
            Notice(res.message, 'error')
            return
        }
        Notice('已添加 pid:' + selectedPID.value, 'success')
        tasksList.value.push(res.data)
        selectedPID.value = 0
        //console.log(res)
    })
}

const getTasksList = () => {
    Request(store.basePath + '/plugins/kd_wenku_tasks/list', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            tasksList.value = res.data
            //console.log(res)
        })
        .catch((e) => {
            console.error(e)
            Notice(e.toString(), 'error')
        })
}

const claimVIP = (pid: number = 0) => {
    Request(store.basePath + '/plugins/kd_wenku_tasks/claim/' + pid, {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        if (!res.data?.data?.prize?.name) {
            Notice('未知错误', 'error')
            console.log(res.data)
        } else {
            Notice('@' + pidNameKV.value[pid] + '已领取' + res.data.data.prize.name, 'success', 0)
        }

        //console.log(res)
    })
}

const _atob = (s: string = '') => atob(s)

onMounted(() => {
    getTasksList()
    Request(store.basePath + '/plugins/kd_wenku_tasks/settings', {
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
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-2">使用此插件可能会导致文库签到功能被封禁，封禁理由为：<span class="font-bold">您的账号因涉嫌刷分作弊而被封禁，不能进行此项操作</span></div>
            <div class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-5">
                不支持自动领取 VIP，当任务的右上角出现 <span class="inline-block px-2 rounded bg-yellow-500 text-black font-bold">VIP</span> 时，请手动登录对应账号，然后访问
                <a :href="_atob('aHR0cHM6Ly90YW5iaS5iYWlkdS5jb20vaDVhcHB0b3BpYy9icm93c2UvbG90dGVyeXZpcDIwMjIxMQ')" target="_blank" class="underline underline-offset-2">签到7天抽奖</a> 抽取 VIP
            </div>
            <div class="px-3 py-2">
                <h4 class="text-lg mb-4">设置</h4>

                <div class="my-5">
                    <p class="my-2">默认只做签到任务，选择全部任务将会尝试完成所有任务</p>
                    <select v-model="settings.checkin_only" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl">
                        <option value="1">仅签到</option>
                        <option value="0">全部任务</option>
                    </select>
                    <p class="my-2">构建文库 VIP 账号组。账号不足会导致 VIP 无法覆盖每一天，建议至少准备 7 个账号（当前账号数量：{{ tasksList.length }}）</p>
                    <select v-model="settings.vip_matrix" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl">
                        <option value="1">启用 VIP 账号组</option>
                        <option value="0">禁用 VIP 账号组</option>
                    </select>
                </div>

                <button class="bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 rounded-lg px-3 py-1 text-gray-100 transition-colors" @click="saveSettings">保存</button>
            </div>

            <div class="px-3 py-2">
                <h4 class="text-lg">任务列表</h4>

                <div class="marker:text-sky-500 my-5" v-if="Object.keys(canSelectPIDList).length">
                    <label for="pid-to-add">添加</label>
                    <select id="pid-to-add" v-model="selectedPID" class="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 form-select rounded-xl block w-full my-3">
                        <option v-for="(name, pid) in canSelectPIDList" :key="pid" :value="pid">{{ name }}</option>
                    </select>

                    <button class="px-3 py-1 rounded-lg my-2 bg-sky-500 text-gray-100" @click="addTask">保存</button>
                </div>

                <div class="border-4 border-gray-400 dark:border-gray-700 rounded-xl p-5 my-3 relative" v-for="(task, index) in tasksList" :key="task.id">
                    <span v-if="tasksSignDayKV[index] === 7" class="absolute right-4 top-4 px-2 rounded bg-yellow-500 text-black font-bold">VIP</span>
                    <ul class="marker:text-sky-500 list-disc list-inside">
                        <li>
                            <span class="font-bold">序号 : </span><span class="font-mono">{{ task.id }}</span>
                        </li>
                        <li>
                            <span class="font-bold">贴吧账号 : </span><span class="font-sans">{{ pidNameKV[task.pid] }}</span>
                        </li>
                        <li>
                            <span class="font-bold">上次执行 : </span><span class="font-mono">{{ getPubDate(new Date(task.date * 1000)) }}</span>
                        </li>
                        <li>
                            <span class="font-bold">状态 : </span>
                            <ul v-if="task.status && task.status.startsWith('[')" class="grid grid-cols-6 gap-x-5 marker:text-sky-500 list-disc list-inside">
                                <li class="ml-5 col-span-6 md:col-span-3 lg:col-span-2" v-for="taskStatus in JSON.parse(task.status)" :key="task.pid + '_' + taskStatus.name">
                                    <SvgCheck v-if="taskStatus.task_status === 3" height="1em" width="1em" class="inline-block mr-1" title="完成" />
                                    <SvgCross v-else height="1em" width="1em" class="inline-block mr-1" :title="taskStatus.task_status === 2 ? '完成未领取' : '未完成'" />
                                    <span :class="{ 'font-bold': true }">{{ taskStatus.task_name }}{{ taskStatus.sign_day !== undefined ? ` / 第 ${taskStatus.sign_day} 天` : '' }}</span>
                                </li>
                            </ul>
                            <span v-else class="font-mono">{{ task.status }}</span>
                        </li>
                    </ul>

                    <details class="marker:text-sky-500">
                        <summary class="cursor-pointer"><span class="font-bold ml-1">最近30天日志</span></summary>
                        <ul class="marker:text-sky-500 list-disc list-inside gap-3 ml-5">
                            <li class="break-all" v-for="(log_, i) in task.log.split('<br/>').filter((x) => x)" :key="task.id + i">{{ log_ }}</li>
                        </ul>
                    </details>
                    <hr class="border-gray-400 dark:border-gray-600 my-3" />
                    <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1 text-gray-100 transition-colors mr-1" @click="deleteTask(task.id)">删除</button>
                    <button v-if="tasksSignDayKV[index] === 7" class="border-2 border-sky-500 hover:bg-sky-500 rounded-lg px-3 py-1 dark:text-gray-100 hover:text-gray-100 transition-colors" @click="claimVIP(task.pid)">领取 VIP</button>
                </div>
                <hr class="my-10 border-gray-400 dark:border-gray-600" />
                <ul class="marker:text-sky-500 list-disc list-inside gap-3 ml-5">
                    <li><a :href="_atob('aHR0cHM6Ly90YW5iaS5iYWlkdS5jb20vaDUtYnVzaW5lc3MvYnJvd3NlL2RhaWx5Y2hlY2tpbj9hcHBfdmVyPTkuMC43MA')" target="_blank" class="underline underline-offset-2">查看任务</a></li>
                    <li><a :href="_atob('aHR0cHM6Ly90YW5iaS5iYWlkdS5jb20vaDVhcHB0b3BpYy9icm93c2UvbG90dGVyeXZpcDIwMjIxMQ')" target="_blank" class="underline underline-offset-2">签到7天抽奖</a></li>
                </ul>
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
                @click="getTasksList"
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

<style scoped></style>
