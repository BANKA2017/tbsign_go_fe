<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="rounded-2xl mb-2" v-if="accountInfo">
                <div class="mx-3 my-2">
                    <div class="border-4 border-sky-500 rounded-xl p-2">
                        <h4 class="text-lg font-bold">公告</h4>
                        <hr class="border-gray-400 dark:border-gray-600 my-2" />
                        <div v-if="notifications">
                            <p v-for="(text, line) in notifications.split('\n')" :key="line">{{ text }}</p>
                        </div>
                        <svg class="animate-spin h-5 w-5 dark:text-gray-100 text-sky-500" v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                </div>
                <div class="p-3 flex flex-col justify-between gap-2">
                    <div class="flex flex-col">
                        <div class="flex flex-col 3xs:flex-row justify-start gap-2">
                            <div class="flex flex-col">
                                <span class="text-2xl max-w-[250px] overflow-hidden text-ellipsis">{{ accountInfo.name }}</span>
                                <span class="text-sm max-w-[250px] overflow-hidden text-ellipsis">{{ accountInfo.email }}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <div class="dark:text-gray-100 border-l-4 border-l-sky-500 dark:border-l-sky-800 px-3 py-0.5 mx-1 uppercase font-bold text-sm">{{ accountInfo.role }}</div>
                                <div class="text-sm border-l-4 dark:text-gray-100 border-l-green-600 dark:border-l-green-800 px-3 py-0.5 mx-1 uppercase font-bold">uid: {{ accountInfo.uid }}</div>
                            </div>
                        </div>
                    </div>
                    <div v-if="tbaccounts.length > 0" class="mt-3 ml-5">
                        <img
                            v-for="tbaccount in tbaccounts"
                            :key="tbaccount.portrait"
                            :src="'https://himg.bdimg.com/sys/portrait/item/' + tbaccount.portrait"
                            :alt="'avatar-' + tbaccount.name + '-' + tbaccount.portrait"
                            :title="tbaccount.name + '的头像'"
                            class="w-14 h-14 transition-all -ml-5 hover:mr-7 rounded-2xl my-1 inline-block ring-2 ring-gray-400 dark:ring-gray-600 bg-gray-300 dark:bg-gray-700"
                            loading="lazy"
                        />
                    </div>
                </div>
                <hr class="border-gray-400 dark:border-gray-600 px-3" />
                <div class="inline-block md:block">
                    <NuxtLink role="button" class="inline-block my-5 px-5 mx-1 rounded-full transition-colors hover:bg-pink-600 dark:hover:bg-pink-400 bg-pink-500 text-gray-100 py-2" to="/login" @click="logout"> 登出 </NuxtLink>
                    <!--<button class="inline-block my-5 px-5 mx-1 rounded-full transition-colors hover:bg-sky-600 dark:hover:bg-sky-400 bg-sky-500 text-gray-100 py-2" @click="exportAccount"> 导出 </button>-->
                </div>
            </div>
        </frame-work>
    </NuxtLayout>
</template>

<script setup lang="ts">
import FrameWork from '../components/FrameWork.vue'

const store = useMainStore()

const accountInfo = computed(() => store._cache?.accountInfo)
const tbaccounts = computed(() => store._cache?.accounts || [])
const notifications = ref<string>('')

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
                if (res.code === 401) {
                    store.logout()
                    navigateTo('/login')
                    return
                }
                if (res.code !== 200) {
                    return
                }
                notifications.value = res.data || '没有公告'
                //console.log(res)
            })
    }
})

const logout = () => {
    fetch(store.basePath + '/passport/logout', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200 && res.code !== 401) {
                return
            }
            store.logout()
            //console.log(res)
            navigateTo('/login')
        })
}

// so, should I add this?
const exportAccount = (password = '') => {
    fetch(store.basePath + '/passport/export', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST',
        body: new URLSearchParams({
            password
        })
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code === 401) {
                store.logout()
                navigateTo('/login')
            }
            if (res.code !== 200) {
                return
            }

            //console.log(res)
        })
}
</script>
