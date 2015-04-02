define('core/binding/chainBackWay', ['core/binding/binding'], function(Binding) {
    return Binding.extend({
        constructor : function (source, sourcePath, target, targetPath) {
            var self = this;
            self.target = target;
            self.source = source;
            self.sourcePath = sourcePath;
            self.targetPath = targetPath;
            self.subscribers = [];

            self.refresh = function() {
                self.destroy();

                if ((self.targetPath) && (self.sourcePath)) {
                    var realTarget = self.getPointSubscribed(self.target, self.targetPath, self.refresh);
                    var realSource = self.getPoint(self.source, self.sourcePath);
                    self.subscribers = realTarget;

                    return self.setValueSafe(realSource, realTarget);
                }
                else {
                    _.onErrorCode("errors.nothingToBind", ["chainBackWay"]);
                }
            };

            self.refresh();
        },

        destroy : function () {
            this.destroySubscribed(this.subscribers, this.refresh);
        }
    });
});