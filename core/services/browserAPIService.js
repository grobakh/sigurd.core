define('core/services/browserAPIService', {
    Model: 'core/model',
    DialogModel: 'controls/popup/dialogModel',
    lexemesService: instance('core/services/lexemesService')
}, function (imported) {
    return imported.Model.extend({
        constructor: function (attr) {
            var self = this;
            imported.Model.prototype.constructor.call(this, attr);

            window.onbeforeunload = function () {
                if (self.checkCallback && self.checkCallback()) {
                    return self.message;
                }
            };
        },

        addBeforeUnloadHandler: function (checkCallback, message) {
            var self = this;
            self.checkCallback = checkCallback;
            self.message = message ? imported.lexemesService.getToken(message.lexeme, message.token) : "";
        },

        removeBeforeUnloadHandler: function () {
            var self = this;
            self.checkCallback = null;
            self.message = null;
        }
    });
});