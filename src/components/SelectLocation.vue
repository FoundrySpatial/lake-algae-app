<template>
    <div class="select-location columns is-variable is-1-mobile is-2-tablet is-2-desktop">
        <div class="column">
            <b-button
                class="location-button"
                :class="{ outline: !isPointSelection }"
                type="is-secondary has-text-weight-medium"
                expanded
                @click="selectLake"
            >
                <span>
                    {{ $t('select-location.whole-lake') }}
                </span>
            </b-button>
        </div>
        <div class="column">
            <b-button
                class="location-button"
                :class="{ outline: isPointSelection }"
                type="is-secondary has-text-weight-medium"
                expanded
                @click="selectPointMode"
            >
                <span>
                    {{ $t('select-location.specific-point') }}
                </span>
            </b-button>

            <transition name="slide">
                <div
                    v-if="isPointSelection"
                    class="select-point-wrapper"
                >
                    <p>
                        {{ $t('select-location.specific-point-paragraph') }}
                    </p>
                    <div class="select-point">
                        <div class="coordinate-input-wrapper">
                            <div class="coordinate-label long right-align-override">
                                {{ $t('select-location.longitude') }}
                            </div>
                            <b-input
                                v-model="longitude"
                                size="is-medium"
                                class="coordinate-input"
                                placeholder="-123.45"
                                @input="selectPointDebounced"
                            />
                        </div>
                        <div class="coordinate-input-wrapper">
                            <div class="coordinate-label lat">
                                {{ $t('select-location.latitude') }}
                            </div>
                            <b-input
                                v-model="latitude"
                                size="is-medium"
                                class="coordinate-input"
                                placeholder="12.345"
                                @input="selectPointDebounced"
                            />
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>

<script>
import debounce from 'lodash.debounce';

export default {
    name: 'SelectLocation',

    props: {
        isPointSelection: {
            type: Boolean,
            required: true,
        },

        mapClickCoords: {
            type: Object,
            required: true,
        },
    },

    data: () => ({
        longitude: null,
        latitude: null,
        outlineButton: false,
    }),

    watch: {
        mapClickCoords() {
            const { lng, lat } = this.mapClickCoords;
            this.longitude = lng;
            this.latitude = lat;
        },
    },

    methods: {
        selectLake(val) {
            this.$emit('select-lake', val);
            this.longitude = null;
            this.latitude = null;
        },

        selectPointMode() {
            if (!this.isPointSelection) {
                this.$emit('select-point-mode');
            }
        },

        /**
         * emit event when both longitude and latitude have values
         * method is debounced to limit how often it gets called if
         * the user is manually entering coordinates
         */
        selectPointDebounced: debounce(function selectPoint() {
            // lat should be between -90 and 90
            const isLatitude = (num) => Number.isFinite(num) && Math.abs(num) <= 90;
            // lng should be between -180 and 180
            const isLongitude = (num) => Number.isFinite(num) && Math.abs(num) <= 180;

            // check that lng and lat are valid
            if (isLongitude(Number(this.longitude)) && isLatitude(Number(this.latitude))) {
                this.$displayMessage({}, this.$t('select-location.select-point-success'), false, {
                    type: 'is-success',
                });

                this.$emit('select-point', {
                    lng: Number(this.longitude),
                    lat: Number(this.latitude),
                });
            } else {
                this.$displayMessage({}, this.$t('select-location.select-point-error'));
            }
        }, 1000),
    },
};
</script>

<style lang="scss">
.select-location {
    .location-button {
        width: 20%;
        border-radius: 8px;
    }

    .select-point-wrapper {
        margin: 1rem 0 0;

        .select-point {
            display: flex;
            flex-direction: column;

            @media screen and (min-width: 900px) {
                flex-direction: row;
            }

            .coordinate-label {
                margin: 0 1rem 0 3.8rem;
                display: inline-block;
                text-align: right;

                // align coordinate boxes on mobile devices
                &.right-align-override {
                    margin-left: 3rem;
                }

                @media screen and (min-width: 900px) {
                    margin-left: 3rem;
                }
            }

            .coordinate-input {
                margin-top: 2rem;
                display: inline-block;
                max-width: 40%;
                justify-content: center;

                input {
                    margin-top: -0.8rem;
                    border-radius: 8px;
                }

                // hide up and down arrows in number input
                /* Chrome, Safari, Edge, Opera */
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }

                /* Firefox */
                input[type=number] {
                    -moz-appearance: textfield;
                }
            }
        }
    }
}
</style>
