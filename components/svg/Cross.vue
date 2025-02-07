<template>
    <uno-icon class="i-fluent-emoji-flat:cross-mark" :style="{ width, height }" />
</template>

<script setup lang="ts">
defineProps({
    width: String,
    height: String
})
</script>
