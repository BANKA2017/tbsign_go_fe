<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { Notice, Request } from '~/share/Tools'

const store = useMainStore()
const runtimeConfig = useRuntimeConfig()
const basePath = computed(() => store._basePath)
const pageLoginConfig = computed(() => store._cache?.config_page_login)
watch(pageLoginConfig, () => {
    canSendEmail.value = !!pageLoginConfig.value?.enabled_email
})
onMounted(() => {
    canSendEmail.value = !!pageLoginConfig.value?.enabled_email
})

const email = ref<string>('')
const password = ref<string>('')
const code = ref<string>('')
const step = ref<number>(0)

const canSendEmail = ref<boolean>(false)

const sendRequest = (e: Event) => {
    e.preventDefault()
    if (step.value >= 2 || !email.value || (code.value && !password.value)) {
        return
    }
    Request(store.basePath + '/passport/reset/password', {
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
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }

            step.value = (email.value.length ? 1 : 0) + (code.value.length ? 1 : 0)
            if (step.value === 1) {
                Notice('请确认 emoji 顺序一致：' + res.data?.verify_emoji, 'info', 0)
            }
            // success
            //console.log(res)
        })
        .catch((e) => {
            Notice(e.toString(), 'error')
            console.error(e)
        })
}
</script>
<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <ClientOnly>
                <div class="flex justify-center">
                    <form class="rounded-2xl p-5 flex grow flex-col gap-2 max-w-[32em]">
                        <span v-if="runtimeConfig.public.NUXT_BASE_PATH === ''" class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-5" v-show="step === 0">正在找回 {{ basePath }} 的密码</span>
                        <span v-if="!canSendEmail" class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-5" v-show="step === 0">本站仅支持 Ntfy 和 Bark，不支持邮件找回</span>
                        <div class="rounded-2xl bg-gray-200 dark:bg-gray-800 p-5 mb-2" v-show="step === 1 || step === 2">{{ step === 1 ? '如果此账号存在，并且推送渠道可用，您将会收到一条包含六位数字验证码的消息' : '密码修改成功 🎉' }}</div>
                        <label for="email">登录邮箱</label>
                        <input class="bg-gray-100 dark:bg-gray-900 rounded-xl" id="email" type="email" placeholder="邮箱" v-model="email" />
                        <label v-show="step > 0" for="invite-code">验证码</label>
                        <input v-show="step > 0" class="bg-gray-100 dark:bg-gray-900 rounded-xl" id="invite-code" type="text" placeholder="六位验证码" v-model="code" />
                        <label v-show="step > 0 && code" for="new-password">密码</label>
                        <input v-show="step > 0 && code" autocomplete="new-password" class="bg-gray-100 dark:bg-gray-900 rounded-xl" id="new-password" type="password" placeholder="密码" v-model="password" />
                        <input v-if="step < 2" type="submit" class="text-gray-100 rounded-xl mt-3 px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600" @click="sendRequest" value="提交" />
                    </form>
                </div>
            </ClientOnly>
        </frame-work>
    </NuxtLayout>
</template>
