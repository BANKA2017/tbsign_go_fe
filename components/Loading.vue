<template>
    <client-only>
        <div class="fixed right-3 top-2" v-if="loading" style="z-index: 30000">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    </client-only>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const store = useMainStore()
const loading = computed(() => store.loading)

onMounted(() => {
    store.updateValue('loading', false)
    onBeforeRouteLeave(() => {
        store.updateValue('loading', true)
    })
})
</script>

<style scoped></style>
