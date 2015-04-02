define('core/services/validationService', {
    Model: 'core/model',
    Collection: 'core/collection'
}, function (imported) {
    return imported.Model.extend({

        constructor: function (attr) {
            imported.Model.prototype.constructor.call(this, attr);
            var self = this;

            self.validations = [];
            self.validationsInit();

            var russianAlphabet = ['а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л',
                'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я'];
            var englishAlphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
                'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

            var numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

            var allowedSymbols = ['_', '+', '-'];


            russianAlphabet = _.union(russianAlphabet, _.map(russianAlphabet, function (c) {
                return c.toUpperCase()
            }));
            englishAlphabet = _.union(englishAlphabet, _.map(englishAlphabet, function (c) {
                return c.toUpperCase()
            }));


            self.alphabets = _.object(_.union(russianAlphabet, englishAlphabet));
            self.articleNameAlphabet = _.object(_.union(englishAlphabet, numbers, allowedSymbols));
        },

        validationsInit: function () {
            var self = this;

            function hasOnlyDigits(value) {
                return /^\d+$/.test(value);
            }

            function hasAlphabetSymbols(alphabet, value) {
                if (!value) {
                    return false;
                }
                var c;

                for (var i = 0; i < value.length; i++) {
                    c = value.charAt(i);
                    if (alphabet.hasOwnProperty(c)) {
                        return true;
                    }

                }

                return false;
            }

            function hasOnlyAlphabetSymbols(alphabet, value) {
                if (!value) {
                    return true;
                }
                var c;
                for (var i = 0; i < value.length; i++) {
                    c = value.charAt(i);
                    if (!alphabet.hasOwnProperty(c)) {
                        return false;
                    }
                }
                return true;
            }


            self.validations['date'] = function (day, month, year) {

                if (!hasOnlyDigits(day) || !hasOnlyDigits(month) || !hasOnlyDigits(year)) {
                    return true;
                }

                var daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; //index is month number

                if (month == 1 || month > 2) {
                    if ((day > 0) && (day <= daysPerMonth[month - 1])) {
                        return false;
                    }
                }
                if (month == 2) {
                    var lyear = false;

                    if ((!(year % 4) && year % 100) || !(year % 400)) {
                        lyear = true;
                    }

                    if ((day > 0) && (day <= lyear ? 29 : 28)) {
                        return false;
                    }

                }

                return true;

            };


            self.validations['empty'] = function (value) {
                return _.isEmpty(value);
            };

            self.validations['shortText'] = function (value) {
                return value && value.length > 250;
            };

            self.validations['longText'] = function (value) {
                return value && value.length > 1500;
            };

            self.validations['itemName'] = function (value) {
                return !value || (!hasAlphabetSymbols(self.alphabets, value));
            };

            self.validations['barcode'] = function (value) {
                if (!value) {
                    return false;
                }

                var temp = value;
                temp = temp.replace(/[ -]+/g, "");

                temp = temp.replace(/[0-9]+/g, "");
                temp = temp.replace(/,+/g, "");
                temp = temp.replace(/;+/g, "");

                if (temp.length) {
                    return true;
                }

                temp = value;

                var barCodesCount = 0, delimitersCount = 0;

                temp = temp.replace(/[ -]+/g, "");

                temp = temp.replace(/[0-9]{13}/g, function () {
                    barCodesCount++;
                    return "";
                });
                temp = temp.replace(/[0-9]{12}/g, function () {
                    barCodesCount++;
                    return "";
                });
                temp = temp.replace(/[0-9]{8}/g, function () {
                    barCodesCount++;
                    return "";
                });

                temp = temp.replace(/[;,]/g, function () {
                    delimitersCount++;
                    return "";
                });

                return (/[0-9]+/g.test(temp)) || (barCodesCount !== delimitersCount + 1);
            };

            self.validations['articleCode'] = function (value) {
                return _.isEmpty(value) || !hasOnlyAlphabetSymbols(self.articleNameAlphabet, value);
            };
        },

        validate: function (valueModel, propName) {
            var self = this;
            propName = propName || 'value';
            var value = valueModel.get(propName);
            var validator = valueModel.get('validator');

            var errors = valueModel.get('errors');
            if (!errors) {
                errors = new imported.Collection();
                valueModel.set('errors', errors);
            }

            var data = [];

            if (validator) {
                var validatorToken = validator.trim();
                var validateFunction = self.validations[validatorToken];
                if (_.isFunction(validateFunction) && validateFunction(value)) {
                    data.push(validatorToken);
                }
            }

            errors.reset(data);

            valueModel.set('hasErrors', errors.length > 0);
            return !valueModel.get('hasErrors');
        },

        validateAll: function (item, propName) {
            var self = this;
            propName = propName || 'value';
            var hasErrors = false;

            item.get('fieldGroupCollection').each(function (fieldGroupModel) {
                fieldGroupModel.get('brickCollection').each(function (brickModel) {
                    if (!self.validate(brickModel, propName)) {
                        hasErrors = true;
                    }
                });
            });

            if (item.get('itemSystemFieldsModel')) {
                _.each(item.get('itemSystemFieldsModel').values(), function (brickModel) {
                    if (!self.validate(brickModel, propName)) {
                        hasErrors = true;
                    }
                });
            }

            if (item.get('articleSystemFieldsModel')) {
                _.each(item.get('articleSystemFieldsModel').values(), function (brickModel) {
                    if (!self.validate(brickModel, propName)) {
                        hasErrors = true;
                    }
                });
            }

            return !hasErrors;
        }

    });
});