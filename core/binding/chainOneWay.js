define('core/binding/chainOneWay', ['core/binding/binding'], function(Binding) {
    return Binding.extend({
        constructor : function (source, sourcePath, target, targetPath) {
            var self = this;
            self.target = target;
            self.source = source;
            self.sourcePath = sourcePath;
            self.targetPath = targetPath;
            self.subscribers = [];

            self.refresh = function () {
                self.destroy();

                if ((self.targetPath) && (self.sourcePath)) {
                    var realTarget = self.getPoint(self.target, self.targetPath);
                    var realSource = self.getPointSubscribed(self.source, self.sourcePath, self.refresh);
                    self.subscribers = realSource;

                    return self.setValueSafe(realTarget, realSource);
                }
                else {
                    _.onErrorCode("errors.nothingToBind", ["chainOneWay"]);
                }
            };

            self.refresh();
        },

        destroy: function () {
            this.destroySubscribed(this.subscribers, this.refresh);
        }
    });
});