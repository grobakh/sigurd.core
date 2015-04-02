define('core/binding/extensions/claim', {
    Model: 'core/model',
    bindingManager: 'core/binding/bindingManager',
    claimsService: instance('core/services/claimsService')
}, function (imported) {
    return imported.Model.extend({
        constructor: function (params) {
            this.params = params;

            imported.Model.call(this);
        },

        execute: function (source, target, targetPath) {
            var self = this;

            self.put('claim', self.params.path);

            self.onModelChange = function () {
                self.set('value', imported.claimsService.hasClaim(self.get('claim')));
            };

            self.onModelChange();

            self.valueBinding = imported.bindingManager.bind('oneWay', self, "value", target, targetPath);

            imported.claimsService.addHandler('changeClaims', self.onModelChange);
        },

        destroy: function () {
            var self = this;

            imported.claimsService.removeHandler('changeClaims', self.onModelChange);

            self.valueBinding.destroy();
            self.valueBinding = null;

            imported.Model.prototype.destroy.call(self);
            self.dead = true;
        },

        updateOnContextChange: function () {
        }
    });
});