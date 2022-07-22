<template>
    <div class="algal-bloom-chart">
        <div class="chart-display-wrapper">
            <div
                id="chart-view"
                class="chart-display"
            />
        </div>
    </div>
</template>

<script>
import Highcharts from 'highcharts/highstock';
import HighchartsMore from 'highcharts/highcharts-more';
import scssVars from '@/assets/scss/_variables.scss';

HighchartsMore(Highcharts);

export default {
    props: {
        /**
         * the data will be an object with the following format
         *  [
         *      {
         *          data: [
         *              {
         *                  x: 2002,
         *                  y: 54450000/1000000, // m2 to km2
         *               OR
         *                  x: 2002,
         *                  y2: 54450000/<lakearea>, // %
         *              }
         *          ],
         *      },
         *      [...]
         *  ]
         *
         * Possible input options:
         *
         * -> id            (string)    - the identifier for the data series
         * -> name          (string)    - the label for the data series
         * -> color         (hex color) - the color to use for this input
         * -> visible       (boolean)   - the visilibity setting for the data series
         *
         */
        graphData: {
            type: Array,
            required: true,
        },

        /**
         * The following options can be provided:
         *
         * -> bloomIndex            (string)    - the bloom indices option: extent, intensity, severity
         * -> chlValue              (array)     - the selected cholorphyll value options: daily, 14d, or none
         * -> chartElements         (array)     - the selected chart element options: median, quartiles, or none
         * -> yAxisLabel            (string)    - the label for the y axis
         * -> y2AxisLabel           (string)    - the label for the secondary right y axis
         * -> y1UnitOfMeasurement   (string)    - the unit of measurement for the primary left y axis
         *
         */
        providedOptions: {
            type: Object,
            required: false,
            default: () => ({}),
        },

        yearRange: {
            type: Object,
            required: true,
        },
    },

    data: () => ({
        // *************************************************
        // Chart object for chart api update without redraw
        // *************************************************
        chartObj: {},
        firstDataLoad: true,

        // *******************************************************
        // Chart options for chart initialization & export update
        // *******************************************************
        highchartsSpec: {
            chart: {
                // top spacing to accommodate range selector + navigator
                spacingTop: 110,
                // no bottom margin because the navigator is moved up
                marginBottom: 0,
            },

            credits: {
                enabled: false,
            },

            responsive: {
                rules: [
                    {
                        // responsive rule applies if chart width is less than maxWidth
                        condition: {
                            maxWidth: 769,
                        },
                        // set of chart options to apply as responsive rules
                        chartOptions: {
                            rangeSelector: {
                                inputBoxWidth: 100,
                                inputBoxHeight: 15,
                                inputStyle: {
                                    fontSize: scssVars.chartFontSizeMobile,
                                },
                            },
                            navigator: {
                                enabled: true,
                                xAxis: {
                                    labels: {
                                        // turn off the fixed year label on navigator
                                        enabled: false,
                                    },
                                },
                            },
                        },
                    },
                ],
            },

            // ***************
            // Overview chart
            // ***************

            // input range to be shown on the chart
            rangeSelector: {
                buttons: [],
                inputPosition: {
                    align: 'center',
                },
                inputBoxWidth: 120,
                inputBoxHeight: 20,
                // position above the navigator
                floating: true,
                y: -100,
            },

            // select range to be shown on the chart
            navigator: {
                top: 63,
                maskFill: scssVars.colorChartNavigatorMask,
                xAxis: {
                    labels: {
                        align: 'center',
                        y: -45,
                        style: {
                            fontSize: scssVars.bodySize,
                        },
                    },
                    lineWidth: 1,
                },
                series: {
                    data: '',
                    type: 'line',
                    lineColor: scssVars.colorChartAlgal,
                    lineWidth: 2,
                    fillOpacity: 0,
                    // manually override series nonvisibility default setting for navigator
                    visible: true,
                },
            },

            // disable scolling on the chart
            scrollbar: {
                enabled: false,
            },

            // ***************
            // Detailed chart
            // ***************
            xAxis: {
                type: 'datetime',
                // use non-ordinal axis for time series
                ordinal: false,
                plotBands: [],
                labels: {
                    style: {
                        fontSize: scssVars.bodySize,
                    },
                },
            },

            yAxis: [
                { // Primary yAxis
                    lineWidth: 1,
                    opposite: false,
                    labels: {
                        style: {
                            fontSize: scssVars.bodySize,
                        },
                        // divide all units by 1000 to reflect label change of including “x10³“
                        // some what of a hack so the formatter doesn't get run on intensity where the values
                        // should be less than 200
                        formatter() {
                            return (this.value <= 200) ? this.value : this.value / 1000;
                        },
                    },
                },
                { // Secondary yAxis
                    lineWidth: 1,
                    labels: {
                        style: {
                            fontSize: scssVars.bodySize,
                        },
                        formatter() {
                            return this.value;
                        },
                    },
                },
            ],

            // Series data options
            series: [],

            tooltip: {
                split: false,
                shared: true,
                valueDecimals: 2,
                xDateFormat: '%Y-%m-%d',
                style: {
                    fontSize: scssVars.bodySize,
                },
                headerFormat: `<span style="font-size: ${scssVars.bodySize}">{point.key}</span><br>`,
            },

            plotOptions: {
                series: {
                    // disable "turbo" to allow multiple series
                    turboThreshold: 0, // set to 0 to disable

                    // if series has duplicate x-values, 'xy' allow hovering over all points
                    findNearestPointBy: 'xy',

                    // allow gaps for missing data
                    gapUnit: 'value', // measure gap in milliseconds
                    gapSize: 100 * 24 * 60 * 60 * 1000, // minimum gap of 100 days (in milliseconds)

                    // add series point markers
                    marker: {
                        enabled: false,
                        radius: 1,
                        symbol: 'circle',
                    },

                    cursor: 'pointer',
                    point: {
                        events: {
                            click: () => {},
                        },
                    },

                    dataGrouping: {
                        enabled: false,
                        // show "YYYY-MM-DD" date format as the tooltip header
                        // @SEE: https://api.highcharts.com/highstock/plotOptions.series.dataGrouping.dateTimeLabelFormats
                        dateTimeLabelFormats: {
                            millisecond: ['%Y-%m-%d', '%Y-%m-%d', '-%Y-%m-%d'],
                            second: ['%Y-%m-%d', '%Y-%m-%d', '-%Y-%m-%d'],
                            minute: ['%Y-%m-%d', '%Y-%m-%d', '-%Y-%m-%d'],
                            hour: ['%Y-%m-%d', '%Y-%m-%d', '-%Y-%m-%d'],
                            day: ['%Y-%m-%d', '%Y-%m-%d', '-%Y-%m-%d'],
                            week: ['%Y-%m-%d', '%Y-%m-%d', '-%Y-%m-%d'],
                            month: ['%Y-%m', '%Y-%m', '-%Y-%m'],
                            year: ['%Y', '%Y', '-%Y'],
                        },
                    },
                },
            },
        },
    }),

    computed: {
        /**
         * return provided options for y Axis labels
         */
        options() {
            return {
                bloomIndex: '',
                chlValue: [],
                chartElements: [],
                yAxisLabel: '',
                y2AxisLabel: '',
                y1UnitOfMeasurement: '',
                ...this.providedOptions,
            };
        },
    },

    watch: {
        graphData() {
            this.handleChange();
        },

        providedOptions() {
            this.handleChange();
        },
    },

    mounted() {
        this.buildChart();
        this.prepareDataForChart();
        this.init();
        this.handleChange();
    },

    methods: {
        // **************************************
        // Methods for adding marks to the chart
        // **************************************

        /**
         * Specify appropriate series options for the inputs in graphData
         */
        buildChart() {
            // clear any existing chart series upon mode change between whole lake and specific point
            this.highchartsSpec.series = [];

            this.graphData.forEach((input) => {
                if (input.id.endsWith('_percent')) {
                    this.highchartsSpec.series.push({
                        id: input.id,
                        name: input.name,
                        data: [],
                        color: input.color,
                        yAxis: 1,
                        zIndex: 10,
                        enableMouseTracking: false,
                        visible: input.visible,
                    });
                } else if (input.id.startsWith('quartiles_')) {
                    this.highchartsSpec.series.push({
                        id: input.id,
                        name: input.name,
                        type: 'arearange',
                        data: [],
                        color: input.color,
                        yAxis: 0,
                        zIndex: 1,
                        enableMouseTracking: false,
                        visible: input.visible,
                    });
                } else if (input.id.startsWith('median')) {
                    this.highchartsSpec.series.push({
                        id: input.id,
                        name: input.name,
                        data: [],
                        color: input.color,
                        yAxis: 0,
                        zIndex: 15, // highest z index is on top
                        enableMouseTracking: false,
                        visible: input.visible,
                        // add series point markers
                        marker: {
                            enabled: true,
                            radius: 2.5,
                            symbol: 'circle',
                        },
                    });
                } else if (input.id.endsWith('_daily')) {
                    this.highchartsSpec.series.push({
                        id: input.id,
                        name: input.name,
                        type: 'column',
                        data: [],
                        color: input.color,
                        yAxis: 0,
                        zIndex: 5, // highest z index is on top
                        enableMouseTracking: false,
                        visible: input.visible,
                        // add series point markers
                        marker: {
                            enabled: true,
                            radius: 2.5,
                            symbol: 'circle',
                        },
                    });
                } else {
                    this.highchartsSpec.series.push({
                        id: input.id,
                        name: input.name,
                        data: [],
                        color: input.color,
                        yAxis: 0,
                        zIndex: 20, // highest z index is on top
                        enableMouseTracking: false,
                        visible: input.visible,
                        // add series point markers
                        marker: {
                            enabled: true,
                            radius: 2.5,
                            symbol: 'circle',
                        },
                    });
                }
            });
        },

        // ************************************************************
        // Methods for preparing the data to be displayed on the chart
        // ************************************************************

        /**
         * Add time series data to highchartsSpec
         */
        prepareDataForChart() {
            // update each series dataset with new data, maintaining other config options
            this.graphData.forEach((input, index) => {
                this.highchartsSpec.series[index].data = this.graphData[index].data;
                this.highchartsSpec.series[index].name = this.graphData[index].name;
            });

            // regenerate plotBands: shaded areas for no-data seasons
            this.highchartsSpec.xAxis.plotBands = this.getNoDataPeriods();

            const endDate = Date.now();
            const startDate = endDate - 157784630000; // minus 5 years unix time

            // force chart to only show custom years range in navigator
            // only apply this year range on first load of the chart
            if (this.firstDataLoad && this.highchartsSpec.xAxis.length) {
                this.firstDataLoad = false;
                this.chartObj.xAxis[0].setExtremes(
                    startDate, endDate,
                );
            }

            this.highchartsSpec.plotOptions.series.point.events.click = (e) => {
                this.$emit('click', e.point.x);
            };
        },

        // ****************************************************************
        // Methods for handling data change & displaying data on the chart
        // ****************************************************************

        /**
         * Create and run this component's highcharts view
         * init() will not be re-rendered when chart data or options update
         */
        init() {
            Highcharts.setOptions({
                lang: {
                    months: this.$t('chart.months'),
                    shortMonths: this.$t('chart.short-months'),
                    weekdays: this.$t('chart.weekdays'),
                    rangeSelectorFrom: this.$t('chart.range-selector.from'),
                    rangeSelectorTo: this.$t('chart.range-selector.to'),
                    rangeSelectorZoom: '',
                },
                chart: {
                    animation: false,
                    style: {
                        fontFamily: scssVars.familyPrimary,
                        fontSize: scssVars.bodySize,
                    },
                },
            });
            // eslint-disable-next-line new-cap
            this.chartObj = Highcharts.stockChart('chart-view', this.highchartsSpec);
        },

        /**
         * Handle the data or options change by updating series data or yAxis and then re-render the chart
         */
        handleChange() {
            // require to rebuild the chart when toggle between whole lake and specific point modes
            this.buildChart();
            this.prepareDataForChart();

            this.highchartsSpec.yAxis[0].title.text = `${this.options.yAxisLabel} (${this.options.y1UnitOfMeasurement})`;
            if (this.options.bloomIndex === 'intensity' || this.options.bloomIndex === 'severity' || this.options.bloomIndex === 'specific-point') {
                this.highchartsSpec.yAxis[1].title.text = '';
            } else {
                this.highchartsSpec.yAxis[1].title.text = this.options.y2AxisLabel;
            }

            this.render();
        },

        /**
         * Create and run this component's highcharts view
         * render() will be re-rendered upon data change and perform logic to set
         * series visibility and tooltip display upon user selections
         */
        render() {
            // update chart object series data without redrawing the chart
            this.highchartsSpec.series.forEach((input, index) => {
                this.options.chlValue.forEach((frequency) => {
                    // check for specific point series
                    if (input.id.includes(`value_${frequency}`)) {
                        // check for bloom values series
                        if (input.id === `value_${frequency}`) {
                            // update navigator series display
                            this.highchartsSpec.navigator.series.data = input.data;
                            this.highchartsSpec.series[index].visible = true;
                            this.highchartsSpec.series[index].enableMouseTracking = true;
                        }
                    }

                    // check for whole lake series
                    if (input.id.includes(`${this.options.bloomIndex}_${frequency}`)) {
                        // check for bloom indices series
                        if (input.id === `${this.options.bloomIndex}_${frequency}`) {
                            // update navigator series display
                            this.highchartsSpec.navigator.series.data = input.data;
                            this.highchartsSpec.series[index].visible = true;
                            this.highchartsSpec.series[index].enableMouseTracking = true;
                        }
                        if (input.id === `${this.options.bloomIndex}_${frequency}_percent`) {
                            this.highchartsSpec.series[index].visible = true;
                            this.highchartsSpec.series[index].enableMouseTracking = true;
                        }

                        this.options.chartElements.forEach((dataRef) => {
                            // check for bloom indices metadata series
                            if (input.id === `${dataRef}_${this.options.bloomIndex}_${frequency}`) {
                                this.highchartsSpec.series[index].visible = true;
                                this.highchartsSpec.series[index].enableMouseTracking = true;
                            }
                        });
                    }
                });
            });

            // sync chart object with updated chart options for chart export
            // redraw only first time updating empty specific point chart options
            // require [oneToOne] parameter to be true to match toggle update between whole lake and specific point
            this.chartObj.update(this.highchartsSpec, true, true);

            // emit chart object when the spec is updated
            this.$emit('chart', this.chartObj);
        },

        /**
         * Returns an array of Highcharts plotBands
         * to shade the colder months with no algae / data (nov 1st - may31st)
         *
         * @returns {Array} - Highcharts plotBands configuration
         */
        getNoDataPeriods() {
            const minYear = Number(this.yearRange.first);
            const maxYear = Number(this.yearRange.last);

            // loop between the min and max years, and add plotBands to an array
            const plotBands = [];
            for (let year = minYear - 1; year <= maxYear; year += 1) {
                plotBands.push({
                    from: new Date(Date.UTC(year, 10, 1)).getTime(), // nov 1st of the given year
                    to: new Date(Date.UTC(year + 1, 4, 31)).getTime(), // may 31st of the next year
                    color: scssVars.colorChartNoData,
                });
            }
            return plotBands;
        },
    },
};
</script>

<style lang="scss">
.chart-display-wrapper {
    > * {
       min-width: $tablet;
    }
    overflow-x: scroll;
    border: 2px solid $primary;

    @include tablet {
        overflow-x: hidden;
        border: none;
    }
}

#chart-view {
    height:500px;
    width:100%;
}
</style>
