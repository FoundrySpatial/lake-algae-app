<template>
    <div class="lake-watch">
        <section class="header page-section">
            <div class="header-flex-helper">
                <img
                    class="eccc-logo"
                    src="@/assets/ECCC_logo.png"
                    alt="Environment and Climate Change Canada logo"
                >

                <h1 class="title is-4">
                    {{ $t('header.title') }}: {{ $t('header.subtitle') }}
                </h1>
            </div>

            <img
                class="eolakewatch-logo"
                src="@/assets/ECCC_Leaves.png"
                alt="EOLakeWatch logo"
            >
        </section>
        <hr class="section-divider">

        <!-- lake selection section -->
        <section class="lake-section page-section">
            <select-lake
                :lakes="lakes"
                @input="updateSelectedLake"
            />
            <select-location
                v-if="selectedLakeId"
                :is-point-selection="isPointSelection"
                :map-click-coords="pointSelection"
                @select-lake="selectLakeMode"
                @select-point-mode="selectPointMode"
                @select-point="selectPoint"
            />
        </section>
        <hr
            v-if="selectedLakeId"
            class="section-divider"
        >
        <div v-if="selectedLakeId">
            <!-- date selection section -->
            <section
                v-if="availableDates.length > 0"
                class="date-section page-section"
            >
                <b-field class="has-text-centered">
                    <div class="control">
                        <b-button
                            type="is-secondary is-size-5"
                            @click="useLatestDate"
                        >
                            {{ $t('date-select.button') }}
                        </b-button>
                    </div>
                </b-field>

                <date-picker
                    v-model="date"
                    :available-dates="availableDates"
                />
            </section>
            <section v-if="availableDates.length === 0">
                {{ $t('shared.loading') }}...
            </section>

            <!-- map section -->
            <section class="map-section page-section">
                <div class="map-filters-wrap is-relative">
                    <div class="map-wrap is-relative">
                        <leaflet-map
                            id="map"
                            :cog-url="dynamicCogUrl"
                            :max-scale="maxColorScale"
                            :color-scale="selectedColorScale"
                            :lake-bounds="lakeBounds[selectedLakeId]"
                            :point-selection="pointSelection"
                            :popup-contents="mapPopupContents"
                            :lake-boundary-geojson="lakeBoundaryGeojson"
                            :show-lake-boundary="showLakeBoundary"
                            @load="mapLoaded"
                            @click="mapClicked"
                        />

                        <transition name="fade">
                            <div
                                v-if="showMapOverlay"
                                class="instructions-overlay is-overlay is-unselectable"
                            >
                                <div class="box content">
                                    <p class="is-size-5">
                                        {{ $t('select-location.specific-point-map-overlay') }}
                                    </p>
                                    <p class="has-text-right">
                                        <b-button
                                            type="is-secondary"
                                            @click="showMapOverlay = false"
                                        >
                                            {{ $t('shared.button-ok') }}
                                        </b-button>
                                    </p>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <map-filters
                        v-model="chlValueMap"
                        :lake="selectedLakeId"
                        :lake-data="lakeData"
                        :is-point-selection="isPointSelection"
                        @boundary-mask="changeBoundaryMask"
                    />
                </div>

                <div>
                    <map-legend
                        id="map-legend"
                        :max-scale="maxColorScale"
                        :color-stops="colorScale"
                    />
                    <div class="color-scales">
                        <color-scale-selector
                            v-model="maxColorScale"
                        />

                        <b-field
                            class="scale-selector"
                            :label="$t('color-legend-radios.label')"
                        >
                            <div class="radio-option-wrapper">
                                <b-radio
                                    v-model="selectedColorScale"
                                    native-value="standardScale"
                                    class="radio-option"
                                >
                                    {{ $t('color-legend-radios.standard') }}
                                </b-radio>
                                <b-radio
                                    v-model="selectedColorScale"
                                    native-value="cividisScale"
                                    class="radio-option"
                                >
                                    {{ $t('color-legend-radios.accessible') }}
                                </b-radio>
                            </div>
                        </b-field>
                    </div>
                </div>
            </section>

            <div class="export-map export-button-wrap">
                <b-button
                    type="is-secondary is-size-5"
                    :loading="loadingMapExport"
                    @click="exportMap"
                >
                    {{ $t('export.map.button-text') }}
                </b-button>
            </div>

            <hr class="section-divider">

            <!-- chart section -->
            <section
                v-if="processedData[0].data.length"
                class="chart-section page-section"
            >
                <div class="selectors mb-1">
                    <bloom-index-selector
                        v-model="bloomIndex"
                        :is-point-selection="isPointSelection"
                        @input="selectChart"
                    />
                    <chl-value-selector
                        v-model="chlValue"
                        @input="selectChart"
                    />
                    <chart-element-selector
                        v-model="chartElements"
                        :year-range="yearRange"
                        :disable-reference-data-options="disableReferenceDataOptions"
                        @input="selectChart"
                    />
                </div>
                <algal-bloom-lake-chart
                    :graph-data="processedData"
                    :provided-options="chartOptions"
                    :year-range="yearRange"
                    @chart="(c) => chartObj = c"
                    @click="changeSelectedDate"
                />
                <chart-legend
                    id="chart-legend"
                    class="py-4"
                    :chart-elements="chartElements"
                    :chart-legend-algal-display="chartLegendAlgalDisplay"
                    :disable-reference-data-options="disableReferenceDataOptions"
                />
                <div class="export-selector export-button-wrap">
                    <export-selector
                        :loading-chart="loadingChartExport"
                        :loading-csv="loadingCsvExport"
                        @export-chart="exportChart"
                        @export-csv="exportCsv"
                    />
                </div>

                <hr class="section-divider">
            </section>

            <section>
                <p>
                    {{ $t('footer.updated-daily') }}
                </p>
                <p v-if="lakeData.lastUpdatedDate">
                    {{ $t('footer.last-update') }} {{ lakeData.lastUpdatedDate }}
                </p>
            </section>
        </div>

        <b-loading :active="loading" />
    </div>
</template>

<script>
import axios from 'axios';
import dayjs from 'dayjs';
import domToImage from 'dom-to-image-more';
import { fabric } from 'fabric';
import { saveAs } from 'file-saver';
import * as numeral from 'numeral';
import utc from 'dayjs/plugin/utc';

import ecccLogoImg from '@/assets/ECCC_logo.png';
import ecccLeavesImg from '@/assets/ECCC_Leaves.png';
import asscessible40 from '@/assets/mapLegendExportImages/asscessible-40.png';
import asscessible60 from '@/assets/mapLegendExportImages/asscessible-60.png';
import asscessible80 from '@/assets/mapLegendExportImages/asscessible-80.png';
import standard40 from '@/assets/mapLegendExportImages/standard-40.png';
import standard60 from '@/assets/mapLegendExportImages/standard-60.png';
import standard80 from '@/assets/mapLegendExportImages/standard-80.png';

