<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { Notice } from '~/share/Tools'

const store = useMainStore()
const basePath = computed(() => store._basePath)
const pageLoginConfig = computed(() => store._cache?.config_page_login)
watch(pageLoginConfig, () => {
    if (!pageLoginConfig.value?.enabled_reset_password) {
        navigateTo('login')
    }
})

const email = ref<string>('')
const password = ref<string>('')
const code = ref<string>('')
const step = ref<number>(0)

const sendRequest = (e: Event) => {
    e.preventDefault()
    store.updateValue('loading', true)
    if (step.value >= 2) {
        store.updateValue('loading', false)
        return
    }
    if (!email.value) {
        store.updateValue('loading', false)
        return
    }
    if (code.value && !password.value) {
        store.updateValue('loading', false)
        return
    }
    fetch(store.basePath + '/passport/reset_password', {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: new URLSearchParams({
            email: email.value,
            password: code.value ? password.value : '',
            code: step.value > 0 ? code.value : ''
        })
    })
        .then((res) => res.json())
        .then((res) => {
            store.updateValue('loading', false)
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            step.value = (email.value.length ? 1 : 0) + (code.value.length ? 1 : 0)
            // success
            //console.log(res)
        })
        .catch((e) => {
            store.updateValue('loading', false)
            Notice(e.toString(), 'error')
            console.error(e)
        })
}
</script>
<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="flex justify-center">
                <form class="rounded-2xl p-5 flex grow flex-col gap-2 max-w-[32em]">
                    <span class="rounded-2xl bg-gray-300 dark:bg-gray-900 p-5 mb-10" v-show="step === 0">正在找回 {{ basePath }} 的密码</span>
                    <div class="rounded-2xl bg-gray-300 dark:bg-gray-900 p-5 mb-2" v-show="step === 1 || step === 2">{{ step === 1 ? '如果此邮箱存在，您将会收到一封包含六位数字验证码的邮件' : '密码重设成功 🎉' }}</div>
                    <label for="email">注册邮箱</label>
                    <input class="dark:bg-black rounded-xl" id="email" type="email" placeholder="注册邮箱" v-model="email" />
                    <label v-show="step > 0" for="invite-code">验证码</label>
                    <input v-show="step > 0" class="dark:bg-black rounded-xl" id="invite-code" type="text" placeholder="六位验证码" v-model="code" />
                    <label v-show="step > 0 && code" for="new-password">密码</label>
                    <input v-show="step > 0 && code" autocomplete="new-password" class="dark:bg-black rounded-xl" id="new-password" type="password" placeholder="密码" v-model="password" />
                    <input v-if="step < 2" type="submit" class="text-white rounded-xl mt-3 px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600" @click="sendRequest" value="提交" />
                </form>
            </div>
        </frame-work>
    </NuxtLayout>
</template>
