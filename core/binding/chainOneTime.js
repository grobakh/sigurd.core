define('core/binding/chainOneTime', ['core/binding/binding'], function(Binding) {
    return Binding.extend({
        constructor : function (source, sourcePath, target, targetPath) {
            var self = this;
            self.target = target;
            self.source = source;
            self.sourcePath = sourcePath;
            self.targetPath = targetPath;

            self.refresh = function () {
                self.destroy();

                if ((self.targetPath) && (self.sourcePath)) {
                    var realTarget = self.getPoint(self.target, self.targetPath);
                    var realSource = self.getPoint(self.source, self.sourcePath);
                    return self.setValueSafe(realTarget, realSource);
                }
                else {
                    _.onErrorCode("errors.nothingToBind", ["chainOneTime"]);
                }
            };

            self.refresh();
        },

        destroy: function () {
        }
    });
});