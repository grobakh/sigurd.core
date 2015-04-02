define('core/binding/bindingManager', [
    'core/object',
    'core/binding/oneTime',
    'core/binding/oneWay',
    'core/binding/backWay',
    'core/binding/twoWay',
    'core/binding/chainOneTime',
    'core/binding/chainOneWay',
    'core/binding/chainBackWay',
    'core/binding/chainTwoWay'
], function (Object, OneTime, OneWay, BackWay, TwoWay, ChainOneTime, ChainOneWay, ChainBackWay, ChainTwoWay) {
    return Object.extend(
        {},
        // static members
        {
            bind : function(mode, source, sourcePath, target, targetPath) {
                switch (mode ? mode.toLowerCase() : '') {
                    case 'onetime':
                        return new OneTime(source, sourcePath, target, targetPath);
                    case 'oneway':
                        return new OneWay(source, sourcePath, target, targetPath);
                    case 'backway':
                        return new BackWay(source, sourcePath, target, targetPath);
                    case 'twoway':
                        return new TwoWay(source, sourcePath, target, targetPath);
                    case 'chainonetime':
                        return new ChainOneTime(source, sourcePath, target, targetPath);
                    case 'chainoneway':
                        return new ChainOneWay(source, sourcePath, target, targetPath);
                    case 'chainbackway':
                        return new ChainBackWay(source, sourcePath, target, targetPath);
                    case 'chaintwoway':
                        return new ChainTwoWay(source, sourcePath, target, targetPath);
                    default:
                        _.onErrorCode("errors.invalidBindingMode", [mode]);
                }
            }
        });
});
