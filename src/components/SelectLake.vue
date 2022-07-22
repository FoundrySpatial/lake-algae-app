<template>
    <b-field>
        <b-select
            expanded
            :placeholder="$t('lake-select.select-lake')"
            @input="onInput"
        >
            <option
                v-for="option in lakes"
                :key="option"
                :value="option"
            >
                {{ $t(`lakes.${option}`) }}
            </option>
        </b-select>
    </b-field>
</template>

<script>
export default {
    name: 'SelectLake',

    props: {
        // list of available lakes
        lakes: {
            type: Array,
            required: true,
        },
    },

    methods: {
        // emit on input events so the parent can use v-model
        onInput(val) {
            this.$emit('input', val);
        },
    },
};
</script>
