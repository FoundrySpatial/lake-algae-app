<template>
    <div
        class="map-filters outline"
    >
        <h1 class="subtitle is-6">
            {{ $t('map-filters.title') }}
        </h1>
        <b-radio
            native-value="14d"
            :value="value"
            @input="radio"
        >
            {{ $t('chl-value.14d') }}
        </b-radio>

        <b-radio
            native-value="daily"
            :value="value"
            @input="radio"
        >
            {{ $t('chl-value.daily') }}
        </b-radio>
        <hr class="divider">

        <b-checkbox
            v-model="boundaryMaskCheckbox"
            @input="checkbox"
        >
            {{ $t('map-filters.boundary-mask') }}
        </b-checkbox>
        <hr class="divider">

        <b-collapse
            class="lake-info"
            animation="slide"
            aria-id="contentIdForA11y3"
        >
            <div
                slot="trigger"
                slot-scope="props"
                role="button"
                aria-controls="contentIdForA11y3"
            >
                <h1 class="subtitle is-6">
                    {{ `${$t('map-filters.date')} ${date}` }}
                </h1>
                <a
                    v-if="!isPointSelection"
                    class="header-icon"
                >
                    <b-icon
                        :icon="props.open ? 'chevron-up' : 'chevron-down'"
                    />
                </a>
                <h1>
                    {{ $t(`lakes.${lake}`) }}
                </h1>
            </div>
            <ul
                v-if="!isPointSelection"
                class="list"
            >
                <li>
                    {{ $t('map-filters.bloom-extent') }}
                    <span v-if="extentKm2">
                        {{ extentKm2 | numFormat('0,0') }}
                    </span>
                    <span v-else>
                        {{ $t('shared.not-available') }}
                    </span>
                </li>
                <li>
                    {{ $t('map-filters.bloom-percentage') }}
                    <span v-if="extentPercent">
                        {{ extentPercent | numFormat('0,0.00') }}
                    </span>
                    <span v-else>
                        {{ $t('shared.not-available') }}
                    </span>
                </li>
                <li>
                    {{ $t('map-filters.bloom-intensity') }}
                    <span v-if="intensity">
                        {{ intensity | numFormat('0,0.00') }}
                    </span>
                    <span v-else>
                        {{ $t('shared.not-available') }}
                    </span>
                </li>
                <li>
                    {{ $t('map-filters.bloom-severity') }}
                    <span v-if="severityKm2">
                        {{ severityKm2 | numFormat('0,0') }}
                    </span>
                    <span v-else>
                        {{ $t('shared.not-available') }}
                    </span>
                </li>
            </ul>
        </b-collapse>
    </div>
</template>

<script>
export default {
    name: 'MapFilters',

    props: {
        value: {
            type: String,
            required: true,
        },

        lake: {
            type: String,
            required: true,
        },

        lakeData: {
            type: Object,
            required: true,
        },

        isPointSelection: {
            type: Boolean,
            required: true,
        },
    },

    data: () => ({
        boundaryMaskCheckbox: false,
    }),

    computed: {
        extentKm2() {
            return this.lakeData[`extent_${this.value}_km2`];
        },

        extentPercent() {
            return this.lakeData[`extent_${this.value}_pct`];
        },

        intensity() {
            return this.lakeData[`intensity_${this.value}`];
        },

        severityKm2() {
            return this.lakeData[`severity_${this.value}_km2`];
        },

        // combines the translated month with the day and year
        date() {
            if (this.lakeData.date) {
                const translatedMonth = this.$t(`date-select.month-${this.lakeData.date.month}`);
                return `${translatedMonth} ${this.lakeData.date.day}, ${this.lakeData.date.year}`;
            }
            return '';
        },
    },

    methods: {
        // update cholorphyll value selector radio input
        radio(option) {
            this.$emit('input', option);
        },

        // emit event on checkbox update
        checkbox(option) {
            this.$emit('boundary-mask', option);
        },
    },
};
</script>

<style lang="scss">
.map-filters {
    border-radius: 8px;
    padding: 1.25rem 2rem;

    .divider {
        margin: 1.25rem 0;
    }

    .lake-info {
        .subtitle {
            display: inline-block;
            margin: 0;
        }

        .header-icon {
            float: right;
        }

        .list {
            li {
                margin: 0.5rem 0
            }
        }
    }

    @include desktop{
        z-index: 701;
        position: absolute;
        background-color: $white;
        max-width: 35%;
        top: 10px;
        left: 10px;
    }

    @include widescreen {
        max-width: 30%;
    }
}
</style>
