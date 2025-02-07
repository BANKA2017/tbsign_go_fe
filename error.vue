<template>
    <NuxtLayout name="tbsign">
        <h1 class="text-6xl mb-5 mt-3">{{ code }}</h1>
        <p class="text-xl">
            <uno-icon class="i-fluent-emoji-flat:japanese-free-of-charge-button inline-block -mt-0.5" /> {{ errorMessage[code] ? errorMessage[code] : '什么问题？' }}，回<NuxtLink to="/" class="mx-1 underline underline-offset-4">首页</NuxtLink>看看吧
        </p>
    </NuxtLayout>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { NuxtError } from '@nuxt/types'
const props = defineProps({
    error: {
        type: Object as PropType<NuxtError>,
        default: { statusCode: 404 }
    }
})

const code = ref<number>(props.error.statusCode || 500)

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
