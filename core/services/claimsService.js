define('core/services/claimsService', {
    Object: 'core/object',
    appConfig: instance('appConfig')
}, function (imported) {
    return imported.Object.extend({

        initialize: function () {
            this.claims = imported.appConfig.claims;
        },

        reset: function () {
            this.claims = {};
            imported.appConfig.claims = {};
        },

        setClaims: function (claims) {
            var self = this;

            self.reset();

            for (var i = 0; i < claims.length; i++) {
                imported.appConfig.claims[claims[i]] = true;
            }

            self.initialize();

            self.trigger('changeClaims', self);
        },

        hasClaim: function (claim) {
            return !claim || this.claims[claim];
        }

    });
});