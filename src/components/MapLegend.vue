<template>
    <div class="map-legend">
        <b-field
            :label="$t('map-legend.title')"
            custom-class="map-legend-title"
        />
        <div class="map-legend-bar-wrap">
            <div class="map-legend-no-data has-text-right">
                {{ $t('map-legend.no-data') }}
                <div class="no-data-bar is-inline-block" />
            </div>
            <svg class="map-legend-bar">
                <defs>
                    <linearGradient
                        id="gradient"
                        x1="0"
                        x2="1"
                        y1="0"
                        y2="0"
                    >
                        <stop
                            v-for="(colorStop, index) in colorScaleExtent"
                            :key="`${colorStop}-${index}`"
                            :offset="index * (1 / (colorScaleExtent.length - 1))"
                            :stop-color="colorStop"
                        />
                    </linearGradient>
                </defs>
                <!-- color scale for 10-maxScale data -->
                <rect
                    class="svg-rect"
                    :x="colorScaleBarX(colorStops[maxScale].length)"
                    :width="colorScaleBarWidth(colorStops[maxScale].length)"
                    height="100%"
                    preserveAspectRatio="none"
                    fill="url(#gradient)"
                />
                <!-- color scale for 0-10 data -->
                <rect
                    class="svg-rect"
                    :width="colorScaleBarSmallData(colorStops[maxScale].length)"
                    height="100%"
                    preserveAspectRatio="none"
                    :fill="underTenDataColor"
                />
            </svg>
        </div>
        <div class="map-legend-scale">
            <svg
                class="map-legend-tick"
                viewBox="0 0 40 60"
            >
                <polygon
                    points="20 0, 0 30, 40 30"
                    :fill="underTenDataColor"
                    style="stroke: black; stroke-width: 1"
                />
                <text
                    text-anchor="middle"
                    x="50%"
                    y="100%"
                    font-size="24px"
                >
                    0
                </text>
            </svg>
            <svg
                v-for="(scaleStep, index) in selectedScale"
                :key="`${scaleStep}-${index}`"
                class="map-legend-tick"
                viewBox="0 0 40 60"
            >
                <polygon
                    points="20 0, 0 30, 40 30"
                    :fill="scaleStep"
                    style="stroke: black; stroke-width: 1"
                />
                <text
                    text-anchor="middle"
                    x="50%"
                    y="100%"
                    font-size="24px"
                >
                    {{ (index + 1) * 10 }}{{ (index === selectedScale.length - 1) ? '+' : '' }}
                </text>
            </svg>
        </div>
    </div>
</template>

<script>
export default {
    name: 'MapLegend',

    props: {
        maxScale: {
            type: Number,
            required: true,
        },

        colorStops: {
            type: Object,
            required: true,
        },
    },

    computed: {
        selectedScale() {
            return this.colorStops[this.maxScale];
        },

        // always show the max color scale extent
        colorScaleExtent() {
            return this.colorStops[80];
        },

        // color for small data values between 0-10
        underTenDataColor() {
            return this.colorStops.clamped;
        },
    },

    methods: {
        /**
         * value for the color scale bar 0-10 svg
         * add an extra piece of a percentage so there is no gap between bars on certain screen sizes
         * @param {Number} colorScaleSize - length of the selected color scale array
         *
         * @returns {string} percentage value as a string
         */
        colorScaleBarSmallData(colorScaleSize) {
            return `${(100 / colorScaleSize) + 0.1}%`;
        },

        /**
         * value for the color scale bar svg 'x' size
         * @param {Number} colorScaleSize - length of the selected color scale array
         *
         * @returns {string} percentage value as a string
         */
        colorScaleBarX(colorScaleSize) {
            return `${100 / colorScaleSize}%`;
        },

        /**
         * value for the color scale bar svg 'width' size
         * @param {Number} colorScaleSize - length of the selected color scale array
         *
         * @returns {string} percentage value as a string
         */
        colorScaleBarWidth(colorScaleSize) {
            return `${100 - (100 / colorScaleSize)}%`;
        },
    },
};
</script>

<style lang="scss">
.map-legend {
    .map-legend-no-data {
        .no-data-bar {
            background-color: $color-lake-no-data;
            height: 1.25em;
            width: 3.75em;
            vertical-align: text-bottom;
        }
    }
    .map-legend-bar-wrap {
        padding: 0 0.5rem; // half the width of the triangle markers
    }

    svg.map-legend-bar {
        width: 100%;
        height: 1.25em;
        position: relative;
        top: 0.7em;
        z-index: -1;
    }

    .map-legend-scale {
        display: flex;
        justify-content: space-between;

        .map-legend-tick {
            width: 1.85em;
            height: 2.5em;
        }
    }

    @include tablet {
        .map-legend-bar-wrap {
            padding: 0 1rem; // half the width of the triangle markers
        }

        .map-legend-scale {
            .map-legend-tick {
                width: 2.5em;
                height: 2.6em;
            }
        }
    }
}
</style>