// components
import AlgalBloomLakeChart from '@/components/AlgalBloomLakeChart.vue';
import BloomIndexSelector from '@/components/BloomIndexSelector.vue';
import ChartLegend from '@/components/ChartLegend.vue';
import ChartElementSelector from '@/components/ChartElementSelector.vue';
import ChlValueSelector from '@/components/ChlValueSelector.vue';
import ColorScaleSelector from '@/components/ColorScaleSelector.vue';
import DatePicker from '@/components/DatePicker/DatePicker.vue';
import ExportSelector from '@/components/ExportSelector.vue';
import LeafletMap from '@/components/LeafletMap.vue';
import MapFilters from '@/components/MapFilters.vue';
import MapLegend from '@/components/MapLegend.vue';
import SelectLake from '@/components/SelectLake.vue';
import SelectLocation from '@/components/SelectLocation.vue';

import {
    LEGEND_14D,
    LEGEND_14D_DAILY,
    LEGEND_14D_DAILY_MEDIAN,
    LEGEND_14D_DAILY_PERCENT,
    LEGEND_14D_DAILY_MEDIAN_PERCENT,
    LEGEND_14D_MEDIAN,
    LEGEND_14D_PERCENT,
    LEGEND_14D_MEDIAN_PERCENT,
    LEGEND_DAILY,
    LEGEND_FRENCH_14D,
    LEGEND_FRENCH_14D_DAILY,
    LEGEND_FRENCH_14D_DAILY_MEDIAN,
    LEGEND_FRENCH_14D_DAILY_PERCENT,
    LEGEND_FRENCH_14D_DAILY_MEDIAN_PERCENT,
    LEGEND_FRENCH_14D_MEDIAN,
    LEGEND_FRENCH_14D_PERCENT,
    LEGEND_FRENCH_14D_MEDIAN_PERCENT,
    LEGEND_FRENCH_DAILY,
} from '@/chartLegendImages';

// mixins
import exportCsv from '@/export/csv';

import scssVars from '@/assets/scss/_variables.scss';

dayjs.extend(utc);

