<template>
    <div class="chart-legend">
        <div class="chart-legend-group">
            <div
                v-for="(legendItem) in chartLegendAlgalDisplay"
                :key="legendItem.title"
                class="legend-item"
            >
                <span class="legend-text center">{{ legendItem.title }}</span>
                <div
                    :class="`icon ${legendItem.class}`"
                />
            </div>
            <div
                v-if="selectMedian && !disableReferenceDataOptions"
                class="legend-item"
            >
                <span class="legend-text center">{{ $t('chart-element.median') }}</span>
                <div
                    class="icon chart-median"
                />
            </div>
        </div>
        <div
            v-if="selectQuartiles && !disableReferenceDataOptions"
            class="chart-legend-group"
        >
            <div
                class="legend-item"
            >
                <span class="legend-text center">{{ $t('chart-element.quartiles') }}</span>
                <div
                    class="icon chart-quartiles"
                />
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ChartLegend',

    props: {
        chartElements: {
            type: Array,
            required: true,
        },

        chartLegendAlgalDisplay: {
            type: Array,
            required: true,
        },

        disableReferenceDataOptions: {
            type: Boolean,
            required: true,
        },
    },

    computed: {
        /**
         * returns true if chartElements prop contains "median"
         */
        selectMedian() {
            return this.chartElements.includes('median');
        },

        /**
         * returns true if chartElements prop contains "quartiles"
         */
        selectQuartiles() {
            return this.chartElements.includes('quartiles');
        },
    },
};
</script>

<style lang="scss">
.chart-legend {
    .chart-legend-group{
        display: flex;
        padding: 0.5rem 0.5rem;

        .legend-item {
            display: flex;
            padding: 0 0.5rem;
            width: 50%;

            .icon {
                width: 1.25rem;
                height: 1.25rem;
                border-radius: 2px;
                margin: auto auto;

                &.chart-algal-14d { background-color: $color-chart-algal; }
                &.chart-algal-daily { background-color: $color-chart-algal-daily; }
                &.chart-median { background-color: $color-chart-median; }
                &.chart-quartiles { background-color: $color-chart-quartiles; }
            }

            .legend-text {
                width: 75%;
                text-align: right;
                line-height: 1rem;
            }

            .legend-text.center {
                align-self: center
            }
        }
    }
}
@include tablet {
    .chart-legend {
        display: flex;
        justify-content: flex-start;

        .chart-legend-group {
            .legend-item {
                min-width: 11rem;

                .icon {
                    width: 1.25rem;
                    height: 1.25rem;
                }
            }
        }
    }
}
</style>
