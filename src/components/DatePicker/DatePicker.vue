<template>
    <div class="carousel-date-picker">
        <carousel-picker
            class="year"
            :items="availableYears"
            :value="year"
            @change="changeYear"
        />
        <carousel-picker
            class="month"
            :items="availableMonths"
            :value="month"
            @change="changeMonth"
        />
        <carousel-picker
            class="day"
            :items="availableDays"
            :value="day"
            @change="changeDay"
        />
        <p class="has-text-black has-text-centered">
            <i>{{ $t('date-select.disclaimer') }}</i>
        </p>
    </div>
</template>

<script>
import dayjs from 'dayjs';

import CarouselPicker from '@/components/DatePicker/CarouselPicker.vue';

export default {
    name: 'DatePicker',

    components: {
        CarouselPicker,
    },

    props: {
        value: {
            type: Object,
            required: true,
        },

        availableDates: {
            type: Array,
            required: true,
        },
    },

    data: () => ({
        date: null,
    }),

    computed: {
        // "year" portion of the date object (int)
        year() {
            return dayjs(this.date).year();
        },

        // "month" portion of the date object (int 1-12)
        month() {
            return dayjs(this.date).month() + 1;
        },

        // "day" portion of the date object (int 1-31)
        day() {
            return dayjs(this.date).date();
        },

        // array of available months for the selected year
        availableMonths() {
            const months = this.yearDates
                // filter to only one item for each month
                .filter((value, index, self) => {
                    // find the month in the array
                    const month = value.month();
                    const monthIndex = self.findIndex((d) => d.month() === month);
                    return monthIndex === index;
                })
                // format as "slide" objects
                .map((d) => {
                    // translation key for the month
                    const monthKey = d.format('MMM').toLowerCase();
                    const label = this.$t(`date-select.month-${monthKey}`);
                    return {
                        value: d.month() + 1,
                        label,
                    };
                });

            return months;
        },

        // array of available days for the selected year and month combo
        availableDays() {
            const days = this.monthDates
                // format as "slide" objects
                .map((d) => {
                    const day = dayjs(d).date();
                    return {
                        value: day,
                        label: String(day),
                    };
                });

            return days;
        },

        // array of available years for the selected lake
        availableYears() {
            const years = this.availableDates
                // create array of all available years
                .map((d) => dayjs(d).year())
                // remove any duplicates from array
                .filter((value, index, self) => self.indexOf(value) === index)
                // format as "slide" objects
                .map((e) => ({
                    value: Number(e),
                    label: String(e),
                }));

            return years;
        },

        // dates in the selected year
        yearDates() {
            return this.availableDates.filter((d) => d.year() === this.year);
        },

        // dates in the selected month/year
        monthDates() {
            const month = this.month - 1; // 0-indexed months
            return this.yearDates.filter((d) => d.month() === month);
        },
    },

    watch: {
        // emit "input" event when the local date changes
        date(newDate) {
            this.$emit('input', newDate);
        },

        // sync local date when value prop changes
        value(val) {
            this.date = val;
        },
    },

    created() {
        // store state internally and sync with value prop
        this.date = this.value;
    },

    methods: {
        /**
         * respond to changing year values, update local date object
         *
         * @param {Object} slide - year "slide" object
         * @param {Number} slide.value - year value
         */
        changeYear({ value }) {
            this.date = dayjs(this.date).year(value);
        },

        /**
         * respond to changing month values, update local date object
         *
         * @param {Object} slide - month "slide" object
         * @param {Number} slide.value - month value (1-12)
         */
        changeMonth({ value }) {
            const month = value - 1; // 0-indexed months
            this.date = dayjs(this.date).month(month);
        },

        /**
         * respond to changing day values, update local date object
         *
         * @param {Object} slide - day "slide" object
         * @param {Number} slide.value - day value (1-31)
         */
        changeDay({ value }) {
            this.date = dayjs(this.date).date(value);
        },
    },
};
</script>

<style>

</style>
