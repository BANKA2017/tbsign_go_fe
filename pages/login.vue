<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="flex justify-center">
                <form class="rounded-2xl p-5 flex grow flex-col gap-2 max-w-[32em]">
                    <label for="email">帐号</label>
                    <input class="dark:bg-black rounded-xl" id="email" type="text" name="email" placeholder="邮箱/用户名" v-model="account" />
                    <label for="password">密码</label>
                    <input class="dark:bg-black rounded-xl" autocomplete="current-password" id="password" type="password" name="password" placeholder="密码" v-model="password" />
                    <input type="submit" class="text-white mt-3 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 text-xl" @click="sendLogin" value="登录" />
                </form>
            </div>
        </frame-work>
    </NuxtLayout>
</template>
<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'

const store = useMainStore()
const account = ref<string>('')
const password = ref<string>('')

const router = useRouter()

const sendLogin = (e: Event) => {
    e.preventDefault()
    if (!(account.value && password.value)) {
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
            if (res.code !== 200) {
                return
            }
            if (res.data.token) {
                store.updateValue('_authorization', res.data.token)
                router.push('/')
            }

            console.log(res)
        })
}
</script>
