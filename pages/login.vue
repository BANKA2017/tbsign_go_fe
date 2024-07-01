<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="flex justify-center">
                <form class="rounded-2xl p-2 grow flex flex-col gap-2 max-w-[32em]">
                    <label for="endpoint">API 端点</label>
                    <select id="endpoint" class="bg-gray-100 dark:bg-black rounded-xl" v-model="basePath">
                        <option v-for="endpoint in endpointList" :key="endpoint" :value="endpoint">{{ endpoint }}</option>
                    </select>
                    <NuxtLink to="add_base_path" class="text-sm underline underline-offset-2">添加端点</NuxtLink>
                    <label for="email">帐号</label>
                    <input class="bg-gray-100 dark:bg-black rounded-xl" id="email" type="text" name="email" placeholder="邮箱/用户名" v-model="account" />
                    <label for="password">密码</label>
                    <input class="bg-gray-100 dark:bg-black rounded-xl" autocomplete="current-password" id="password" type="password" name="password" placeholder="密码" v-model="password" />
                    <input type="submit" role="button" class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 text-xl transition-colors" @click="sendLogin" value="登录" />
                </form>
            </div>
        </frame-work>
    </NuxtLayout>
</template>
<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { Notice } from '~/share/Tools'

const store = useMainStore()
const endpointList = computed(() => Object.keys(store.config))

const account = ref<string>('')
const password = ref<string>('')

const basePath = computed({
    get() {
        return store._basePath
    },
    set(value: string) {
        localStorage.setItem('tc_base_path', value)
        store.updateValue('_basePath', value)
    }
})

watch(basePath, () => {
    store.updateCache('config_page_login', undefined)
    store.updateValue('loading', true)
    fetch(store.basePath + '/config/page/login')
        .then((res) => res.json())
        .then((res) => {
            store.updateValue('loading', false)
            if (res.code !== 200) {
                return
            }
            store.updateCache('config_page_login', res.data)
            //console.log(res)
        })
        .catch((e) => {
            store.updateValue('loading', false)
            Notice(e.toString(), 'error')
            console.error(e)
        })
})

const sendLogin = (e: Event) => {
    e.preventDefault()
    store.updateValue('loading', true)
    if (!(account.value && password.value)) {
        store.updateValue('loading', false)
        return
    }
    fetch(store.basePath + '/passport/login', {
        method: 'POST',
        body: new URLSearchParams({
            account: account.value,
            password: password.value
        })
    })
        .then((res) => res.json())
        .then((res) => {
            store.updateValue('loading', false)
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            Notice('登录成功', 'success')
            if (res.data.token) {
                store.updateAuthorization(res.data.token)
                navigateTo('/')
            }
        })
        .catch((e) => {
            store.updateValue('loading', false)
            Notice(e.toString(), 'error')
            console.error(e)
        })
}
</script>
