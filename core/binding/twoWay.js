define('core/binding/twoWay', ['core/object'], function(Object) {
    return Object.extend({
        constructor : function (source, sourcePath, target, targetPath) {
            if (!target || !targetPath || !sourcePath) {
                return;
            }

            if (!source) {
                target.set(targetPath);
                return;
            }

            var self = this;
            self.target = target;
            self.source = source;
            self.sourcePath = sourcePath;
            self.targetPath = targetPath;

            self.refresh = function () {
                target.set(targetPath, source.get(sourcePath));
            };

            self.refreshBackward = function () {
                source.set(sourcePath, target.get(targetPath));
            };

            self.source.addHandler(self.sourcePath, self.refresh);
            self.target.addHandler(self.targetPath, self.refreshBackward);
            self.refresh();
        },

        destroy : function () {
            var self = this;

            if (!self.source || !self.target || !self.sourcePath || !self.targetPath) {
                return;
            }

            self.source.removeHandler(self.sourcePath, self.refresh);
            self.target.removeHandler(self.targetPath, self.refreshBackward);
        }
    });
});