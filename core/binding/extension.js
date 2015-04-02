define('core/binding/extension',
    {context: 'core/binding/extensions/context',
        ifExtension: 'core/binding/extensions/if',
        itemExtension: 'core/binding/extensions/item',
        parentExtension: 'core/binding/extensions/parent',
        stringExtension: 'core/binding/extensions/string',
        templateParent: 'core/binding/extensions/templateParent',
        lambdaExtension: 'core/binding/extensions/lambda',
        switchExtension: 'core/binding/extensions/switch',
        tokenExtension: 'core/binding/extensions/token',
        resourceExtension: 'core/binding/extensions/resource',
        countExtension: 'core/binding/extensions/count',
        claimExtension: 'core/binding/extensions/claim'
    }, function (imported) {
        var extensions = {
            'context': imported.context,
            'if': imported.ifExtension,
            'item': imported.itemExtension,
            'parent': imported.parentExtension,
            'string': imported.stringExtension,
            'templateParent': imported.templateParent,
            'lambda': imported.lambdaExtension,
            'switch': imported.switchExtension,
            'token': imported.tokenExtension,
            'resource': imported.resourceExtension,
            'count': imported.countExtension,
            'claim': imported.claimExtension
        };

        return {
            createExtension: function (extensionJSON) {
                var self = this;
                var extensionName = extensionJSON.extensionName;
                var paramsJSON = extensionJSON.params;
                var params = {};

                _.each(paramsJSON, function (value, key) {
                    var param = value;

                    if (param.extensionName) {
                        param = self.createExtension(value);
                    }
                    params[key] = param;

                });

                var extension = new (extensions[extensionName])(params);
                extension.extensionName = extensionJSON.extensionName;
                return extension;
            },

            process: function (targetPath, extensionJSON, source, target) {
                if (!extensionJSON || !extensionJSON.extensionName) {
                    target.put(targetPath, extensionJSON);
                    return undefined;
                }

                var extension = this.createExtension(extensionJSON);

                if (extension && extension.execute) {
                    extension.execute(source, target, targetPath);
                    return extension;
                }
            }
        };
    });