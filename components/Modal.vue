<script setup lang="ts">
const props = defineProps({
    title: String,
    active: Boolean
})

const store = useMainStore()
const size = computed(() => store.size)

const emit = defineEmits(['activeCallback'])

const firstModalSwitch = ref<boolean>(false)
const activeModal = ref<boolean>(false)
const propsActive = computed(() => props.active)
watch(propsActive, () => {
    activeModal.value = propsActive.value
})

const modalSwitch = (value: Event | boolean) => {
    firstModalSwitch.value = true
    if (typeof value !== 'boolean') {
        activeModal.value = !activeModal.value
    } else {
        activeModal.value = value
    }
    emit('activeCallback', activeModal.value)
}
</script>

<template>
    <div>
        <div
            style="z-index: 19999"
            :class="`fixed top-0 left-0 transition-colors ` + (activeModal ? 'bg-gray-200/60 dark:bg-gray-900/60 h-[100vh] w-[100vw]' : 'h-0 w-0')"
            @click="
                (e) => {
                    e.preventDefault()
                    modalSwitch(false)
                }
            "
        ></div>
        <div @click="modalSwitch" class="inline w-full">
            <slot> Click! </slot>
        </div>
        <div
            style="z-index: 20000"
            :class="
                `fixed bottom-0 left-[calc(50vw-16em)] max-md:left-0 bg-gray-200 border-4 border-b-0 border-gray-400 dark:bg-gray-700 dark:border-gray-600 rounded-t-2xl w-full md:max-w-[32em] ` +
                (firstModalSwitch ? (activeModal ? 'modal-in' : 'modal-out') : 'hidden')
            "
        >
            <div ref="modal_dom" class="rounded-2xl pt-5 pb-12 px-5 overflow-x-auto" :style="{ 'max-height': size.innerHeight ? size.innerHeight + 'px' : '100vh' }">
                <h5 class="mb-5 dark:text-gray-100 flex justify-between w-full">
                    <span class="font-bold py-1">{{ title }}</span>
                    <button
                        class="p-1"
                        @click="
                            (e) => {
                                e.preventDefault()
                                modalSwitch(false)
                            }
                        "
                        title="关闭"
                    >
                        <uno-icon class="i-bi:x-lg" style="height: 1rem; width: 1rem" />
                    </button>
                </h5>
                <slot name="container">这里什么都没有~</slot>
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
