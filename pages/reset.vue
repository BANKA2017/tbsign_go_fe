<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'

const store = useMainStore()

const email = ref<string>('')
const password = ref<string>('')
const password2 = ref<string>('')
const code = ref<string>('')
const step = ref<number>(0)

const isPassword2Valid = computed(() => {
    if (password2.value.length === 0) {
        return true
    }
    return password.value === password2.value
})

const sendRequest = () => {
    if (!email.value) {
        return
    }
    if (code.value && password.value && password2.value && password.value !== password2.value) {
        return
    }
    fetch(store.basePath + '/passport/reset_password', {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: new URLSearchParams({
            email: email.value,
            password: password.value,
            code: code.value
        })
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            step.value++
            // success
            console.log(res)
        })
}

definePageMeta({
    middleware: ['auth']
})
</script>
<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="rounded-2xl p-5 flex flex-col gap-2 max-w-[32em]">
                <div class="rounded-2xl bg-gray-300 dark:bg-gray-900 p-5 mb-2" v-show="step === 1 || step === 2">{{ step === 1 ? '如果此邮箱存在，您将会收到一封包含六位数字验证码的邮件' : '密码重设成功 🎉' }}</div>
                <label for="email">注册邮箱</label>
                <input class="dark:bg-black rounded-xl" id="email" type="email" placeholder="注册邮箱" v-model="email" />
                <label v-show="step > 0" for="invite_code">验证码</label>
                <input v-show="step > 0" class="dark:bg-black rounded-xl" id="invite_code" type="text" placeholder="六位验证码" v-model="code" />
                <label v-show="step > 0 && code" for="password">密码</label>
                <input v-show="step > 0 && code" class="dark:bg-black rounded-xl" id="password" type="password" placeholder="密码" v-model="password" />
                <label v-show="step > 0 && code" for="password">重复密码</label>
                <input v-show="step > 0 && code" :class="`dark:bg-black rounded-xl ` + (isPassword2Valid ? '' : 'border-red-500')" id="password2" type="password" placeholder="重复密码" v-model="password2" />

                <div class="text-white rounded-xl mt-3">
                    <button class="rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600" @click="sendRequest">提交</button>
                </div>
            </div>
        </frame-work>
    </NuxtLayout>
</template>
