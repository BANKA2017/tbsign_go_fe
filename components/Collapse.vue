<template>
    <div class="my-2 px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-xl transition-colors">
        <h3 role="button" :class="'flex justify-between text-lg py-2 px-2 -mx-2 sticky top-0 ' + (expand ? 'bg-gray-200 dark:bg-gray-800' : '')" @click="expand = !expand">
            <div>
                <slot>展开</slot>
            </div>

            <div role="button" class="rounded-full h-4 text-gray-900 dark:text-gray-100 transition-colors my-1" title="展开设置列表" aria-label="展开设置列表">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" class="w-5 h-5" viewBox="0 0 16 16">
                    <path
                        v-if="expand"
                        fill="currentColor"
                        fill-rule="evenodd"
                        d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8m7-8a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0m-.5 11.707l-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-1 0z"
                    />
                    <path
                        v-else
                        fill="currentColor"
                        fill-rule="evenodd"
                        d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10"
                    />
                </svg>
            </div>
        </h3>
        <div :class="{ 'list-in': expand, 'list-out': !expand, 'mb-3': expand }" :style="{ 'max-height': expand ? '100vh' : 0 }">
            <hr class="border-gray-400 dark:border-gray-600 my-1" />
            <slot name="container">这里什么都没有~</slot>
        </div>
    </div>
</template>

<script setup lang="ts">
const expand = ref<boolean>(false)
</script>
