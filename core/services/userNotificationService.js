define('core/services/userNotificationService', {
    Model: 'core/model',
    DialogModel: 'controls/popup/dialogModel',
    resourceService: instance('core/services/resourceService')
}, function (imported) {
    return imported.Model.extend({

        constructor: function (attr) {
            imported.Model.prototype.constructor.call(this, attr);

            var self = this;
            self.operationLog = [];

            self.confirmDialog = new imported.DialogModel().initialize({
                    doCommit: function () {
                        self.confirmDialog.hideDialog();

                        self.resultAsync.resolve(true);
                    }, doCancel: function () {
                        self.confirmDialog.hideDialog();

                        self.resultAsync.resolve(false);
                    }}
            );

            imported.resourceService.set('confirmDialog', self.confirmDialog);
        },

        confirmOperationAsync: function (token) {
            var self = this;

            self.resultAsync = future.create();

            token = token || 'commonConfirmMessage';
            imported.resourceService.get('confirmDialog').set('headText', token);
            self.confirmDialog.showDialog();

            return self.resultAsync;
        },

        logNotification: function (token, type) {
            type = type || 'common';
            this.operationLog.push({
                time: _.dateToString(new Date()),
                type: type,
                token: token
            });
        },

        operationStart: function (token) {
            this.logNotification(token, 'start');
            imported.resourceService.set('userOperationStartToken', token);
            imported.resourceService.set('userOperationStart', { });
        },

        operationSuccess: function (token) {
            this.logNotification(token, 'success');
            imported.resourceService.set('userOperationSuccessToken', token);
            imported.resourceService.set('userOperationSuccess', { });
            imported.resourceService.set('userOperationStart');
        },

        operationFail: function (token) {
            this.logNotification(token, 'fail');
            imported.resourceService.set('userOperationFailToken', token);
            imported.resourceService.set('userOperationFail', { });
            imported.resourceService.set('userOperationStart');
        },

        showBadMessage: function (token) {
            this.logNotification(token, 'badMessage');
            imported.resourceService.set('userBadMessageToken', token);
            imported.resourceService.set('userBadMessage', {});
        },

        hideBadMessage: function () {
            imported.resourceService.set('userBadMessage');
        },

        showNormalMessage: function (token) {
            this.logNotification(token, 'normalMessage');
            imported.resourceService.set('userNormalMessageToken', token);
            imported.resourceService.set('userNormalMessage', {});
        },

        hideNormalMessage: function () {
            imported.resourceService.set('userNormalMessage');
        }
    });
});