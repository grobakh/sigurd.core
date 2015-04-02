define('core/binding/backWay', ['core/object'], function(Object) {
    return Object.extend({
        constructor : function (source, sourcePath, target, targetPath) {
            if (!source || !target || !sourcePath || !targetPath) {
                return;
            }

            var self = this;
            self.target = target;
            self.targetPath = targetPath;

            self.refresh = function () {
                source.set(sourcePath, target.get(targetPath));
            };

            self.target.addHandler(self.targetPath, self.refresh);
            self.refresh();
        },

        destroy: function () {
            var self = this;

            if (!self.target || !self.targetPath) {
                return;
            }

            self.target.removeHandler(self.targetPath, self.refresh);
        }
    });
});