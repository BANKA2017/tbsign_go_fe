<script setup lang="ts">
import FrameWork from '~/components/FrameWork.vue'

definePageMeta({
    middleware: ['auth', 'init-cache']
})
</script>

<template>
    <NuxtLayout name="tbsign">
        <frame-work> </frame-work>
    </NuxtLayout>
</template>

<style scoped></style>