export default {
    name: 'LakeWatch',

    components: {
        AlgalBloomLakeChart,
        BloomIndexSelector,
        ColorScaleSelector,
        ChartLegend,
        ChartElementSelector,
        ChlValueSelector,
        DatePicker,
        ExportSelector,
        MapFilters,
        LeafletMap,
        MapLegend,
        SelectLake,
        SelectLocation,
    },

    mixins: [
        exportCsv,
    ],

    data: () => ({
        map: null,
        maxColorScale: 60,
        date: dayjs.utc(),
        bloomIndex: 'extent',
        chlValue: ['14d'],
        chlValueMap: '14d',

        chartObj: null,
        chartWholeLakeData: [],
        chartWholeLakeMetadata: [],
        chartSpecificPointData: [],
        chartSpecificPointMetadata: [],
        lakeArea: 0,
        chartElements: [],
        selectedLakeId: '',
        selectedColorScale: 'standardScale',
        showMapOverlay: false,
        isPointSelection: false,
        pointSelection: {},
        availableDates: [],
        yearRange: {},
        popupChlorophyllAPoint: {
            value_14d: null,
            value_daily: null,
        },
        lakeData: {},
        yAxisUnit: 'x10³ km²',
        lakes: [
            'LoW',
            'LW',
            'LW-NB',
            'LW-SB',
            'LW-NRWS',
            'LErie',
        ],
        lakeBounds: {
            LW: [
                [50.2878564137126318, -99.2683978895331052],
                [54.1502762874225496, -96.2603696373710989],
            ],
            LoW: [
                [50.014799234787844, -93.20800781250001],
                [48.58205840283824, -96.84448242187501],
            ],
            'LW-NB': [
                [50.2880486184599391, -99.2683978895330768],
                [54.1502762874224999, -96.2615339786610207],
            ],
            'LW-SB': [
                [50.2878564137127455, -96.9978149767049160],
                [51.2644376650814095, -96.2603696373707862],
            ],
            'LW-NRWS': [
                [51.0208826966645219, -97.6257687771684743],
                [52.4322318389779767, -96.3301885411131735],
            ],
            LErie: [
                [45.166547157856016, -74.99267578125001],
                [38.634036452919226, -89.53857421875001],
            ],
        },
        lakeBoundaryGeojson: {},
        showLakeBoundary: false,
        languages: [
            'en',
            'fr',
        ],

        // "cividis" color scale
        cividisScale: {
            40: [
                'rgb(4, 50, 112)',
                'rgb(82, 93, 112)',
                'rgb(167, 158, 114)',
                'rgb(253, 234, 69)',
            ],
            60: [
                'rgb(4, 50, 112)',
                'rgb(49, 72, 110)',
                'rgb(100, 106, 114)',
                'rgb(150, 144, 115)',
                'rgb(199, 186, 104)',
                'rgb(253, 234, 69)',
            ],
            80: [
                'rgb(4, 50, 112)',
                'rgb(36, 65, 111)',
                'rgb(70, 84, 111)',
                'rgb(108, 111, 115)',
                'rgb(144, 139, 116)',
                'rgb(178, 168, 114)',
                'rgb(215, 200, 94)',
                'rgb(253, 234, 69)',
            ],
            clamped: 'rgb(1, 34, 77)',
        },

        // "spectral" color scale reversed so red corresponds to the highest values
        standardScale: {
            40: [
                'rgb(24, 132,160)',
                'rgb(85, 248, 79)',
                'rgb(225, 78, 0)',
                'rgb(115, 0, 0)',
            ],
            60: [
                'rgb(24, 132,160)',
                'rgb(5, 230, 127)',
                'rgb(153, 243, 48)',
                'rgb(239, 141, 0)',
                'rgb(195, 0, 0)',
                'rgb(115, 0, 0)',
            ],
            80: [
                'rgb(24, 132,160)',
                'rgb(10, 202, 137)',
                'rgb(36, 252, 102)',
                'rgb(182, 241, 34)',
                'rgb(244, 168, 0)',
                'rgb(221, 34, 0)',
                'rgb(172, 0, 0)',
                'rgb(115, 0, 0)',
            ],
            clamped: 'rgb(0, 0, 200)',
        },

        loadingMapExport: false,
        loadingChartExport: false,
        loadingCsvExport: false,

        // blocking load operations
        fetchingDateStrings: false,
        fetchingLakeData: false,
        fetchingChartData: false,
        fetchingPointData: false,
    }),

    computed: {
        /**
         * determine when to hide reference data options
         */
        disableReferenceDataOptions() {
            if ((this.chlValue.length === 1 && this.chlValue.includes('daily')) || (this.chlValue.includes('14d') && this.isPointSelection)) {
                return true;
            }
            return false;
        },

        dynamicCogUrl() {
            const baseUrl = process.env.VUE_APP_COG_STORAGE_URL;
            const storageBucketName = process.env.VUE_APP_COG_CONTAINER;
            const projection = '4326';
            const date = dayjs(this.date).format('YYYYMMDD');

            return `${baseUrl}/${storageBucketName}/cog_${this.chlValueMap}_masked_${projection}_${this.selectedLakeId}_${date}.tif`;
        },

        /**
         * switch color scale based on the color scale colors and maximum cholorphyll-a concentration
         */
        colorScale() {
            return this.$data[this.selectedColorScale];
        },

        /**
         * return formatted chart series data based on the selected bloomIndex, chlValue and chartElements
         */
        processedData() {
            const formattedPointValueDaily = [];
            const formattedPointValue14d = [];
            const formattedPointValue14dMedian = [];
            const formattedPointValue14dPercentiles = [];

            const formattedLakeExtentDaily = [];
            const formattedLakeExtent14d = [];
            const formattedLakeExtentPercentageDaily = [];
            const formattedLakeExtentPercentage14d = [];
            const formattedLakeIntensityDaily = [];
            const formattedLakeIntensity14d = [];
            const formattedLakeSeverityDaily = [];
            const formattedLakeSeverity14d = [];
            const formattedLakeExtent14dMedian = [];
            const formattedLakeIntensity14dMedian = [];
            const formattedLakeSeverity14dMedian = [];
            const formattedLakeExtent14dPercentiles = [];
            const formattedLakeIntensity14dPercentiles = [];
            const formattedLakeSeverity14dPercentiles = [];

            if (this.chartData.length !== 0) {
                let startYear = this.yearRange.first;
                let endYear = this.yearRange.last;

                // format specific point & whole lake algal daily data
                // require to collect mininum and maximum years for following lake algal daily metadata
                this.chartData.forEach((row) => {
                    const year = dayjs(row.date).get('year');
                    if (year < startYear) {
                        startYear = year;
                    }
                    if (year > endYear) {
                        endYear = year;
                    }

                    // check for specific point selection mode
                    if (this.isPointSelection) {
                        formattedPointValueDaily.push({
                            x: Date.parse(row.date),
                            y: row.value_daily,
                        });

                        formattedPointValue14d.push({
                            x: Date.parse(row.date),
                            y: row.value_14d,
                        });
                    // check for whole lake selection mode
                    } else {
                        if (row.intensity_daily !== null) {
                            formattedLakeIntensityDaily.push({
                                x: Date.parse(row.date),
                                y: row.intensity_daily,
                            });
                        }

                        if (row.intensity_14d !== null) {
                            formattedLakeIntensity14d.push({
                                x: Date.parse(row.date),
                                y: row.intensity_14d,
                            });
                        }

                        if (row.severity_daily_km2 !== null) {
                            formattedLakeSeverityDaily.push({
                                x: Date.parse(row.date),
                                y: row.severity_daily_km2,
                            });
                        }

                        if (row.severity_14d_km2 !== null) {
                            formattedLakeSeverity14d.push({
                                x: Date.parse(row.date),
                                y: row.severity_14d_km2,
                            });
                        }

                        if (row.extent_daily_km2 !== null) {
                            formattedLakeExtentDaily.push({
                                x: Date.parse(row.date),
                                y: row.extent_daily_km2,
                            });
                        }

                        if (row.extent_14d_km2 !== null) {
                            formattedLakeExtent14d.push({
                                x: Date.parse(row.date),
                                y: row.extent_14d_km2,
                            });
                        }

                        if (this.lakeArea !== 0) {
                            if (row.extent_daily_pct !== null) {
                                formattedLakeExtentPercentageDaily.push({
                                    x: Date.parse(row.date),
                                    y: row.extent_daily_pct,
                                });
                            }

                            if (row.extent_14d_pct !== null) {
                                formattedLakeExtentPercentage14d.push({
                                    x: Date.parse(row.date),
                                    y: row.extent_14d_pct,
                                });
                            }
                        }
                    }
                });

                // format specific point & whole lake algal daily metadata: median & 25th-75th percentiles
                // data will be aggregated across all years but varies within combinations of months/days
                // result: 1 year of all combinations of months/days
                // row.date: ex.'1972-09-07 00:00:00' where '1972' is a permanent placeholder leap year with Feb 29th
                // process: requires swapping '1972' with archived years and repeated for each year available
                for (let i = 0; i <= (endYear - startYear); i += 1) {
                    const PLACEHOLDER_YEAR = '1972';
                    const year = parseInt(startYear, 10);
                    const increment = i;
                    this.chartMetadata.forEach((row) => {
                        // check for specific point selection mode
                        if (this.isPointSelection) {
                            if (row.median_14d !== null) {
                                formattedPointValue14dMedian.push({
                                    x: Date.parse(row.date.replace(PLACEHOLDER_YEAR, year + increment)),
                                    y: row.median_14d,
                                });
                            }

                            if (row.percentile_25_14d !== null && row.percentile_75_14d !== null) {
                                formattedPointValue14dPercentiles.push([
                                    Date.parse(row.date.replace(PLACEHOLDER_YEAR, year + increment)),
                                    row.percentile_25_14d,
                                    row.percentile_75_14d,
                                ]);
                            }

                        // check for whole lake selection mode
                        } else {
                            if (row.median_intensity_14d !== null) {
                                formattedLakeIntensity14dMedian.push({
                                    x: Date.parse(row.date.replace(PLACEHOLDER_YEAR, year + increment)),
                                    y: row.median_intensity_14d,
                                });
                            }

                            if (row.median_severity_14d !== null) {
                                formattedLakeSeverity14dMedian.push({
                                    x: Date.parse(row.date.replace(PLACEHOLDER_YEAR, year + increment)),
                                    y: row.median_severity_14d / 1000000, // m2 to km2
                                });
                            }

                            if (row.median_extent_14d !== null) {
                                formattedLakeExtent14dMedian.push({
                                    x: Date.parse(row.date.replace(PLACEHOLDER_YEAR, year + increment)),
                                    y: row.median_extent_14d / 1000000, // m2 to km2
                                });
                            }

                            if (row.percentile_25_intensity_14d !== null && row.percentile_75_intensity_14d !== null) {
                                formattedLakeIntensity14dPercentiles.push([
                                    Date.parse(row.date.replace(PLACEHOLDER_YEAR, year + increment)),
                                    row.percentile_25_intensity_14d,
                                    row.percentile_75_intensity_14d,
                                ]);
                            }

                            if (row.percentile_25_severity_14d !== null && row.percentile_75_severity_14d !== null) {
                                formattedLakeSeverity14dPercentiles.push([
                                    Date.parse(row.date.replace(PLACEHOLDER_YEAR, year + increment)),
                                    row.percentile_25_severity_14d / 1000000, // m2 to km2
                                    row.percentile_75_severity_14d / 1000000, // m2 to km2
                                ]);
                            }

                            if (row.percentile_25_extent_14d !== null && row.percentile_75_extent_14d !== null) {
                                formattedLakeExtent14dPercentiles.push([
                                    Date.parse(row.date.replace(PLACEHOLDER_YEAR, year + increment)),
                                    row.percentile_25_extent_14d / 1000000, // m2 to km2
                                    row.percentile_75_extent_14d / 1000000, // m2 to km2
                                ]);
                            }
                        }
                    });
                }
            }

            let processedData = [];
            // processed data for specific point selection mode
            if (this.isPointSelection) {
                processedData = [
                    {
                        data: formattedPointValueDaily,
                        id: 'value_daily',
                        name: this.$t('chart.tooltip.daily-specific-point'),
                        color: scssVars.colorChartAlgalDaily,
                        visible: false,
                    },
                    {
                        data: formattedPointValue14d,
                        id: 'value_14d',
                        name: this.$t('chart.tooltip.14d-specific-point'),
                        color: scssVars.colorChartAlgal,
                        visible: false,
                    },
                    {
                        data: formattedPointValue14dMedian,
                        id: 'median_value_14d',
                        name: `${this.$t('chart.tooltip.median')} (µg/L)`,
                        color: scssVars.colorChartMedian,
                        visible: false,
                    },
                    {
                        data: formattedPointValue14dPercentiles,
                        id: 'quartiles_value_14d',
                        name: `${this.$t('chart.tooltip.quartiles')} (µg/L)`,
                        color: scssVars.colorChartQuartiles,
                        visible: false,
                    },
                ];
            // processed data for whole lake selection mode
            } else {
                processedData = [
                    {
                        data: formattedLakeExtentDaily,
                        id: 'extent_daily',
                        name: this.$t('chart.tooltip.daily-extent'),
                        color: scssVars.colorChartAlgalDaily,
                        visible: false,
                    },
                    {
                        data: formattedLakeExtent14d,
                        id: 'extent_14d',
                        name: this.$t('chart.tooltip.14d-extent'),
                        color: scssVars.colorChartAlgal,
                        visible: false,
                    },
                    {
                        data: formattedLakeExtentPercentageDaily,
                        id: 'extent_daily_percent',
                        name: this.$t('chart.tooltip.daily-extent-percent'),
                        color: scssVars.colorChartNonvisible,
                        visible: false,
                    },
                    {
                        data: formattedLakeExtentPercentage14d,
                        id: 'extent_14d_percent',
                        name: this.$t('chart.tooltip.14d-extent-percent'),
                        color: scssVars.colorChartNonvisible,
                        visible: false,
                    },
                    {
                        data: formattedLakeIntensityDaily,
                        id: 'intensity_daily',
                        name: this.$t('chart.tooltip.daily-intensity'),
                        color: scssVars.colorChartAlgalDaily,
                        visible: false,
                    },
                    {
                        data: formattedLakeIntensity14d,
                        id: 'intensity_14d',
                        name: this.$t('chart.tooltip.14d-intensity'),
                        color: scssVars.colorChartAlgal,
                        visible: false,
                    },
                    {
                        data: formattedLakeSeverityDaily,
                        id: 'severity_daily',
                        name: this.$t('chart.tooltip.daily-severity'),
                        color: scssVars.colorChartAlgalDaily,
                        visible: false,
                    },
                    {
                        data: formattedLakeSeverity14d,
                        id: 'severity_14d',
                        name: this.$t('chart.tooltip.14d-severity'),
                        color: scssVars.colorChartAlgal,
                        visible: false,
                    },

                    {
                        data: formattedLakeExtent14dMedian,
                        id: 'median_extent_14d',
                        name: `${this.$t('chart.tooltip.median')} (km²)`,
                        color: scssVars.colorChartMedian,
                        visible: false,
                    },
                    {
                        data: formattedLakeIntensity14dMedian,
                        id: 'median_intensity_14d',
                        name: `${this.$t('chart.tooltip.median')} (µg/L)`,
                        color: scssVars.colorChartMedian,
                        visible: false,
                    },
                    {
                        data: formattedLakeSeverity14dMedian,
                        id: 'median_severity_14d',
                        name: `${this.$t('chart.tooltip.median')} (km² µg/L)`,
                        color: scssVars.colorChartMedian,
                        visible: false,
                    },
                    {
                        data: formattedLakeExtent14dPercentiles,
                        id: 'quartiles_extent_14d',
                        name: `${this.$t('chart.tooltip.quartiles')} (km²)`,
                        color: scssVars.colorChartQuartiles,
                        visible: false,
                    },
                    {
                        data: formattedLakeIntensity14dPercentiles,
                        id: 'quartiles_intensity_14d',
                        name: `${this.$t('chart.tooltip.quartiles')} (µg/L)`,
                        color: scssVars.colorChartQuartiles,
                        visible: false,
                    },
                    {
                        data: formattedLakeSeverity14dPercentiles,
                        id: 'quartiles_severity_14d',
                        name: `${this.$t('chart.tooltip.quartiles')} (km² µg/L)`,
                        color: scssVars.colorChartQuartiles,
                        visible: false,
                    },
                ];
            }
            return processedData;
        },

        /**
         * switch chart series visibility and label settings based on the algal bloom indices
         */
        chartOptions() {
            const axisLabel = this.isPointSelection ? this.$i18n.t('chart.specific-point')
                : this.$i18n.t(`chart.bloom-${this.bloomIndex}`);
            return {
                // chart series data options
                bloomIndex: this.bloomIndex,
                chlValue: this.chlValue,
                chartElements: this.chartElements,

                // chart axis label options
                yAxisLabel: axisLabel,
                y1UnitOfMeasurement: this.isPointSelection ? 'μg/L' : this.yAxisUnit,
                y2AxisLabel: `${axisLabel} ${this.$i18n.t('chart.percent-of-lake')}`,
            };
        },

        // localized lake name from lake ID
        selectedLakeName() {
            return this.$t(`lakes.${this.selectedLakeId}`);
        },

        // true if any blocking operations are happening
        // (like critical API requests)
        loading() {
            return this.fetchingDateStrings
                || this.fetchingLakeData
                || this.fetchingChartData
                || this.fetchingPointData;
        },

        // return specific point or whole lake data
        chartData() {
            return this.isPointSelection ? this.chartSpecificPointData : this.chartWholeLakeData;
        },

        // return specific point or whole lake metadata
        chartMetadata() {
            return this.isPointSelection ? this.chartSpecificPointMetadata : this.chartWholeLakeMetadata;
        },

        // translated algal data legend with users dynamic selections
        chartLegendAlgalDisplay() {
            return this.chlValue.map((option) => {
                if (this.isPointSelection) {
                    return {
                        title: `${this.$t(`chl-value.${option}`)} ${this.$t('bloom-index.specific-point')}`,
                        class: `chart-algal-${option}`,
                    };
                }

                return {
                    title: `${this.$t(`chl-value.${option}`)} ${this.$t(`chart.bloom-${this.bloomIndex}`)}`,
                    class: `chart-algal-${option}`,
                };
            });
        },

        // map popup contents
        mapPopupContents() {
            return {
                chlorophyllA: this.popupChlorophyllAPoint[`value_${this.chlValueMap}`],
            };
        },
    },

    watch: {
        selectedLakeId() {
            // clear any selected point when lake changes
            this.pointSelection = {};
            this.getAvailableDates(this.selectedLakeId);
            this.getChartData(this.selectedLakeId);
            this.getLakeData(this.selectedLakeId);
            this.getLakeBoundaryGeojson();
        },

        date() {
            this.getLakeData(this.selectedLakeId);

            // trigger specific point call if still in point selection mode when date is changed
            // and point hasn't been cleared (lake switched)
            if (this.isPointSelection && Object.keys(this.pointSelection).length) {
                this.getPointData();
            }
        },
    },

    created() {
        this.setLanguage();
    },

    methods: {
        /**
         * Change date slider to given date
         * @param {Number} date - date represented in unix seconds
         *
         */
        changeSelectedDate(date) {
            this.date = dayjs.utc(date);
        },

        /**
         * Pad extra years in the chart data so it always ranges from 2002 - present
         * @param {Array} data - array of chart data objects
         *
         * @returns {Array} - new padded array of chart data objects
         */
        padChartYears(data) {
            const studyStartDate = '2002-01-01T00:00:00.000Z'; // first day of 2002
            const today = dayjs.utc().format();
            const output = [];

            // return empty array if data is empty
            if (!data.length) return [];

            // add first day of study (if it doesn't already exist)
            if (dayjs(data[0].date).isAfter(studyStartDate)) {
                output.push({
                    date: studyStartDate,
                    lake: this.selectedLakeId,
                    st_setsrid: '',
                    value_14d: null,
                    value_daily: null,
                });
            }

            // add all the existing chart data into the middle
            output.push(...data);

            // add todays date (if it doesn't already exist)
            if (dayjs(data[data.length - 1].date).isBefore(today)) {
                output.push({
                    date: today,
                    lake: this.selectedLakeId,
                    st_setsrid: '',
                    value_14d: null,
                    value_daily: null,
                });
            }

            return output;
        },

        /**
         * clear median/quartile elements chart options
         */
        clearChartCheckboxes() {
            this.chartElements = [];
        },

        // check query string against languages array to set the i18n locale
        setLanguage() {
            const { lang } = this.$route.query;
            if (this.languages.includes(lang)) {
                this.$i18n.locale = lang;
            }
        },

        // store map object for map image export function
        mapLoaded(ev, map) {
            this.map = map;
        },

        mapClicked(ev) {
            // only trigger map popup and point data when in specific point mode
            if (this.isPointSelection) {
                this.pointSelection = ev.latlng;
                this.getPointData();
            }
        },

        /**
         * return a dayjs object for today's date
         * @returns {number} dayjs instance for current date/time
         */
        now() {
            return dayjs();
        },

        /**
         * get lake boundaries for each available lake
         */
        async getLakeBoundaryGeojson() {
            try {
                // grab lake boundary geojson for selected lake
                const baseUrl = process.env.VUE_APP_COG_STORAGE_URL;
                const storageBucketName = process.env.VUE_APP_BOUNDARY_CONTAINER;
                const lakeBoundary = await axios.get(`${baseUrl}/${storageBucketName}/${this.selectedLakeId}_4326.geojson`)
                    .then((response) => response.data);

                this.lakeBoundaryGeojson = lakeBoundary;
            } catch (error) {
                this.handleApiError(error);
            }
        },

        /**
         * Download the current chart view as an image
         */
        async exportChart() {
            // don't attempt a render if the chart isn't initialized yet
            if (this.chartObj === null) return;

            try {
                this.loadingChartExport = true;

                // composite everything on a canvas to finally export and download as an image
                const canvasDimensions = { height: 1000, width: 900 };
                const margin = { t: 60, l: 160 };
                const contentWidth = canvasDimensions.width - (margin.l * 2);
                const mapExportCanvas = document.createElement('canvas');
                const canvas = new fabric.Canvas(mapExportCanvas, {
                    width: canvasDimensions.width,
                    height: canvasDimensions.height,
                    backgroundColor: '#fff',
                    selection: false,
                });

                // add ECCC logo
                await new Promise((resolve, reject) => {
                    fabric.Image.fromURL(ecccLogoImg, (oImg, error) => {
                        if (error) reject();

                        oImg.scaleToWidth(600);
                        oImg.set({
                            top: margin.t,
                        });
                        canvas.add(oImg);
                        oImg.centerH();
                        resolve();
                    });
                });

                // add title text
                const textStyleOptions = {
                    left: margin.l,
                    fontFamily: 'Arial',
                };
                const titleText = new fabric.Text(this.$t('header.title'), {
                    top: margin.t + 60,
                    fontSize: 28,
                    fontWeight: 'bold',
                    ...textStyleOptions,
                });
                const subtitleText = new fabric.Text(this.$t('header.subtitle'), {
                    top: margin.t + 94,
                    fontSize: 16,
                    ...textStyleOptions,
                });
                canvas.add(titleText, subtitleText);

                // add horizontal rule
                const hr = new fabric.Rect({
                    top: margin.t + 130,
                    width: 580,
                    height: 2,
                    fill: '#BDBDBD',
                });
                canvas.add(hr);
                hr.centerH();

                // add data export date
                const dataTextSpacing = 35;
                const dataDate = this.date.format('YYYY-MM-DD');
                const dataDateText = new fabric.Text(`${this.$t('export.chart.data-date')} ${dataDate}`, {
                    top: margin.t + 160,
                    fontSize: 16,
                    ...textStyleOptions,
                });
                // add lake name
                const lakeName = `${this.$t('export.map.lake')} ${this.selectedLakeName}`;
                const lakeNameText = new fabric.Text(lakeName, {
                    top: margin.t + 160 + dataTextSpacing * 1,
                    fontSize: 16,
                    ...textStyleOptions,
                });

                canvas.add(dataDateText, lakeNameText);

                // manually grab the chart svg to pass to the export server
                const svg = document.querySelector('svg.highcharts-root').outerHTML;

                // use Highcharts export server hosted on azure as a docker container to get PNG image
                // (local svg->png with dom-to-image doesn't render the line correctly)
                const chartImgDataUrl = await axios.post('https://highcharts-export.canadacentral.azurecontainer.io', {
                    svg,
                    constr: 'StockChart',
                    type: 'image/png',
                }, { responseType: 'arraybuffer' })
                    .then((response) => {
                        // convert file buffer to dataURL string
                        const bufferString = Buffer.from(response.data, 'binary').toString('base64');
                        const dataUrl = `data:${response.headers['content-type']};base64,${bufferString}`;
                        return dataUrl;
                    });

                // add chart png to canvas
                const chartTopPosition = margin.t + 240;
                let chartHeight = 0;
                await new Promise((resolve, reject) => {
                    fabric.Image.fromURL(chartImgDataUrl, (oImg, error) => {
                        if (error) reject();

                        oImg.scaleToWidth(contentWidth);
                        oImg.set({
                            top: chartTopPosition,
                        });
                        canvas.add(oImg);
                        oImg.centerH();
                        chartHeight = oImg.getScaledHeight();
                        resolve();
                    });
                });
                const chartBottom = chartTopPosition + chartHeight;

                // add chart legend
                // render chart legend to PNG dataURL
                let chartLegendImgDataUrl = '';
                const legendItems = [...this.chlValue, ...this.chartElements];
                const isEnglish = this.$i18n.locale === 'en';

                // Select correct pre-rendered chart legend image to match options selected by user
                if (['14d', 'daily', 'median', 'quartiles'].every((i) => legendItems.includes(i))) {
                    chartLegendImgDataUrl = (isEnglish) ? LEGEND_14D_DAILY_MEDIAN_PERCENT
                        : LEGEND_FRENCH_14D_DAILY_MEDIAN_PERCENT;
                } else if (['14d', 'daily', 'median'].every((i) => legendItems.includes(i))) {
                    chartLegendImgDataUrl = (isEnglish) ? LEGEND_14D_DAILY_MEDIAN : LEGEND_FRENCH_14D_DAILY_MEDIAN;
                } else if (['14d', 'daily', 'quartiles'].every((i) => legendItems.includes(i))) {
                    chartLegendImgDataUrl = (isEnglish) ? LEGEND_14D_DAILY_PERCENT : LEGEND_FRENCH_14D_DAILY_PERCENT;
                } else if (['14d', 'median', 'quartiles'].every((i) => legendItems.includes(i))) {
                    chartLegendImgDataUrl = (isEnglish) ? LEGEND_14D_MEDIAN_PERCENT : LEGEND_FRENCH_14D_MEDIAN_PERCENT;
                } else if (['14d', 'quartiles'].every((i) => legendItems.includes(i))) {
                    chartLegendImgDataUrl = (isEnglish) ? LEGEND_14D_PERCENT : LEGEND_FRENCH_14D_PERCENT;
                } else if (['14d', 'median'].every((i) => legendItems.includes(i))) {
                    chartLegendImgDataUrl = (isEnglish) ? LEGEND_14D_MEDIAN : LEGEND_FRENCH_14D_MEDIAN;
                } else if (['14d', 'daily'].every((i) => legendItems.includes(i))) {
                    chartLegendImgDataUrl = (isEnglish) ? LEGEND_14D_DAILY : LEGEND_FRENCH_14D_DAILY;
                } else if (['14d'].every((i) => legendItems.includes(i))) {
                    chartLegendImgDataUrl = (isEnglish) ? LEGEND_14D : LEGEND_FRENCH_14D;
                } else if (['daily'].every((i) => legendItems.includes(i))) {
                    chartLegendImgDataUrl = (isEnglish) ? LEGEND_DAILY : LEGEND_FRENCH_DAILY;
                }

                let chartLegendHeight = 0; // save height to position later elements
                await new Promise((resolve, reject) => {
                    fabric.Image.fromURL(chartLegendImgDataUrl, (oImg, error) => {
                        if (error) reject();

                        oImg.scaleToWidth(contentWidth);
                        // save height to position later elements
                        chartLegendHeight = oImg.getScaledHeight();
                        oImg.set({
                            top: chartBottom,
                            selectable: false,
                        });
                        canvas.add(oImg);
                        oImg.centerH();
                        resolve();
                    });
                });
                const chartLegendBottom = chartBottom + chartLegendHeight;

                // add ECCC "leaves" logo
                await new Promise((resolve, reject) => {
                    fabric.Image.fromURL(ecccLeavesImg, (oImg, error) => {
                        if (error) reject();

                        oImg.scaleToWidth(130);
                        const imgWidth = oImg.getScaledWidth();
                        oImg.set({
                            top: chartLegendBottom + 30,
                            left: margin.l + contentWidth - imgWidth, // right align
                            selectable: false,
                        });
                        canvas.add(oImg);
                        resolve();
                    });
                });

                // add chart export date
                const exportDate = dayjs().format('YYYY-MM-DD');
                const exportDateText = new fabric.Text(`${this.$t('export.chart.date-exported')} ${exportDate}`, {
                    top: chartLegendBottom + 75,
                    fontSize: 16,
                    ...textStyleOptions,
                });
                canvas.add(exportDateText);

                // resize canvas to fit contents
                canvas.setHeight(chartLegendBottom + 100 + margin.t); // use top margin to give equal top/bottom padding
                canvas.calcOffset();

                // call a final render with everything on the canvas
                canvas.renderAll();
                // convert to a blob and export
                canvas.getElement().toBlob((blob) => {
                    saveAs(blob, this.$t('export.chart.filename'));
                });
            } catch (error) {
                this.$displayMessage(error, this.$t('export.chart.error-message'));
            } finally {
                this.loadingChartExport = false;
            }
        },

        /**
         * Download the current map view as an image
         */
        async exportMap() {
            try {
                this.loadingMapExport = true;
                const mapEl = document.getElementById('map');
                const mapDimensions = this.map.getSize();

                // render map view as PNG image dataURL
                const imageOptions = {
                // export the same dimensions as the map on screen
                    height: mapDimensions.y,
                    width: mapDimensions.x,

                    // use transparent image for missing images (map tiles with no data)
                    imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',

                    // append timestamps to requests; don't reuse cached tiles
                    cacheBust: true,

                    // exclude map controls from image export
                    filter(domNode) {
                    // include dom nodes with no classList
                    // (probably plain innerText inside tags)
                        if (!domNode.classList) return true;

                        // exclude zoom controls
                        if (domNode.classList.contains('leaflet-control-zoom')) {
                            return false;
                        }

                        return true;
                    },
                };
                const mapImgDataUrl = await domToImage.toPng(mapEl, imageOptions);

                // composite everything on a canvas to finally export and download as an image
                const canvasDimensions = { height: 1000, width: 900 };
                const margin = { t: 60, l: 160 };
                const mapExportCanvas = document.createElement('canvas');
                const canvas = new fabric.Canvas(mapExportCanvas, {
                    width: canvasDimensions.width,
                    height: canvasDimensions.height,
                    backgroundColor: '#fff',
                    selection: false,
                });

                // add ECCC logo
                await new Promise((resolve, reject) => {
                    fabric.Image.fromURL(ecccLogoImg, (oImg, error) => {
                        if (error) reject();

                        oImg.scaleToWidth(600);
                        oImg.set({
                            top: margin.t,
                        });
                        canvas.add(oImg);
                        oImg.centerH();
                        resolve();
                    });
                });

                // add title text
                const textStyleOptions = {
                    left: margin.l,
                    fontFamily: 'Arial',
                };
                const titleText = new fabric.Text(this.$t('header.title'), {
                    top: margin.t + 60,
                    fontSize: 28,
                    fontWeight: 'bold',
                    ...textStyleOptions,
                });
                const subtitleText = new fabric.Text(this.$t('header.subtitle'), {
                    top: margin.t + 94,
                    fontSize: 16,
                    ...textStyleOptions,
                });
                canvas.add(titleText, subtitleText);

                // add horizontal rule
                const hr = new fabric.Rect({
                    top: margin.t + 130,
                    width: 580,
                    height: 2,
                    fill: '#BDBDBD',
                });
                canvas.add(hr);
                hr.centerH();

                // add lake/data text
                // - data date
                const dataTextSpacing = 35;
                const dataDate = this.date.format('YYYY-MM-DD');
                const dataDateText = new fabric.Text(`${this.$t('export.map.data-date')} ${dataDate}`, {
                    top: margin.t + 160,
                    fontSize: 16,
                    ...textStyleOptions,
                });
                // - lake name
                const lakeName = `${this.$t('export.map.lake')} ${this.selectedLakeName}`;
                const lakeNameText = new fabric.Text(lakeName, {
                    top: margin.t + 160 + dataTextSpacing * 1,
                    fontSize: 16,
                    ...textStyleOptions,
                });
                canvas.add(dataDateText, lakeNameText);

                let mapTopPosition = 0;

                // add whole lake details
                if (!this.isPointSelection) {
                    // - extent
                    let extent = this.$t('export.map.extent');
                    const extentValue = numeral(this.lakeData[`extent_${this.chlValueMap}_km2`]).format('0,0.00');
                    extent = `${extent} ${extentValue} km²`;

                    const extentText = new fabric.Text(extent, {
                        top: margin.t + 160 + dataTextSpacing * 2,
                        fontSize: 16,
                        ...textStyleOptions,
                    });
                    // - extent percent
                    let extentPercent = this.$t('export.map.extent');
                    const extentPercentValue = numeral(this.lakeData[`extent_${this.chlValueMap}_pct`]).format('0.00');
                    extentPercent = `${extentPercent} ${extentPercentValue}${this.$t('export.map.percent-of-lake')}`;

                    const extentPercentText = new fabric.Text(extentPercent, {
                        top: margin.t + 160 + dataTextSpacing * 3,
                        fontSize: 16,
                        ...textStyleOptions,
                    });
                    // - intensity
                    let intensity = this.$t('export.map.intensity');
                    const chloroALakeValue = numeral(this.lakeData[`intensity_${this.chlValueMap}`]).format('0,0.00');
                    intensity = `${intensity} ${chloroALakeValue} µg/L`;

                    const intensityText = new fabric.Text(intensity, {
                        top: margin.t + 160 + dataTextSpacing * 4,
                        fontSize: 16,
                        ...textStyleOptions,
                    });
                    // - severity
                    let severity = this.$t('export.map.severity');
                    const severityValue = numeral(this.lakeData[`severity_${this.chlValueMap}_km2`]).format('0,0.00');
                    severity = `${severity} ${severityValue} µg/L km²`;

                    const severityText = new fabric.Text(severity, {
                        top: margin.t + 160 + dataTextSpacing * 5,
                        fontSize: 16,
                        ...textStyleOptions,
                    });
                    canvas.add(extentText, extentPercentText, intensityText, severityText);
                    mapTopPosition = 370;
                }

                // add point selection details
                if (this.isPointSelection) {
                    // add vertical rule
                    const vr = new fabric.Rect({
                        top: margin.t + 150,
                        width: 2,
                        height: 70,
                        fill: '#BDBDBD',
                    });
                    canvas.add(vr);
                    vr.centerH();

                    // left position for second column of text
                    const col2Left = canvas.getCenter().left + 10;

                    // add formatted values for lat/lng
                    let { lng, lat } = this.pointSelection;
                    lng = numeral(lng).format('0[.][0000]');
                    lat = numeral(lat).format('0[.][0000]');
                    const longLat = `${this.$t('export.map.longitude')} ${lng}, ${this.$t('export.map.latitude')} ${lat}`;
                    const longLatText = new fabric.Text(longLat, {
                        fontSize: 16,
                        ...textStyleOptions,
                        top: margin.t + 160,
                        left: col2Left,
                    });

                    // add chorophyll-a (point selection) value
                    let chlorophyllAPoint = this.$t('export.map.chlorophyll-a-point');
                    let chloroAPointValue = `${numeral(this.mapPopupContents.chlorophyllA).format('0,0.0[0]')} µg/L`;

                    if (this.mapPopupContents.chlorophyllA < 10) {
                        chloroAPointValue = '< 10 µg/L';
                    }

                    if (!this.mapPopupContents.chlorophyllA) {
                        chloroAPointValue = this.$t('shared.not-available');
                    }
                    chlorophyllAPoint = `${chlorophyllAPoint} ${chloroAPointValue}`;
                    const chlorophyllAPointText = new fabric.Text(chlorophyllAPoint, {
                        fontSize: 16,
                        ...textStyleOptions,
                        top: margin.t + 160 + dataTextSpacing * 1,
                        left: col2Left,
                    });

                    canvas.add(longLatText, chlorophyllAPointText);
                    mapTopPosition = 265;
                }

                // add map image (from dataURL)
                mapTopPosition = margin.t + mapTopPosition;
                let mapHeight = 0; // save height to position later elements
                await new Promise((resolve, reject) => {
                    fabric.Image.fromURL(mapImgDataUrl, (oImg, error) => {
                        if (error) reject();

                        oImg.scaleToWidth(550);
                        // height is dynamic (map size depends on the screen size)
                        // save height to position later elements
                        mapHeight = oImg.getScaledHeight();
                        oImg.set({
                            top: mapTopPosition,
                            selectable: false,
                            strokeWidth: 3,
                            stroke: '#04444E',
                        });
                        canvas.add(oImg);
                        oImg.centerH();
                        resolve();
                    });
                });
                const mapBottom = mapTopPosition + mapHeight;

                // determine which static map legend image should be added to export
                let mapLegendExportImage = '';
                switch (`${this.selectedColorScale}${this.maxColorScale}`) {
                case 'standardScale80':
                    mapLegendExportImage = standard80;
                    break;
                case 'standardScale60':
                    mapLegendExportImage = standard60;
                    break;
                case 'standardScale40':
                    mapLegendExportImage = standard40;
                    break;
                case 'cividisScale80':
                    mapLegendExportImage = asscessible80;
                    break;
                case 'cividisScale60':
                    mapLegendExportImage = asscessible60;
                    break;
                case 'cividisScale40':
                    mapLegendExportImage = asscessible40;
                    break;
                default:
                    break;
                }

                // add map legend
                let mapLegendHeight = 0; // save height to position later elements
                await new Promise((resolve, reject) => {
                    fabric.Image.fromURL(mapLegendExportImage, (oImg, error) => {
                        if (error) reject();

                        oImg.scaleToWidth(600);
                        // save height to position later elements
                        mapLegendHeight = oImg.getScaledHeight();
                        oImg.set({
                            top: mapBottom + 35,
                            selectable: false,
                        });
                        canvas.add(oImg);
                        oImg.centerH();
                        resolve();
                    });
                });
                const mapLegendBottom = mapBottom + 35 + mapLegendHeight;

                // add ECCC "leaves" logo
                await new Promise((resolve, reject) => {
                    fabric.Image.fromURL(ecccLeavesImg, (oImg, error) => {
                        if (error) reject();

                        oImg.scaleToWidth(130);
                        const imgWidth = oImg.getScaledWidth();
                        oImg.set({
                            top: mapLegendBottom + 30,
                            left: margin.l + 600 - imgWidth, // right align
                            selectable: false,
                        });
                        canvas.add(oImg);
                        resolve();
                    });
                });

                // add data export date
                const exportDate = dayjs().format('YYYY-MM-DD');
                const exportDateText = new fabric.Text(`${this.$t('export.map.date-exported')} ${exportDate}`, {
                    top: mapLegendBottom + 75,
                    fontSize: 16,
                    ...textStyleOptions,
                });
                canvas.add(exportDateText);

                // resize canvas to fit contents
                canvas.setHeight(mapLegendBottom + 100 + margin.t); // use top margin to give equal top/bottom padding
                canvas.calcOffset();

                // call a final render with everything on the canvas
                canvas.renderAll();
                // convert to a blob and export
                canvas.getElement().toBlob((blob) => {
                    saveAs(blob, this.$t('export.map.filename'));
                });
            } catch (error) {
                this.$displayMessage(error, this.$t('export.map.error-message'));
            } finally {
                this.loadingMapExport = false;
            }
        },

        /**
         * handle "select point" events
         * @param {Object} coords - coordinate location containing {lat, lng}
         */
        selectPoint(coords) {
            this.pointSelection = coords;
            this.showMapOverlay = false;
            this.getPointData();
        },

        /**
         * handle "whole lake" selection events
         */
        selectLakeMode() {
            this.isPointSelection = false;
            this.pointSelection = {};
            this.showMapOverlay = false;
            this.resetPopupChlorophyllAPoint();
            this.bloomIndex = 'extent';
            this.clearChartCheckboxes();
        },

        /**
         * handle "point mode" event
         */
        selectPointMode() {
            this.isPointSelection = true;
            this.showMapOverlay = true;
            this.bloomIndex = 'specific-point';
            this.clearChartCheckboxes();
        },

        /**
         * Show or hide the mask layer outlining the selected lake
         * @param {Boolean} val - whether the mask should be displayed or not
         */
        changeBoundaryMask(val) {
            this.showLakeBoundary = val;
        },

        /**
         * get date that have data available
         * @param {String} lake - string id of lake
         */
        async getAvailableDates(lake) {
            // clear current dates array
            this.availableDates = [];

            try {
                // fetch array of date strings
                this.fetchingDateStrings = true;
                const dateStrings = await axios.get(`${process.env.VUE_APP_API_URL}/date-picker`, {
                    params: {
                        lake,
                    },
                })
                    .then((response) => response.data);

                // first and last years of available date as 'YYYY'
                this.yearRange = {
                    first: Number(dayjs(dateStrings[0]).format('YYYY')),
                    last: Number(dayjs(dateStrings[dateStrings.length - 1]).format('YYYY')),
                };

                // format date strings as date objects, force timezone to utc
                this.availableDates = dateStrings.map((d) => dayjs.utc(d));

                // select the most recent date
                this.useLatestDate();

                this.fetchingDateStrings = false;
            } catch (error) {
                this.handleApiError(error);
            }
        },

        /**
         *  differentiate and update chart selector inputs and label options
         *  @param {String} option - user chart selector inputs
         */
        selectChart(option) {
            if (option === 'extent' || option === 'intensity' || option === 'severity') {
                this.bloomIndex = option;
                if (option === 'extent') {
                    this.yAxisUnit = 'x10³ km²';
                }
                if (option === 'intensity') {
                    this.yAxisUnit = 'μg/L';
                }
                if (option === 'severity') {
                    this.yAxisUnit = 'μg/L x10³ km²';
                }
            }
            if (Array.isArray(option) && option.length && (option.includes('14d') || option.includes('daily'))) {
                this.chlValue = option;
            }
            if (option === 'median' || option === 'quartiles') {
                this.chartElements = option;
            }
        },

        /**
         * set selected lake id when a lake (or new lake) is selected
         *
         * @param {String} val - new id of selected lake
         */
        updateSelectedLake(val) {
            this.selectedLakeId = val;
        },

        /**
         * get whole lake data from db
         * @param {String} lake - string id of lake
         */
        async getLakeData(lake) {
            try {
                this.fetchingLakeData = true;
                const lakeData = await axios.get(`${process.env.VUE_APP_API_URL}/lake-data`, {
                    params: {
                        lake,
                        date: this.date,
                    },
                })
                    .then((response) => response.data);

                this.lakeData = {
                    ...lakeData,
                    date: {
                        day: dayjs(this.date).format('D'),
                        month: dayjs(this.date).format('MMM').toLowerCase(),
                        year: dayjs(this.date).format('YYYY'),
                    },
                };
                this.fetchingLakeData = false;
            } catch (error) {
                this.handleApiError(error);
            }
        },

        /**
         * get data for specific point (map click or lng/lat entry)
         */
        async getPointData() {
            // reset specific point chl-a
            this.resetPopupChlorophyllAPoint();

            try {
                const { lng, lat } = this.pointSelection;
                // fetch object of date strings
                this.fetchingPointData = true;
                const data = await axios.get(`${process.env.VUE_APP_API_URL}/specific-point`, {
                    params: {
                        lake: this.selectedLakeId,
                        lng,
                        lat,
                    },
                })
                    .then((response) => response.data);

                this.chartSpecificPointData = this.padChartYears(data.pointData);
                this.chartSpecificPointMetadata = data.pointMetadata;

                // look through data response for a specific point matching the selected date
                for (let i = 0; i < data.pointData.length; i += 1) {
                    // compare selected date against all dates in response for a match
                    if (dayjs.utc(this.date).format('YYYY-MM-DD') === dayjs.utc(data.pointData[i].date).format('YYYY-MM-DD')) {
                        this.popupChlorophyllAPoint = {
                            value_14d: data.pointData[i].unfiltered_value_14d,
                            value_daily: data.pointData[i].unfiltered_value_daily,
                        };
                        break;
                    }
                }
                this.fetchingPointData = false;
            } catch (error) {
                this.handleApiError(error);
            }
        },

        /**
         * reset chl-a point data
         */
        resetPopupChlorophyllAPoint() {
            this.popupChlorophyllAPoint = {
                value_14d: null,
                value_daily: null,
            };
        },

        /**
         * get chart data from db for a given lake ID
         * @param {String} lake - string id of lake
         */
        async getChartData(lake) {
            try {
                // fetch chart data from the API
                this.fetchingChartData = true;
                const chartData = await axios.get(`${process.env.VUE_APP_API_URL}/chart`, {
                    params: {
                        lake,
                    },
                })
                    .then((response) => response.data);

                this.chartWholeLakeData = this.padChartYears(chartData.lakeData);
                this.chartWholeLakeMetadata = chartData.lakeMetadata;

                this.lakeArea = chartData.lakeArea;

                this.fetchingChartData = false;
            } catch (error) {
                this.handleApiError(error);
            }
        },

        /**
         * Handle critical api errors: display a message and reload the page
         * @param {Error} error - application error (will print to console)
         */
        handleApiError(error) {
            this.$displayMessage(error, this.$t('shared.error-critical'), true);
        },

        /**
         * change the selected date to the latest date in availableDates
         */
        useLatestDate() {
            const latestDate = this.availableDates[this.availableDates.length - 1];
            this.date = latestDate;
        },
    },
};
</script>

