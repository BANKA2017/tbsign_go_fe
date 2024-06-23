<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'

definePageMeta({
    middleware: ['auth', 'get-accounts']
})

const store = useMainStore()
const accounts = computed(() => store._cache?.accounts)

const pidNameKV = computed(() => Object.fromEntries(accounts.value.map((account) => [account.id, account.name])))

const tasksList = ref<
    {
        date: number
        fid: number
        id: number
        log: string
        name: string
        nid: string
        pid: number
        tieba: string
        uid: number
    }[]
>([])

const list = ref<
    {
        fid: string
        name: string
        nid: number
        tieba: string
    }[]
>([])

const tasksSwitch = ref<boolean>(false)

const updateTasks = (taskID = -1) => {
    if (taskID <= 0) {
        console.error('Invalid task id')
    }
    fetch(store.basePath + '/plugins/forum_support/settings', {
        headers: {
            Authorization: store.authorization
        },
        method: 'PUT'
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            tasksList.value = res.data
            console.log(res)
        })
}

const updateTasksSwitch = () => {
    fetch(store.basePath + '/plugins/forum_support/switch', {
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
    fetch(store.basePath + '/plugins/forum_support/settings', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            tasksList.value = res.data
            console.log(res)
        })
    fetch(store.basePath + '/plugins/forum_support/switch', {
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

    fetch(store.basePath + '/plugins/forum_support/list', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            list.value = res.data
            console.log(res)
        })
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="px-3 py-2">
                <h4 class="text-lg mb-4">设置</h4>
                <button :class="{ 'bg-sky-500': !tasksSwitch, 'bg-pink-500': tasksSwitch, 'rounded-lg': true, 'px-3': true, 'py-1': true }" @click="updateTasksSwitch">{{ tasksSwitch ? '停止助攻' : '开启助攻' }}</button>
            </div>

            <div class="px-3 py-2">
                <h4 class="text-lg">任务列表</h4>

                <div class="border border-sky-500 rounded-xl p-5 my-3" v-for="task in tasksList" :key="task.id">
                    <li class="marker:text-sky-500">
                        <span class="font-bold">序号 : </span><span class="font-mono">{{ task.id }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">贴吧账号 : </span><span class="font-mono">{{ pidNameKV[task.pid] }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">贴吧 : </span><a class="font-mono hover:underline underline-offset-1" :href="'https://tieba.baidu.com/f?ie=utf-8&kw=' + task.tieba" target="blank">{{ task.tieba }}</a>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">名人 : </span><span class="font-mono">{{ task.name }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">上次执行 : </span><span class="font-mono">{{ new Date(task.date * 1000) }}</span>
                    </li>
                    <details class="marker:text-sky-500 cursor-pointer">
                        <summary><span class="font-bold ml-1">日志</span></summary>
                        <li class="marker:text-sky-500 ml-3" v-for="(log_, i) in task.log.split('<br/>').filter((x) => x)" :key="task.id + i">{{ log_ }}</li>
                    </details>
                    <!--<hr class="my-3"/>
                <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 rounded-lg px-3 py-1" @click="() => {}">删除</button>-->
                </div>
            </div>
        </frame-work>
    </NuxtLayout>
</template>

<style scoped></style>
