<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'

const store = useMainStore()

const route = useRoute()
const router = useRouter()

const list = computed(() => store._cache?.list)
const accounts = computed(() => store._cache?.accounts)

const callbackLink = computed(() => {
    if (typeof window === 'undefined') {
        return ''
    }
    return window.location.origin + route.fullPath + '?stoken_type=tb'
})

const checkAccountStatus = async () => {
    if (!accounts.value) {
        return
    }
    for (const accountIndex in accounts.value) {
        fetch(store.basePath + '/account/' + accounts.value[accountIndex].id + '/status', {
            headers: {
                Authorization: store.authorization
            }
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.code !== 200) {
                    return
                }
                accounts.value[accountIndex].status = res.data
                console.log(res)
            })
    }
}

const deleteAccount = async (id: string) => {
    fetch(store.basePath + '/account/' + id, {
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
            store.updateCache(
                'accounts',
                accounts.value.filter((item) => item.id !== res.data.pid)
            )
            console.log(res)
        })
}

const str_to_base64url = (text: string) => {
    return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

const cleanTiebaList = async () => {
    fetch(store.basePath + '/list/clean', {
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
            list.value = []
            console.log(res)
        })
}

const tbList = computed(() => {
    if (!list.value || !accounts.value) {
        return {}
    }
    let _list: { [p in string]: any } = {}
    for (const item of list.value) {
        if (!_list[item.pid]) {
            _list[item.pid] = []
        }
        _list[item.pid].push(item)
    }
    return _list
})

const tblistFilter = computed(() => {
    if (Object.keys(tbList.value).length === 0) {
        return {}
    }
    let _list: { [p in number]: any } = {}
    for (const pid in tbList.value) {
        console.log(pid)
        _list[pid] = {
            success: tbList.value[pid].filter((item) => item.status === 0 && new Date().getDate() === item.latest).length,
            failed: tbList.value[pid].filter((item) => item.status !== 0 && new Date().getDate() === item.latest).length,
            pending: tbList.value[pid].filter((item) => new Date().getDate() !== item.latest).length
        }
    }
    return _list
})

const refreshTiebaList = async () => {
    fetch(store.basePath + '/list/refresh', {
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
            list.value = res.data
            console.log(res)
        })
}

onMounted(() => {
    if (route.query.bduss && route.query.stoken && store.authorization) {
        fetch(store.basePath + '/account', {
            headers: {
                Authorization: store.authorization
            },
            method: 'PATCH',
            body: new URLSearchParams({
                bduss: route.query.bduss.toString(),
                stoken: route.query.stoken.toString()
            })
        })
            .then((res) => res.json())
            .then((res) => {
                console.log(res)
                router.replace({ query: {} })
                if (res.code === 201) {
                    accounts.value.push(res.data)
                    return
                } else if (res.code === 200) {
                    for (const accountIndex in accounts.value) {
                        if (accounts.value[accountIndex].portrait === res.data.portrait) {
                            accounts.value[accountIndex] = res.data
                            console.log('find', accountIndex)
                            return
                        }
                    }
                }
            })
    }
    fetch(store.basePath + '/list', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            store.updateCache('list', res.data)
            console.log(res)
        })
})

