<template>
    <div
        id="app"
        class="container"
    >
        <lake-watch />
    </div>
</template>

<script>
import LakeWatch from '@/components/LakeWatch.vue';

export default {
    name: 'LakeAlgaeApp',

    components: {
        LakeWatch,
    },
};
</script>

<style lang="scss">
#app {
    padding: 0 0.5rem;

    .outline {
        // need to use !important since the bulma button overrides the border
        // when events like focus, hover, active occur
        border: 2px solid black !important;
    }
}
</style>
