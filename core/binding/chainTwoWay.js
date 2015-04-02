define('core/binding/chainTwoWay', ['core/binding/binding'], function(Binding) {
    return Binding.extend({
        constructor : function (source, sourcePath, target, targetPath) {
            var self = this;
            self.target = target;
            self.source = source;
            self.sourcePath = sourcePath;
            self.targetPath = targetPath;
            self.sourceSubscribers = [];
            self.targetSubscribers = [];

            self.refresh = function () {
                self.destroy();

                if ((self.targetPath) && (self.sourcePath)) {
                    var realSource = self.getPointSubscribed(self.source, self.sourcePath, self.refresh);
                    self.sourceSubscribers = realSource;

                    var realTarget = self.getPointSubscribed(self.target, self.targetPath, self.refreshBackward);
                    self.targetSubscribers = realTarget;

                    return self.setValueSafe(realTarget, realSource);
                }
                else {
                    _.onErrorCode("errors.nothingToBind", ["chainTwoWay (refresh)"]);
                }
            };

            self.refreshBackward = function () {
                self.destroy();

                if ((self.targetPath) && (self.sourcePath)) {
                    var realSource = self.getPointSubscribed(self.source, self.sourcePath, self.refresh);
                    self.sourceSubscribers = realSource;

                    var realTarget = self.getPointSubscribed(self.target, self.targetPath, self.refreshBackward);
                    self.targetSubscribers = realTarget;

                    return self.setValueSafe(realSource, realTarget);
                }
                else {
                    _.onErrorCode("errors.nothingToBind", ["chainTwoWay (refreshBackward)"]);
                }
            };

            self.refresh();
        },

        destroy : function () {
            this.destroySubscribed(this.sourceSubscribers, this.refresh);
            this.destroySubscribed(this.targetSubscribers, this.refreshBackward);
        }
    });
});