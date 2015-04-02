define('core/binding/oneWay', ['core/object'], function (Object) {
    return Object.extend({
        constructor: function (source, sourcePath, target, targetPath) {
            if (!target || !targetPath || !sourcePath) {
                return;
            }

            if (!source) {
                target.set(targetPath);
                return;
            }

            var self = this;
            self.source = source;
            self.sourcePath = sourcePath;

            self.refresh = function () {
                target.set(targetPath, source.get(sourcePath));
            };

            self.source.addHandler(self.sourcePath, self.refresh);
            self.refresh();
        },

        destroy: function () {
            var self = this;

            if (!self.source || !self.sourcePath) {
                return;
            }

            self.source.removeHandler(self.sourcePath, self.refresh);
        }
    });
});