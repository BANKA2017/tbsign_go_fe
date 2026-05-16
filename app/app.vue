<template>
    <NuxtLayout name="tbsign">
        <NuxtPage />
    </NuxtLayout>
</template>

<script setup lang="ts">
const store = useMainStore()
const systemKeyWords = computed(() => store.system_keywords)
const systemDescription = computed(() => store.system_description)

const useHeadMeta = computed(() => {
    const useHeadMetaData = []
    if (systemKeyWords.value) {
        useHeadMetaData.push({ name: 'keywords', content: systemKeyWords.value })
    }
    if (systemDescription.value) {
        useHeadMetaData.push({ name: 'description', content: systemDescription.value })
    }

    return useHeadMetaData
})

useHeadSafe({
    meta: useHeadMeta
})

onMounted(() => {
    store.updateSize()
    window.addEventListener('resize', store.updateSize)
})

onUnmounted(() => {
    window.removeEventListener('resize', store.updateSize)
})
</script>

<style scoped></style>
