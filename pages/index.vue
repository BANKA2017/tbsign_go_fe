<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="rounded-2xl mb-2" v-if="accountInfo">
                <div class="mx-3 my-2">
                    <div class="border border-sky-500 border-l-8 rounded-xl p-2">
                        <h4 class="text-lg font-bold">公告</h4>
                        <hr class="my-2" />
                        <p v-if="notifications">{{ notifications }}</p>
                        <svg class="animate-spin h-5 w-5 dark:text-white text-sky-500" v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                </div>
                <div class="px-3 py-2">
                    <span class="text-lg">账号信息</span>
                </div>
                <div class="p-3 flex justify-between gap-2">
                    <div class="flex flex-col">
                        <span class="text-2xl">
                            {{ accountInfo.name }}
                            <span class="text-sm rounded-full text-white bg-green-600 dark:bg-green-800 px-2 mx-1">uid: {{ accountInfo.uid }}</span>
                            <span class="text-sm rounded-full text-white bg-sky-600 dark:bg-sky-800 px-2 mx-1">role: {{ accountInfo.role }}</span>
                        </span>
                        <span class="text-sm">{{ accountInfo.email }}</span>
                    </div>
                    <img :src="gravatarImg" alt="gravatar-avatar" class="w-20 h-20 rounded-2xl my-1" />
                </div>
                <hr class="px-3" />
                <div class="inline-block md:block">
                    <NuxtLink class="inline-block my-5 px-5 mx-1 rounded-full transition-colors hover:bg-pink-600 dark:hover:bg-pink-400 bg-pink-500 text-white py-2" to="/login" @click="logout"> 登出 </NuxtLink>
                </div>
                <!--<div class="px-3 py-2">
                                <span class="text-lg">签到状态</span>
                            </div>
                            <div class="py-4">
                                <ul class="marker:text-sky-400 list-disc pl-5 space-y-1">
                                    <li>百度账号数： {{ accountInfo.account.length }} 个</li>
                                    <li>贴吧个数： {{ accountInfo.list.flat().length }} 个</li>
                                    <li>签到状态：已签到 {{ accountInfo.list.flat().filter(x => x.status === 0 && x.latest === Number(new Date().toLocaleDateString('zh-CN', {timeZone: 'Asia/Shanghai'}).split('/')[2])).length }} 个贴吧，{{ accountInfo.list.flat().filter(x => x.status !== 0 && x.latest === Number(new Date().toLocaleDateString('zh-CN', {timeZone: 'Asia/Shanghai'}).split('/')[2])).length }} 个出错， {{ accountInfo.list.flat().filter(x => x.latest !== Number(new Date().toLocaleDateString('zh-CN', {timeZone: 'Asia/Shanghai'}).split('/')[2])).length }} 个贴吧等待签到</li>
                                </ul>
                            </div>-->
            </div>
        </frame-work>
    </NuxtLayout>
</template>

<script setup lang="ts">
import FrameWork from '../components/FrameWork.vue'

const store = useMainStore()

const accountInfo = computed(() => store._cache?.accountInfo)
const gravatarImg = ref('')
const notifications = ref<string>('')

const sha256sum = async (text) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map((x) => x.toString(16).padStart(2, '0')).join('')
watch(
    accountInfo,
    async () => {
        gravatarImg.value = `https://www.gravatar.com/avatar/${await sha256sum(accountInfo.value.email)}`
    },
    { deep: true }
)

onMounted(async () => {
    // get account info
    if (store.rawAuthorization !== '') {
        fetch(store.basePath + '/notifications', {
            headers: {
                Authorization: store.authorization
            }
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.code !== 200) {
                    return
                }
                notifications.value = res.data || '没有公告'
                console.log(res)
            })
    }
    if (accountInfo.value.email) {
        gravatarImg.value = `https://www.gravatar.com/avatar/${await sha256sum(accountInfo.value.email)}`
    }
})

const logout = () => {
    store.logout()
}

definePageMeta({
    middleware: ['auth', 'init-cache']
})
</script>
