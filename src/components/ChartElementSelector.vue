<template>
    <b-field
        class="chart-selector"
        :label="`${yearRange.first}-${yearRange.last} ${$t('chart-element.label')}`"
    >
        <b-checkbox
            native-value="median"
            :disabled="disableReferenceDataOptions"
            :value="disableReferenceDataOptions ? '' : value"
            @input="activate"
        >
            {{ $t('chart-element.median') }}
        </b-checkbox>
        <b-checkbox
            native-value="quartiles"
            :disabled="disableReferenceDataOptions"
            :value="disableReferenceDataOptions ? '' : value"
            @input="activate"
        >
            {{ $t('chart-element.quartiles') }}
        </b-checkbox>
    </b-field>
</template>

<script>
export default {
    name: 'ChartElementSelector',

    props: {
        value: {
            type: Array,
            required: true,
        },

        yearRange: {
            type: Object,
            required: true,
        },

        disableReferenceDataOptions: {
            type: Boolean,
            required: true,
        },
    },

    methods: {
        /**
         * emit input event when selected option change
         * @param {Array} option selected option value
         */
        activate(option) {
            this.$emit('input', option);
        },
    },
};
</script>

<style>
</style>
