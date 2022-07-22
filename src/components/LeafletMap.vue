<template>
    <div
        :id="id"
        class="leaflet-map-component"
    />
</template>

<script>
import numeral from 'numeral';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// manually import marker icon and shadow to bypass broken data url
// https://github.com/Leaflet/Leaflet/issues/4968
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png';

import scssVars from '@/assets/scss/_variables.scss';

export default {
    name: 'LeafletMap',

    props: {
        id: {
            type: String,
            default: 'map',
        },

        maxScale: {
            type: Number,
            required: true,
        },

        cogUrl: {
            type: String,
            required: false,
            default: '',
        },

        colorScale: {
            type: String,
            required: true,
        },

        lakeBounds: {
            type: Array,
            required: true,
        },

        pointSelection: {
            type: Object,
            required: true,
        },

        popupContents: {
            type: Object,
            required: true,
        },

        lakeBoundaryGeojson: {
            type: Object,
            required: true,
        },

        showLakeBoundary: {
            type: Boolean,
            required: true,
        },
    },

    data: () => ({
        map: null,
        cogLayer: null,
        mapMarker: null,
        boundaryGeoJson: null,
        popup: null,
    }),

    computed: {
        // dynamically set tile url for french or english i18n locale
        tileData() {
            let streetsUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            const satelliteUrl = 'https://wxs.ign.fr/choisirgeoportail/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

            if (this.$i18n.locale === 'fr') {
                streetsUrl = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';
            }

            return {
                streetsUrl,
                streetsOptions: {
                    attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ${this.$t('map-options.attribution')}`,
                },
                satelliteUrl,
                satelliteOptions: {
                    attribution: '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
                },
            };
        },

        // return overlay tile url based on the input cog, scale, & colormap
        overlayTileUrl() {
            // return null if no COG is supplied
            if (!this.cogUrl) {
                return null;
            }

            const titilerHost = process.env.VUE_APP_TITILER_URL;
            const rescale = `5,${this.maxScale}`; // all 0-10 data is clamped as 5 for color consistency
            const colorMap = `colormap_name=${(this.colorScale === 'standardScale') ? 'lakewatch' : 'cividis'}`; // "lakewatch" is a custom created color scale

            const tileUrl = `${titilerHost}/cog/tiles/{z}/{x}/{y}?url=${this.cogUrl}&rescale=${rescale}&${colorMap}`;
            return tileUrl;
        },

        // returns opacity value for lake boundary outline
        lakeBoundaryOpacity() {
            return this.showLakeBoundary ? 1 : 0;
        },
    },

    watch: {
        // update COG overlay tile layer URL when COG url changes
        overlayTileUrl(val) {
            if (val === null) return;

            this.updateCogLayer();
        },

        lakeBounds() {
            this.setBounds(this.map);
        },

        pointSelection(newValue) {
            this.removeMarker();

            // when lat and lng exist display point and marker
            // otherwise remove marker and move map back to selected lake
            if (newValue.lat && newValue.lng) {
                this.setPoint(this.map);
            }
        },

        lakeBoundaryGeojson() {
            this.addLakeBoundary();
        },

        showLakeBoundary() {
            this.toggleLakeBoundaryVisibility();
        },

        // update popup when chlorophyll-a values change
        popupContents() {
            this.showPopup();
        },
    },

    mounted() {
        // initialize map with default options
        const map = L.map(this.id, {
            zoomControl: false,
        });

        // add zoom control to map
        L.control.zoom({ position: 'topright' }).addTo(map);

        // emit an event when the map object is loaded
        map.on('load', (ev) => {
            this.map = map;

            this.$emit('load', ev, map);
        });

        // emit an event when the map is clicked
        map.on('click', (ev) => {
            // project latlng to 3857
            const point = L.CRS.EPSG3857.project(ev.latlng);
            this.$emit('click', ev, point);
        });

        // create tile layers
        // set satellite layer as default
        const satellite = L.tileLayer(this.tileData.satelliteUrl, this.tileData.satelliteOptions).addTo(map);
        const streets = L.tileLayer(this.tileData.streetsUrl, this.tileData.streetsOptions);
        // create COG overlay layer
        map.createPane('cog-overlay');
        map.getPane('cog-overlay').style.zIndex = 400;
        this.cogLayer = L.tileLayer(this.overlayTileUrl, { pane: 'cog-overlay' }).addTo(map);

        streets.on('load', (ev) => {
            // emit an event when all visible tiles have loaded
            this.$emit('tiles:load', ev, map);
        });
        satellite.on('load', (ev) => {
            // emit an event when all visible tiles have loaded
            this.$emit('tiles:load', ev, map);
        });
        this.cogLayer.on('load', (ev) => {
            // emit an event when all visible tiles have loaded
            this.$emit('overlay:load', ev, map);
        });

        // set initial view
        this.setBounds(map);

        // add "reset view" button control
        this.addResetButton(map);

        // add tile layers control to the map
        const baseMaps = {
            [this.$t('map-options.satellite-layer')]: satellite,
            [this.$t('map-options.streets-layer')]: streets,
        };
        const overlays = {
            [this.$t('map-options.chlorophyll-a-layer')]: this.cogLayer,
        };
        L.control.layers(baseMaps, overlays).addTo(map);

        // set default marker icon and shadow to bypass broken data url
        const DefaultIcon = L.icon({
            iconUrl: markerIcon,
            iconAnchor: [13, 41],
            shadowUrl: markerIconShadow,
            popupAnchor: [0, -30],
        });

        L.Marker.prototype.options.icon = DefaultIcon;

        // define map popup
        this.popup = L.popup({
            closeButton: false,
            className: 'point-popup',
        });
    },

    methods: {
        /**
         * set the map bounds
         * @param {L.map} map Leaflet map object
         */
        setBounds(map) {
            // transform array coordinates into lat lng bounds
            const bounds = L.latLngBounds(L.latLng(this.lakeBounds[0]),
                L.latLng(this.lakeBounds[1]));
            map.fitBounds(bounds);
        },

        /**
         * move map to specified location and add map marker
         * @param {L.map} map Leaflet map object
         */
        setPoint(map) {
            const { lat, lng } = this.pointSelection;

            this.mapMarker = L.marker({ lat, lng });
            this.mapMarker.addTo(map);
            this.mapMarker.bindPopup(this.popup);
            this.showPopup();
        },

        /**
         * remove map marker from map and set map location to selected lake
         * @param {L.map} map Leaflet map object
         */
        removeMarker() {
            if (this.mapMarker) {
                this.mapMarker.remove();
            }
        },

        /**
         * handle COG loading errors:
         * display a snackbar message and remove the COG map layer
         *
         * @param {Error} error - application error
         */
        displayCogError(error) {
            this.$displayMessage(error, this.$t('shared.error-data'));
        },

        /**
         * update COG overlay layer URL to use the current props as parameters
         */
        updateCogLayer() {
            if (!this.map.hasLayer(this.cogLayer)) return;

            this.cogLayer.setUrl(this.overlayTileUrl);
        },

        /**
         * add a custom "reset view" control button to the map
         * when clicked, fit the map to the selected lake's bounding box
         * @see this.setBounds
         *
         * @param {L.map} map Leaflet map object
         */
        addResetButton(map) {
            const thisVm = this;
            // define "ResetButton control"
            L.Control.ResetView = L.Control.extend({
                onAdd() {
                    const el = L.DomUtil.create('div', 'leaflet-bar reset-view');

                    // MDI house icon
                    el.innerHTML = '<a href="#"><span class="mdi mdi-home"></span></a>';
                    el.title = thisVm.$t('select-location.reset-map');

                    // prevent clicking through to the map
                    L.DomEvent.disableClickPropagation(el);
                    // add click handler
                    L.DomEvent.on(el, 'click', this._click, this);

                    return el;
                },

                // button click event handler
                _click(e) {
                    // prevent default handler for link tag
                    L.DomEvent.preventDefault(e);

                    // call setBounds to reset fit to the latest lake bounds
                    thisVm.setBounds(map);
                    thisVm.$emit('reset-view', map);
                },

                onRemove() {
                    // nothing to unbind
                },
            });
            // factory method for creating ResetView control instance
            L.control.resetView = (opts) => new L.Control.ResetView(opts);

            // add control button to map
            L.control.resetView({
                position: 'topright',
            }).addTo(map);
        },

        /**
         * add selected lake boundary mask
         */
        addLakeBoundary() {
            // remove old boundary geojson if it exists
            if (this.boundaryGeoJson) {
                this.boundaryGeoJson.remove();
            }

            // add boundary geojson fill for the selected lake
            L.geoJSON(this.lakeBoundaryGeojson, {
                color: '#fff',
                fillColor: scssVars.colorLakeNoData,
                weight: 0,
                fillOpacity: 1,
            }).addTo(this.map);

            // add boundary geojson outline for the selected lake with hidden opacity
            this.map.createPane('lake-boundary-outline');
            this.map.getPane('lake-boundary-outline').style.zIndex = 401; // display above COG
            this.boundaryGeoJson = L.geoJSON(this.lakeBoundaryGeojson, {
                color: scssVars.colorLakeBoundaryOutline,
                weight: 2,
                opacity: this.lakeBoundaryOpacity,
                pane: 'lake-boundary-outline',
            });

            this.boundaryGeoJson.addTo(this.map);
        },

        /**
         * change the opacity of the lake boundary geojson layer to hide/show the lake outline
         */
        toggleLakeBoundaryVisibility() {
            if (this.boundaryGeoJson) {
                this.boundaryGeoJson.setStyle({ opacity: this.lakeBoundaryOpacity });
            }
        },

        /**
         * build popup contents and open the popup
         */
        showPopup() {
            const { chlorophyllA } = this.popupContents;
            const { lng, lat } = this.pointSelection;

            // if there's no chlorophyll-a value at this point, show "N/A"
            let chlDisplay = this.$t('shared.not-available');

            // if a value is available, use it instead
            if (chlorophyllA) {
                if (chlorophyllA >= 10) {
                    chlDisplay = `${numeral(chlorophyllA).format('0,0[.][00]')} µg/L`;
                } else {
                    chlDisplay = '< 10 µg/L';
                }
            }

            this.popup.setContent(`
                <p>
                    <span class="label-text">${this.$t('map-filters.location')}</span>
                    <span class="value-text">${numeral(lng).format('0[.][0000]')}, ${numeral(lat).format('0[.][0000]')}</span>
                </p>
                <p>
                    <span class="label-text">${this.$t('map-filters.chlorophyll-a')}</span>
                    <span class="value-text">${chlDisplay}</span>
                </p>
            `);

            this.mapMarker.openPopup();
        },
    },
};
</script>

<style lang="scss">
.leaflet-map-component {
    // map controls
    .leaflet-control {
        // "reset view" button
        &.reset-view {
            font-size: 1.3rem;
        }

        // map layers (satellite, streets, chl-a) selection
        .leaflet-control-layers-list {
            font-size: $body-size;
        }
    }

    // map popup for "specific point" queries
    .point-popup {
        .leaflet-popup-content-wrapper {
            border: $map-popup-border;
            font-family: $family-primary;
            font-size: 1rem;
            color: $text;

            .leaflet-popup-content {
                white-space: nowrap;
            }
        }

        // hide popup "tip" element
        .leaflet-popup-tip-container {
            display: none;
        }
    }
}
</style>
