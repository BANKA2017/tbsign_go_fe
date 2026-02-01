<script setup lang="ts">
defineProps({
    loading: Boolean,
    callback: Function
})
</script>

<template>
    <div
        class="fixed right-5 2xl:right-1/2 2xl:translate-x-[calc(512px+(2rem+(0.75rem*2)))] bottom-32 px-3 py-2 cursor-pointer transition-colors duration-150 select-none text-gray-100 bg-sky-500 hover:bg-sky-600 dark:hover:bg-sky-400 rounded-md"
        style="z-index: 9999"
        @click="callback?.()"
    >
        <uno-icon :class="{ 'i-bi:arrow-clockwise': true, 'animate-spin': loading }" />
    </div>
</template>
