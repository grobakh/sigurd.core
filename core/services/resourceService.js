define('core/services/resourceService', ['core/model'], function (Model) {
    return Model.extend({
        constructor: function (attr) {
            Model.prototype.constructor.call(this, attr);
        }
    });
});