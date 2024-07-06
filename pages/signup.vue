<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="flex justify-center">
                <form class="rounded-2xl p-5 flex grow flex-col gap-2 max-w-[32em]">
                    <span v-if="runtimeConfig.public.NUXT_BASE_PATH === ''" class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-10">正在注册 {{ basePath }}</span>
                    <label for="name">用户名</label>
                    <input class="bg-gray-100 dark:bg-gray-900 rounded-xl" id="name" type="text" placeholder="用户名" v-model="name" />
                    <label for="email">邮箱</label>
                    <input class="bg-gray-100 dark:bg-gray-900 rounded-xl" id="email" type="email" placeholder="邮箱" v-model="email" />
                    <label for="password">密码</label>
                    <input class="bg-gray-100 dark:bg-gray-900 rounded-xl" autocomplete="new-password" id="password" type="password" placeholder="密码" v-model="password" />
                    <label v-show="pageLoginConfig?.enabled_invite_code" for="invite-code">邀请码</label>
                    <input v-show="pageLoginConfig?.enabled_invite_code" class="bg-gray-100 dark:bg-gray-900 rounded-xl" id="invite-code" type="text" placeholder="邀请码" v-model="inviteCode" />
                    <input type="submit" role="button" class="text-gray-100 rounded-xl mt-3 px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 transition-colors" @click="signup" value="注册" />
                </form>
            </div>
        </frame-work>
    </NuxtLayout>
</template>
<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { Notice } from '~/share/Tools'

const store = useMainStore()
const basePath = computed(() => store._basePath)
const pageLoginConfig = computed(() => store._cache?.config_page_login)
const runtimeConfig = useRuntimeConfig()
watch(pageLoginConfig, () => {
    if (!pageLoginConfig.value?.enabled_signup) {
        navigateTo('/login')
    }
})

const name = ref<string>('')
const email = ref<string>('')
const password = ref<string>('')
const inviteCode = ref<string>('')

const signup = (e: Event) => {
    e.preventDefault()
    store.updateValue('loading', true)
    if (!(name.value && email.value && password.value.length > 0)) {
        store.updateValue('loading', false)
        return
    }

    let tmpBody: { [p in string]: any } = {
        name: name.value,
        email: email.value,
        password: password.value
    }

    if (pageLoginConfig.value?.enabled_invite_code) {
        tmpBody['invite_code'] = inviteCode.value
    }

    fetch(store.basePath + '/passport/signup', {
        method: 'POST',
        body: new URLSearchParams(tmpBody)
    })
        .then((res) => res.json())
        .then((res) => {
            store.updateValue('loading', false)
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            // success
            Notice(res.data.msg, 'success')
            //console.log(res.data.msg)
            navigateTo('/login')
        })
        .catch((e) => {
            store.updateValue('loading', false)
            console.error(e)
        })
}
</script>
