import dayjs from 'dayjs';
import numeral from 'numeral';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export default {
    computed: {
        // returns formatted filename for CSV downloads
        csvFilename() {
            const shortLakeName = this.$t(`lakes-short.${this.selectedLakeId}`);
            const selectionType = this.isPointSelection ? this.$t('export.csv.pixel') : this.$t('export.csv.lake');
            const date = this.now().format('YYYY-MM-DD');
            const filename = `${this.$t('export.csv.filename')}_${shortLakeName}_${selectionType}_${date}.csv`;
            return filename;
        },
    },

    methods: {
        /**
         * returns CSV header content as a string
         */
        csvHeader() {
            const header = [];
            const dateAccessed = this.now();
            const lakeId = this.selectedLakeId;

            header.push([this.$t('export.csv.header.title')]);

            header.push([
                this.$t('export.csv.header.data-version'),
                this.$t('export.csv.header.data-version-text'),
            ]);

            header.push([
                this.$t('export.csv.header.data-doi'),
                this.$t(`export.csv.header.data-doi-text.${lakeId}`),
            ]);

            header.push([
                this.$t('export.csv.header.date-file-generated'),
                dateAccessed.format('YYYY-MM-DD'),
            ]);

            header.push([
                this.$t('export.csv.header.org-name'),
                this.$t('export.csv.header.org-name-text'),
            ]);

            header.push([
                this.$t('export.csv.header.org-contact'),
                this.$t('export.csv.header.org-contact-text'),
            ]);

            header.push([
                this.$t('export.csv.header.context-note'),
                this.$t('export.csv.header.context-note-text'),
            ]);

            header.push([
                this.$t('export.csv.header.email'),
                this.$t('export.csv.header.email-text'),
            ]);

            header.push([
                this.$t('export.csv.header.principal-investigator'),
                this.$t('export.csv.header.principal-investigator-text'),
            ]);

            header.push([
                this.$t('export.csv.header.principal-investigator-affiliation'),
                this.$t('export.csv.header.principal-investigator-affiliation-text'),
            ]);

            header.push([
                this.$t('export.csv.header.principal-investigator-contact'),
                this.$t('export.csv.header.principal-investigator-contact-text'),
            ]);

            header.push([
                this.$t('export.csv.header.data-stewards'),
                this.$t('export.csv.header.data-stewards-text'),
            ]);

            header.push([
                this.$t('export.csv.header.open-gov-licence'),
                this.$t('export.csv.header.open-gov-licence-text'),
            ]);

            header.push([
                this.$t('export.csv.header.attribution'),
                this.$t('export.csv.header.attribution-text'),
            ]);

            header.push([
                this.$t('export.csv.header.acknowledgement-statement'),
                this.$t('export.csv.header.acknowledgement-statement-text'),
            ]);

            header.push([
                this.$t('export.csv.header.qa-disclaimer'),
                this.$t('export.csv.header.qa-disclaimer-text'),
            ]);

            header.push([
                this.$t('export.csv.header.data-url'),
                this.$t(`export.csv.header.data-url-text.${lakeId}`),
            ]);

            // add selection coordinates, if applicable
            if (this.isPointSelection) {
                let { lng, lat } = this.pointSelection;
                lng = numeral(lng).format('0[.][0000]');
                lat = numeral(lat).format('0[.][0000]');
                const longLatText = `${this.$t('export.csv.header.longitude')} ${lng}, ${this.$t('export.csv.header.latitude')} ${lat}`;
                header.push([
                    this.$t('export.csv.header.location'),
                    longLatText,
                ]);
            }

            // "unparse" JSON to CSV string
            let headerString = Papa.unparse(header);

            // replace placeholder tokens
            const replacements = {
                LongLakeName: this.selectedLakeName,
                YearAccessed: dateAccessed.format('YYYY'),
                DataFileName: this.csvFilename,
                // data is currently accessed and generated at the same time
                GeneratedDate: dateAccessed.format('YYYY-MM-DD'),
                AccessedDate: dateAccessed.format('YYYY-MM-DD'),
                AppUrl: this.$t('export.csv.header.app-url'),
            };
            headerString = headerString.replaceAll(/\$<([A-Z]+)>/gi, (match, token) => replacements[token] || match);

            return headerString;
        },

        /**
         * Download the chart data as a CSV file
         */
        exportCsv() {
            try {
                this.loadingCsvExport = true;

                // build CSV header section string
                const headerString = this.csvHeader();

                // use different data structures for "whole lake" and "point" selections
                let csvRows = [];
                if (this.isPointSelection) {
                    // for "point selection" data, use a different data format
                    csvRows = this.chartSpecificPointData.map((row) => {
                        const formatted = {};
                        // add applicable columns with translated headers
                        const rowDate = dayjs(row.date).utc();
                        formatted[this.$t('export.csv.columns.date')] = rowDate.format('YYYY-MM-DD');
                        formatted[this.$t('export.csv.columns.lake')] = this.selectedLakeName;
                        formatted[this.$t('export.csv.columns.satellite')] = this.getSatellite(rowDate.year());
                        formatted[this.$t('export.csv.columns.14d-chlorophyll-a')] = numeral(row.value_14d).format('0.[00]');
                        formatted[this.$t('export.csv.columns.daily-chlorophyll-a')] = numeral(row.value_daily).format('0.[00]');
                        return formatted;
                    });
                } else {
                    // "whole lake" selection
                    csvRows = this.chartData.map((row) => {
                        const formatted = {};
                        // add applicable columns with translated headers
                        const rowDate = dayjs(row.date).utc();
                        formatted[this.$t('export.csv.columns.date')] = rowDate.format('YYYY-MM-DD');
                        formatted[this.$t('export.csv.columns.lake')] = this.selectedLakeName;
                        formatted[this.$t('export.csv.columns.satellite')] = this.getSatellite(rowDate.year());
                        formatted[this.$t('export.csv.columns.14d-bloom-extent-km2')] = numeral(row.extent_14d_km2).format('0.[00]');
                        formatted[this.$t('export.csv.columns.14d-bloom-extent-pct')] = numeral(row.extent_14d_pct).format('0.[00]');
                        formatted[this.$t('export.csv.columns.14d-bloom-intensity-ugl')] = numeral(row.intensity_14d).format('0.[00]');
                        formatted[this.$t('export.csv.columns.14d-bloom-severity-ugl-km2')] = numeral(row.severity_14d_km2).format('0.[00]');
                        formatted[this.$t('export.csv.columns.14d-valid-pixels')] = numeral(row.coverage_14d_pct).format('0.[00]');
                        formatted[this.$t('export.csv.columns.daily-bloom-extent-km2')] = numeral(row.extent_daily_km2).format('0.[00]');
                        formatted[this.$t('export.csv.columns.daily-bloom-extent-pct')] = numeral(row.extent_daily_pct).format('0.[00]');
                        formatted[this.$t('export.csv.columns.daily-bloom-intensity-ugl')] = numeral(row.intensity_daily).format('0.[00]');
                        formatted[this.$t('export.csv.columns.daily-bloom-severity-ugl-km2')] = numeral(row.severity_daily_km2).format('0.[00]');
                        formatted[this.$t('export.csv.columns.daily-valid-pixels')] = numeral(row.coverage_daily_pct).format('0.[00]');
                        return formatted;
                    });
                }

                // "unparse" json (array of objects) to CSV string
                const csvString = Papa.unparse(csvRows);

                // combine header and csv body
                const csv = `\ufeff${headerString}\n\n${csvString}`;

                // create CSV data blob
                const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

                // download CSV blob as a file
                saveAs(csvBlob, this.csvFilename);
            } catch (error) {
                this.$displayMessage(error, this.$t('export.csv.error-message'));
            } finally {
                this.loadingCsvExport = false;
            }
        },

        /**
         * returns the name of the satellite that captured the data for a given year
         *
         * @param {number} year - year the data was captured
         * @returns {string} - name of the satellite
         */
        getSatellite(year) {
            if (year <= 2011) {
                return 'MERIS';
            }

            if (year <= 2018) {
                return 'OLCI-S3A';
            }

            return 'OLCI-S3';
        },
    },
};
