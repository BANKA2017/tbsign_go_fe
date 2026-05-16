<template>
    <div class="py-6">
        <div class="flex items-center justify-between">
            <div class="text-3xl py-1 bg-clip-text flex text-black dark:text-gray-100 md:mx-5">{{ systemName }}</div>
            <dark-button class="flex-none" />
        </div>
    </div>
</template>
<script setup lang="ts">
import DarkButton from '~/components/DarkButton.vue'

const store = useMainStore()
const systemName = computed(() => store.system_name || 'TbSign')
</script>
