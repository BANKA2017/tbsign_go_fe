<template>
    <NuxtLayout name="tbsign">
        <frame-work>
            <h1 class="text-6xl mb-5 mt-3">{{ error.statusCode }}</h1>
            <p class="text-xl">🈚 {{ errorMessage[error.statusCode] ? errorMessage[error.statusCode] : '什么问题？' }}，回<NuxtLink to="/" class="mx-1 underline underline-offset-4">首页</NuxtLink>看看吧</p>
        </frame-work>
    </NuxtLayout>
</template>

<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'
import { reactive } from 'vue'
import type { PropType } from 'vue'
import type { NuxtError } from '@nuxt/types'
const props = defineProps({
    error: {
        type: Object as PropType<NuxtError>,
        default: { statusCode: 404 }
    }
})

const state = reactive<{
    code: number
}>({
    code: 404
})
state.code = props.error.statusCode || 500

useHead({
    script: [
        {
            innerHTML: `d=localStorage.darkMode||'0';c=document.documentElement.classList;v=c.value==='';if((d==='0'&&matchMedia('(prefers-color-scheme:dark)').matches&&v)||(d==='2'&&v)){c.add('dark')}`
        }
    ]
})

const errorMessage = {
    302: '跳转中……',
    404: '根本没有这个页面',
    500: '不用刷新了，已经炸了'
}
</script>
