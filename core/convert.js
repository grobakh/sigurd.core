define('core/convert', ['core/model', 'core/collection'], function (Model, Collection) {
    return {
        objectToModel: function (json) {
            var self = this;
            var model = new Model(json);

            _.each(model.keys(), function (key) {
                var value = model.get(key);

                if (_.isArray(value)) {
                    model.put(key, self.arrayToCollection(value));
                } else if (_.isObject(value)) {
                    model.put(key, self.objectToModel(value));
                }
            });

            return model;
        },

        arrayToCollection: function (array, generateModel, proccessModel) {
            var self = this;
            var result = new Collection();

            if (!array) {
                return result;
            }

            for (var index = 0, length = array.length; index < length; index++) {
                var item = array[index];

                if (_.isObject(item)) {
                    item = generateModel ? generateModel(item) : self.objectToModel(item);

                    if (proccessModel) {
                        item = proccessModel.call(this, item);
                    }
                } else if (_.isArray(item)) {
                    item = self.arrayToCollection(item, generateModel, proccessModel);
                }

                result.add(item, true);
            }

            return result;
        },

        mapToCollection: function (hash, keyName, valueName) {
            var result = new Collection();
            var record;

            for (var prop in hash) {
                if (hash.hasOwnProperty(prop)) {
                    record = {};
                    record[keyName] = prop;
                    record[valueName] = hash[prop];
                    var model = new Model(record);
                    result.add(model, true);
                }
            }

            return result;
        },

        collectionToMap: function (collection, keyName, valueName, parseKey, parseValue, filter) {
            var result = {};

            collection.each(function (element) {

                if (filter && !filter(element)) {
                    return;
                }

                var key = element.get(keyName);
                var value = element.get(valueName);

                key = parseKey ? parseKey(key) : key;
                result[key] = parseValue ? parseValue(value) : value;
            });

            return result;
        },

        pluck: function (collection, property) {
            var array = [];

            collection.each(function (element) {
                if (element instanceof Model) {
                    array.push(element.get(property));
                } else {
                    array.push(element[property]);
                }
            });

            return array;
        },

        dateToString: function(date, timeSeparator, dateSeparator, partSeparator) {
            date = date || new Date();
            timeSeparator = timeSeparator || ':';
            dateSeparator = dateSeparator || '-';
            partSeparator = partSeparator || ' ';

            return date.getFullYear() + dateSeparator + (date.getMonth() + 1) + dateSeparator + date.getDate() +
                partSeparator + date.getHours() + timeSeparator + date.getMinutes() + timeSeparator + date.getSeconds();
        },

        createUnixTime: function(year, month, day, hours, minutes, seconds) {
            year = parseInt(year, 10);
            month = parseInt(month, 10);
            day = parseInt(day, 10);
            if(_.isNaN(year) || _.isNaN(month) || _.isNaN(day)) {
                return false;
            }

            hours = parseInt(hours, 10) || 0;
            minutes = parseInt(minutes, 10) || 0;
            seconds = parseInt(seconds, 10) || 0;
            if(_.isNaN(hours) || _.isNaN(minutes) || _.isNaN(seconds)) {
                return false;
            }

            var d = new Date();
            d.setFullYear(year, month - 1, day);
            d.setHours(hours);
            d.setMinutes(minutes);
            d.setSeconds(seconds);

            return d.getTime();
        },

        toUnixTime: function (value) {
            var self = this;
            var dateTest = /^([0123]?\d)\/([01]?\d)\/([12]\d\d\d)$/;

            if (_.isEmpty(value) || !dateTest.test(value)) {
                return undefined;
            } else {
                var parts = dateTest.exec(value);

                return self.createUnixTime(parts[3], parts[2], parts[1]);
            }
        }
    };
});