<template>
    <b-field
        class="scale-selector"
        :label="$t('color-scale.label')"
    >
        <div class="radio-option-wrapper">
            <b-radio
                :native-value="40"
                :value="value"
                class="radio-option"
                @input="selected"
            >
                0 µg/L – 40+ µg/L
            </b-radio>
            <b-radio
                :native-value="60"
                :value="value"
                class="radio-option"
                @input="selected"
            >
                0 µg/L – 60+ µg/L
            </b-radio>
            <b-radio
                :native-value="80"
                :value="value"
                class="radio-option"
                @input="selected"
            >
                0 µg/L – 80+ µg/L
            </b-radio>
        </div>
    </b-field>
</template>

<script>
export default {
    name: 'ColorScaleSelector',

    props: {
        value: {
            type: Number,
            required: true,
        },
    },

    methods: {
        /**
         * emit input event when selected option change
         * @param {String} option selected option value
         */
        selected(option) {
            this.$emit('input', option);
        },
    },
};
</script>
