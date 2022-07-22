export default {
    install(Vue) {
        Vue.mixin({
            methods: {
                /**
                 * Global message handler; shows a Buefy snackbar toast on screen
                 * @param  {Error}   err                Application error
                 * @param  {String}  message            message to display to the user
                 * @param  {Boolean}  [critical=false]  For critical errors, force a page reload
                 * @param  {Object}  [extraOptions={}]  Extra Buefy snackbar options to override defaults
                 */
                $displayMessage(err, message, critical = false, extraOptions = {}) {
                    console.error('Error:', err, message); // eslint-disable-line no-console
                    const snackbarOptions = {
                        message,
                        type: 'is-danger',
                        actionText: this.$t('shared.button-ok'),
                    };
                    // for critical errors, refresh the page after dismissing snackbar
                    if (critical) {
                        snackbarOptions.indefinite = true;
                        snackbarOptions.onAction = () => { this.$router.go(); };
                        snackbarOptions.actionText = this.$t('shared.button-retry');
                    }
                    this.$buefy.snackbar.open({
                        ...snackbarOptions,
                        ...extraOptions,
                    });
                },
            },
        });
    },
};
