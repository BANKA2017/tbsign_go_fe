<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="rounded-2xl p-5 flex flex-col gap-2">
                <label for="email">用户名</label>
                <input class="dark:bg-black rounded-xl" id="name" type="text" placeholder="用户名" v-model="name" />
                <label for="email">邮箱</label>
                <input class="dark:bg-black rounded-xl" id="email" type="email" placeholder="邮箱" v-model="email" />
                <label for="password">密码</label>
                <input class="dark:bg-black rounded-xl" id="password" type="password" placeholder="密码" v-model="password" />
                <label for="password">重复密码</label>
                <input :class="`dark:bg-black rounded-xl ` + (isPassword2Valid ? '' : 'border-red-500')" id="password2" type="password" placeholder="重复密码" v-model="password2" />
                <label for="invite_code">邀请码（如果有）</label>
                <input class="dark:bg-black rounded-xl" id="invite_code" type="text" placeholder="邀请码" v-model="inviteCode" />
                <div class="text-end text-white rounded-xl mt-3">
                    <button class="rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600" @click="signup">注册</button>
                </div>
            </div>
        </frame-work>
    </NuxtLayout>
</template>
<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'

const store = useMainStore()

const name = ref<string>('')
const email = ref<string>('')
const password = ref<string>('')
const password2 = ref<string>('')
const inviteCode = ref<string>('')

const router = useRouter()

const isPassword2Valid = computed(() => {
    if (password2.value.length === 0) {
        return true
    }
    return password.value === password2.value
})

const signup = () => {
    if (!(name.value && email.value && password.value && password2.value)) {
        return
    }
    if (password.value !== password2.value) {
        return
    }
    fetch(store.basePath + '/passport/signup', {
        method: 'POST',
        body: new URLSearchParams({
            name: name.value,
            email: email.value,
            password: password.value,
            invite_code: inviteCode.value
        })
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200) {
                return
            }
            // success
            console.log(res.data.msg)
            router.push('/')
        })
}

definePageMeta({
    middleware: ['auth']
})
</script>
