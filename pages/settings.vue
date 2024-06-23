<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'

const store = useMainStore()

const accountInfo = computed(() => store._cache?.accountInfo)

onMounted(() => {
    if (!accountInfo.value) {
        fetch(store.basePath + '/passport', {
            headers: {
                Authorization: store.authorization
            }
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.code !== 200) {
                    return
                }
                store.updateCache('accountInfo', res.data)
                console.log(res)
            })
    }
})

definePageMeta({
    middleware: ['auth', 'get-accounts']
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <div class="px-3 py-2">
                <span class="text-lg">设置</span>
            </div>
            <div class="p-3 flex flex-col gap-2" v-if="accountInfo">
                <label class="block my-1">邮箱</label>
                <input autocomplete="email" class="border-slate-200 placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full dark:bg-black dark:text-white" v-model="accountInfo.email" />
                <!--<abbr class="block my-1" title="忘记了原密码？试试退出后使用找回密码">密码</abbr>-->
                <label class="block my-1">密码</label>
                <input
                    placeholder="当前密码"
                    autocomplete="current-password"
                    class="border-slate-200 placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full dark:bg-black dark:text-white"
                    v-model="accountInfo.pwssword"
                />
                <input
                    placeholder="新密码"
                    autocomplete="new-password"
                    class="border-slate-200 placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full dark:bg-black dark:text-white"
                    v-model="accountInfo.pwssword"
                />
            </div>
        </frame-work>
    </NuxtLayout>
</template>
