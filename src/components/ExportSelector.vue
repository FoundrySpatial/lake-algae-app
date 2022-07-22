<template>
    <div class="buttons export-selector">
        <b-button
            type="is-secondary"
            :loading="loadingChart"
            @click="$emit('export-chart')"
        >
            {{ $t('export.chart.button-text') }}
        </b-button>
        <b-button
            type="is-secondary"
            :loading="loadingCsv"
            @click="$emit('export-csv')"
        >
            {{ $t('export.csv.button-text') }}
        </b-button>
    </div>
</template>

<script>
export default {
    name: 'ExportSelector',

    props: {
        loadingChart: {
            type: Boolean,
            default: false,
        },

        loadingCsv: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style>
</style>
