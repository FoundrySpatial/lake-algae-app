<template>
    <b-field
        class="bloom-selector"
        :label="$t('bloom-index.label')"
    >
        <div v-if="isPointSelection">
            {{ $t('bloom-index.specific-point') }}
        </div>
        <div v-else>
            <b-radio
                native-value="extent"
                :value="value"
                @input="activate"
            >
                {{ $t('bloom-index.extent') }}
            </b-radio>
            <b-radio
                native-value="intensity"
                :value="value"
                @input="activate"
            >
                {{ $t('bloom-index.intensity') }}
            </b-radio>
            <b-radio
                native-value="severity"
                :value="value"
                @input="activate"
            >
                {{ $t('bloom-index.severity') }}
            </b-radio>
        </div>
    </b-field>
</template>

<script>
export default {
    name: 'BloomIndexSelector',

    props: {
        value: {
            type: String,
            required: true,
        },

        isPointSelection: {
            type: Boolean,
            required: true,
        },
    },

    methods: {
        /**
         * emit input event when selected option change
         * @param {String} option selected option value
         */
        activate(option) {
            this.$emit('input', option);
        },
    },
};
</script>

<style lang="scss">
@include tablet {
    .bloom-selector {
        max-width: 30%;
    }
}
</style>
