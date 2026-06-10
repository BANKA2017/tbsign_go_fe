<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
    activeComponent: String as PropType<'status' | 'update' | 'plugin' | 'cron' | 'setting'>
})
</script>

<template>
    <div class="my-5 grid grid-cols-6 gap-2 max-w-[48em] text-center">
        <NuxtLink
            :class="{ 'col-span-3 md:col-span-1 w-full rounded-2xl border-2 border-sky-500 hover:bg-sky-500 px-4 py-1 hover:text-gray-100 transition-colors': true, 'bg-sky-500 text-gray-100': activeComponent === 'status' }"
            title="运行状态"
            aria-label="运行状态"
            to="/admin/system"
        >
            运行状态
        </NuxtLink>
        <NuxtLink
            :class="{ 'col-span-3 md:col-span-1 w-full rounded-2xl border-2 border-sky-500 hover:bg-sky-500 px-4 py-1 hover:text-gray-100 transition-colors': true, 'bg-sky-500 text-gray-100': activeComponent === 'update' }"
            title="软件更新"
            aria-label="软件更新"
            to="/admin/system/update"
        >
            软件更新
        </NuxtLink>
        <NuxtLink
            :class="{ 'col-span-3 md:col-span-1 w-full rounded-2xl border-2 border-sky-500 hover:bg-sky-500 px-4 py-1 hover:text-gray-100 transition-colors': true, 'bg-sky-500 text-gray-100': activeComponent === 'plugin' }"
            title="插件配置"
            aria-label="插件配置"
            to="/admin/system/plugin"
        >
            插件
        </NuxtLink>
        <NuxtLink
            :class="{ 'col-span-3 md:col-span-1 w-full rounded-2xl border-2 border-sky-500 hover:bg-sky-500 px-4 py-1 hover:text-gray-100 transition-colors': true, 'bg-sky-500 text-gray-100': activeComponent === 'cron' }"
            title="计划任务"
            aria-label="计划任务"
            to="/admin/system/cron"
        >
            计划任务
        </NuxtLink>
        <NuxtLink
            :class="{ 'col-span-3 md:col-span-1 w-full rounded-2xl border-2 border-sky-500 hover:bg-sky-500 px-4 py-1 hover:text-gray-100 transition-colors': true, 'bg-sky-500 text-gray-100': activeComponent === 'setting' }"
            title="软件设置"
            aria-label="软件设置"
            to="/admin/system/setting"
        >
            软件设置
        </NuxtLink>
    </div>
</template>
