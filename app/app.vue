<template>
    <NuxtLayout name="tbsign">
        <NuxtPage />
    </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
    titleTemplate: (titleChunk) => {
        return titleChunk ? `${titleChunk} - 贴吧云签到` : '贴吧云签到'
    }
})

const store = useMainStore()

onMounted(() => {
    store.updateSize()
    window.addEventListener('resize', store.updateSize)
})

onUnmounted(() => {
    window.removeEventListener('resize', store.updateSize)
})
</script>

<style scoped></style>