<style lang="scss">
.lake-watch {
    .page-section {
        margin: 2rem 0;

        &.header {
            display: flex;
            flex-flow:column wrap;

            .title {
                margin: 1.25rem 0 0.5rem;
            }

            .eolakewatch-logo {
                align-self: flex-end;
                max-width: 30%;
            }

            @include tablet {
                flex-flow:row wrap;

                .header-flex-helper {
                    flex: 2 0px;
                    order: 1;

                    img.eccc-logo,
                    title {
                        max-width: 65%;
                    }
                }

                .eolakewatch-logo {
                    order: 2;
                    max-width: 15%;
                }
            }
        }

        .color-scales {
            display: flex;
            flex-direction: column;
            margin-top: 1rem;

            .radio-option-wrapper {
                display: flex;
                flex-direction: column;

                .radio.radio-option {
                    margin: 0 0 0.5rem 0;
                }
            }

            @include tablet {
                .scale-selector {
                    margin-right: 2rem;
                }

                .radio-option-wrapper {
                    flex-direction: row;
                    justify-content: flex-start;

                    .radio.radio-option {
                        margin-right: 1rem;
                    }
                }
            }

            @include desktop {
                flex-direction: row;
                justify-content: space-between;
            }
        }

        .selectors {
            margin-top: 1em;
        }

        @include tablet {
            .selectors {
                display: flex;
                justify-content: space-between;

            }
        }
    }

    .section-divider {
        background-color: $colorSectionDivider;
    }

    .map-wrap {
        .instructions-overlay {
            z-index: $z-index-above-map-legend;
            padding: 10vw;
            display: grid;
            place-items: center;
            background: rgba($grey, 0.25);
        }
    }
}

#map {
    height: 75vh;
    margin: 0 0 1em;

    @include desktop {
        height: 40rem;
    }
}
</style>