definePageMeta({
    middleware: ['auth', 'get-accounts']
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="my-1 flex gap-2">
                <NuxtLink :to="`https://bduss.nest.moe/#/` + str_to_base64url(callbackLink)" class="rounded-2xl border-2 px-4 py-1" title="扫码登录并进行绑定或更新">绑定新账号</NuxtLink>
                <button @click="refreshTiebaList" class="rounded-2xl border-2 px-4 py-1" title="刷新贴吧列表">刷新贴吧列表</button>
                <button @click="cleanTiebaList" class="rounded-2xl border-2 px-4 py-1" title="清空贴吧列表">清空贴吧列表</button>
                <button @click="checkAccountStatus" class="rounded-2xl border-2 px-4 py-1" title="检查帐号状态">检查帐号状态</button>
            </div>

            <div class="grid grid-cols-12 gap-2 my-2">
                <div v-for="(account, index) in accounts" :key="account.id" class="bg-gray-100 dark:bg-gray-900 col-span-12 rounded-2xl py-2 px-3">
                    <div class="flex justify-between cursor-pointer sticky top-0 bg-gray-100 dark:bg-gray-900" @click="accounts[index].more = !accounts[index].more">
                        <div class="flex gap-3">
                            <div class="relative">
                                <img :alt="`baidu-avatar-` + account.portrait" :src="`https://himg.bdimg.com/sys/portrait/item/${account.portrait}`" class="w-10 h-10 rounded-full my-1" />
                                <div :class="`h-2 w-2 absolute right-0.5 bottom-0.5 rounded-full ` + (account.status === undefined ? 'bg-gray-500' : account.status ? 'bg-green-500' : 'bg-pink-500')"></div>
                            </div>
                            <div class="">
                                <NuxtLink
                                    class="max-w-[10em] overflow-hidden text-ellipsis whitespace-nowrap hover:underline underline-offset-2"
                                    :title="account.portrait"
                                    :to="`https://tieba.baidu.com/home/main?id=${account.portrait}`"
                                    target="blank"
                                >
                                    {{ account.name }}</NuxtLink
                                >
                                <div class="text-sm">
                                    <span class="text-green-500">{{ tblistFilter[account.id]?.success || 0 }}</span>
                                    /
                                    <span class="text-orange-500">{{ tblistFilter[account.id]?.pending || 0 }}</span> /
                                    <span class="text-pink-500">{{ tblistFilter[account.id]?.failed || 0 }}</span>
                                </div>
                            </div>
                        </div>
                        <div
                            class="flex gap-1"
                            @click="
                                (e) => {
                                    e.stopPropagation()
                                }
                            "
                        >
                            <button @click="deleteAccount(account.id)" class="rounded-full w-10 h-10 bg-transparent hover:bg-pink-500 text-gray-100 dark:text-gray-900 transition-colors p-2 my-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em]" viewBox="0 0 16 16">
                                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div :class="{ 'my-3': true, hidden: !accounts[index].more }">
                        <hr class="mb-3" />
                        <div v-for="(tiebaItem, i) in tbList[account.id]" :key="tiebaItem.id">
                            <hr v-if="i > 0" class="my-1" />
                            <div class="flex justify-between">
                                <div class="flex flex-col">
                                    <NuxtLink class="block hover:underline underline-offset-2" :to="`https://tieba.baidu.com/f?kw=${tiebaItem.tieba}`" target="blank">{{ tiebaItem.tieba }}</NuxtLink>
                                    <span class="text-xs text-gray-500 block">
                                        <span v-if="tiebaItem.status === 0 && new Date().getDate() === tiebaItem.latest" class="text-green-500">已签到</span>
                                        <span v-else-if="new Date().getDate() !== tiebaItem.latest" class="text-orange-500">待签到</span>
                                        <span v-else class="text-pink-500" :title="tiebaItem.status + '#' + tiebaItem.last_error">{{ tiebaItem.status + '#' + tiebaItem.last_error }}</span>
                                    </span>
                                </div>
                                <div class="flex gap-2">
                                    <div>
                                        <svg
                                            v-if="tiebaItem.status === 0 && new Date().getDate() === tiebaItem.latest"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="100%"
                                            height="100%"
                                            fill="currentColor"
                                            class="w-[1.5em] text-green-500"
                                            viewBox="0 0 16 16"
                                        >
                                            <path
                                                fill="currentColor"
                                                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417L5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"
                                            />
                                        </svg>
                                        <svg v-else-if="new Date().getDate() !== tiebaItem.latest" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] text-orange-500" viewBox="0 0 16 16">
                                            <path
                                                fill="currentColor"
                                                d="M2.5 15a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1zm2-13v1c0 .537.12 1.045.337 1.5h6.326c.216-.455.337-.963.337-1.5V2zm3 6.35c0 .701-.478 1.236-1.011 1.492A3.5 3.5 0 0 0 4.5 13s.866-1.299 3-1.48zm1 0v3.17c2.134.181 3 1.48 3 1.48a3.5 3.5 0 0 0-1.989-3.158C8.978 9.586 8.5 9.052 8.5 8.351z"
                                            />
                                        </svg>
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-[1.5em] text-pink-500" viewBox="0 0 16 16">
                                            <path fill="currentColor" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2a1 1 0 0 0 0-2" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <!--{{ tiebaItem }}
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16"><path fill="currentColor" d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5"/></svg>
                    -->
                        </div>
                    </div>
                </div>
            </div>
        </frame-work>
    </NuxtLayout>
</template>

<style scoped></style>
