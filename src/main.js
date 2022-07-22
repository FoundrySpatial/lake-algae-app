import Vue from 'vue';
import numeral from 'numeral';
import numFormat from 'vue-filter-number-format';
import VueI18n from 'vue-i18n';
import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
import App from '@/App.vue';
import '@/assets/scss/app.scss';
import Router from 'vue-router';
import DisplayMessage from '@/displayMessage';

import { languages, defaultLocale } from '@/lang/i18n';

Vue.config.productionTip = false;

Vue.use(Router);

const router = new Router({
    mode: 'history',
    routes: [],
});

// install Buefy plugin
Vue.use(Buefy);

// vue internationalization
Vue.use(VueI18n);

// number formatting filters
Vue.filter('numFormat', numFormat(numeral));

// mixin for displaying snackbar to the user
Vue.use(DisplayMessage);

const messages = Object.assign(languages);

const i18n = new VueI18n({
    locale: defaultLocale,
    fallbackLocale: 'en',
    messages,
});

new Vue({
    i18n,
    router,
    render: (h) => h(App),
}).$mount('#app');
