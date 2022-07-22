<template>
    <swiper
        ref="swiperPicker"
        class="carousel-picker"
        :options="swiperOptions"
        @slideChange="onSlideChange"
    >
        <swiper-slide
            v-for="slide in items"
            :key="slide.label"
        >
            <span v-text="slide.label" />
        </swiper-slide>
        <div
            slot="button-prev"
            class="swiper-button-prev"
        />
        <div
            slot="button-next"
            class="swiper-button-next"
        />
    </swiper>
</template>

<script>
import { Swiper, SwiperSlide } from 'vue-awesome-swiper';
import 'swiper/css/swiper.css';

export default {
    components: {
        Swiper,
        SwiperSlide,
    },

    props: {
        // array of "slide" objects with { value, label }
        items: {
            type: Array,
            required: true,
        },

        // currently-selected slide "value" property
        value: {
            type: Number,
            required: true,
        },
    },

    data() {
        return {
            swiperOptions: {
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                centeredSlides: true,
                grabCursor: true,
                slidesPerView: 5,
                spaceBetween: 15,
                slideToClickedSlide: true,
                breakpoints: {
                    640: {
                        slidesPerView: 8,
                        spaceBetween: 20,
                    },
                    768: {
                        slidesPerView: 10,
                    },
                    1024: {
                        slidesPerView: 12,
                    },
                },
            },
        };
    },

    computed: {
        // reference to the current swiper instance
        swiper() {
            return this.$refs.swiperPicker.$swiper;
        },
    },

    watch: {
        // respond to value prop changes: change selection
        value(val) {
            this.slideToValue(val);
        },

        // attempt to set to the same date when the items list changes
        items() {
            this.slideToValue(this.value);
        },
    },

    mounted() {
        // set initial position to match value prop
        this.slideToValue(this.value);
    },

    methods: {
        /**
         * handle swiper slide changes: emit "change" event
         */
        onSlideChange() {
            const activeItem = this.items[this.swiper.activeIndex];
            this.$emit('change', activeItem);
        },

        /**
         * select slide with the given "value" property
         * selects the first slide if no matching slide is found
         *
         * @param {Number} val - "value" property of the slide to select
         */
        slideToValue(val) {
            // don't try to slide before items array is populated
            if (this.items.length === 0) return;

            // find "slide" matching this value
            const foundIndex = this.items.findIndex((e) => e.value === val);
            // switch to the slide, if found
            if (foundIndex !== -1) {
                // wait until any new slides are injected, then switch
                this.$nextTick(() => {
                    this.swiper.slideTo(foundIndex, 0, false);
                });
            } else {
                // switch to the last slide if the indicated one isn't found
                this.$emit('change', this.items[this.items.length - 1]);
            }
        },
    },
};
</script>

<style lang="scss">
.carousel-picker {
    // disable text selection
    user-select: none;

    // set custom variables
    --swiper-navigation-color: #000;
    --swiper-navigation-size: 15px;

    .swiper-slide {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 4em;
        text-align: center;
        cursor: pointer;
    }

    .swiper-slide-active {
        font-weight: 900;
    }

    // next / previous buttons
    $nav-button-color: #fff;

    .swiper-button-prev,
    .swiper-button-next {
        background: $nav-button-color;
        margin: 0;
        top: 0;
        height: 100%;
        width: 2.5rem;
        font-weight: 700;
    }

    // position buttons and orient background gradients
    .swiper-button-prev {
        left: 0;
        background: linear-gradient(to right, rgba($nav-button-color, 1) 25%, rgba($nav-button-color, 0) 100%);
    }
    .swiper-button-next {
        right: 0;
        background: linear-gradient(to left, rgba($nav-button-color, 1) 25%, rgba($nav-button-color, 0) 100%);
    }
}
</style>
