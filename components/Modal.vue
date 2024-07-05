<script setup lang="ts">
defineProps({
    title: String
})

const firstModalSwitch = ref<boolean>(false)
const activeModal = ref<boolean>(false)

const modalSwitch = (value: Event | boolean) => {
    firstModalSwitch.value = true
    if (typeof value !== 'boolean') {
        activeModal.value = !activeModal.value
    } else {
        activeModal.value = value
    }
}
</script>

<template>
    <div class="w-full">
        <div @click="modalSwitch(true)" class="w-full">
            <slot> Click! </slot>
        </div>
        <div
            style="z-index: 10000"
            :class="
                `fixed z-10 bottom-0 max-md:left-0 bg-gray-300 border-4 border-b-0 border-gray-400 dark:bg-gray-700 dark:border-gray-600 rounded-t-2xl w-full md:max-w-[32em] ` + (firstModalSwitch ? (activeModal ? 'modal-in' : 'modal-out') : 'hidden')
            "
        >
            <div ref="modal_dom" class="rounded-2xl py-3 px-5 overflow-x-auto max-h-[100vh]">
                <h5 class="mb-2 dark:text-gray-100 flex justify-between w-full">
                    <span class="">{{ title }}</span>
                    <button class="p-1 h-6 w-6" @click="modalSwitch(false)" title="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 16 16">
                            <path fill="currentColor" d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                        </svg>
                    </button>
                </h5>
                <slot name="container"></slot>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@keyframes modal-roll-in {
    0% {
        display: none;
        opacity: 0;
        transform: translateY(100%);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes modal-roll-out {
    0% {
        opacity: 1;
        transform: translateY(0);
    }

    100% {
        opacity: 0;
        transform: translateY(100%);
        display: none;
    }
}

.modal-in {
    animation-fill-mode: forwards;
    animation-name: modal-roll-in;
    animation-timing-function: linear;
    animation-duration: 100ms;
    animation-iteration-count: 1;
}

.modal-out {
    animation-fill-mode: forwards;
    animation-name: modal-roll-out;
    animation-timing-function: linear;
    animation-duration: 100ms;
    animation-iteration-count: 1;
}
</style>
