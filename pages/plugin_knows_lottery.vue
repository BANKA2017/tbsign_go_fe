<script setup lang="ts">
import { getPubDate } from '~/share/Time'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const accounts = computed(() => store.cache?.accounts)
const loading = computed(() => store.loading)

const pidNameKV = computed(() => store.pidNameKV)

const activePID = ref<number>(0)
const lotterySwitch = ref<boolean>(false)
const lotteryLogs = ref<any[]>([])

watch(accounts, () => {
    if (Array.isArray(accounts.value) && accounts.value.length > 0 && activePID.value <= 0) {
        activePID.value = accounts.value[0].id
    }
})

const activeLogs = computed(() => {
    return lotteryLogs.value.filter((x) => x.pid === activePID.value)
})

const updateTasksSwitch = () => {
    Request(store.basePath + '/plugins/ver4_lottery/switch', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        lotterySwitch.value = res.data
        //console.log(res)
    })
}

const getLogs = () => {
    Request(store.basePath + '/plugins/ver4_lottery/log', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        lotteryLogs.value = res.data
        //console.log(res)
    })
}

onMounted(() => {
    if (Array.isArray(accounts.value) && accounts.value.length > 0 && activePID.value <= 0) {
        activePID.value = accounts.value[0].id
    }
    getLogs()
    Request(store.basePath + '/plugins/ver4_lottery/switch', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            Notice(res.message, 'error')
            return
        }
        lotterySwitch.value = res.data
        //console.log(res)
    })
})
</script>

<template>
    <div class="px-3 py-2">
        <h4 class="text-lg mb-4">设置</h4>
        <button :class="{ 'bg-sky-500': !lotterySwitch, 'bg-pink-500': lotterySwitch, 'rounded-lg': true, 'px-3': true, 'py-1': true, 'text-gray-100': true, 'transition-colors': true }" @click="updateTasksSwitch">
            {{ lotterySwitch ? '已开启抽奖' : '已停止抽奖' }}
        </button>
    </div>

    <div class="px-3 py-2">
        <h4 class="text-lg">最近 30 天抽奖记录</h4>

        <button
            :class="{
                'px-3': true,
                'py-1': true,
                'rounded-lg': true,
                'mr-2': true,
                'my-2': true,
                'bg-sky-500': activePID === account.id,
                'hover:bg-sky-500': true,
                'hover:text-gray-100': true,
                'text-gray-100': activePID === account.id,
                'transition-colors': true
            }"
            v-for="account in accounts"
            :key="account.id"
            @click="activePID = account.id"
        >
            {{ account.name }}
        </button>

        <div class="bg-gray-300 dark:bg-gray-700 rounded-xl p-3 my-2 grid grid-cols-3 gap-2" v-for="log in activeLogs" :key="log.id">
            <div class="col-span-3 md:col-span-1 flex">
                <SvgCheck class="inline-block" height="1.5rem" width="1.2rem" v-if="log.result === ''" />
                <SvgCross class="inline-block" height="1.5rem" width="1.2rem" v-else />
                <span class="ml-2 inline-block grow truncate">{{ pidNameKV[log.pid] }} </span>
            </div>
            <div :class="{ underline: log.result !== '', 'underline-offset-2': true, 'decoration-pink-500': true, 'decoration-wavy': log.result !== '', 'col-span-3': true, 'md:col-span-1': true }">
                {{ log.result === '' ? log.prize : log.result }}
            </div>
            <div class="col-span-3 md:col-span-1">{{ getPubDate(new Date(log.date * 1000)) }}</div>
        </div>

        <hr class="my-10 border-gray-400 dark:border-gray-600" />
        <a href="https://zhidao.baidu.com/ihome/homepage/myitem" target="_blank" class="underline underline-offset-2">查看物品</a>
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
        @click="getLogs"
    >
        <uno-icon :class="{ 'i-bi:arrow-clockwise': true, 'animate-spin': loading }" />
    </div>
</template>

<style scoped></style>
