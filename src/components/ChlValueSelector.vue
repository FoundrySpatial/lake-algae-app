<template>
    <b-field
        class="chl-selector"
        :label="$t('chl-value.label')"
    >
        <b-checkbox
            native-value="14d"
            :value="value"
            @input="activate"
        >
            {{ $t('chl-value.14d') }}
        </b-checkbox>
        <b-checkbox
            native-value="daily"
            :value="value"
            @input="activate"
        >
            {{ $t('chl-value.daily') }}
        </b-checkbox>
    </b-field>
</template>

<script>
export default {
    name: 'ChlValueSelector',

    props: {
        value: {
            type: Array,
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
