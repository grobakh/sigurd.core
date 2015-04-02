define('core/binding/oneTime', ['core/object'], function(Object) {
    return Object.extend({
        constructor : function (source, sourcePath, target, targetPath) {
            if (!target || !targetPath || !sourcePath) {
                return;
            }

            if (!source) {
                target.set(targetPath);
                return;
            }

            target.set(targetPath, source.get(sourcePath));
        },

        destroy: function () {
        }
    });
});