define('core/collection', ['core/object'], function (Object) {

    return Object.extend({
        constructor: function (items) {
            var self = this;
            self.cid = _.uniqueId('c');

            self.length = 0;
            self.items = [];

            self.initialize.apply(self, arguments);

            if (items) {
                self.reset(items, true);
            }
        },

        each: function (callback) {
            return _.each(this.items, callback);
        },

        filter: function (callback) {
            return _.filter(this.items, callback);
        },

        find: function (callback) {
            return _.find(this.items, callback);
        },

        all: function (callback) {
            return _.all(this.items, callback);
        },

        any: function (callback) {
            return _.any(this.items, callback);
        },

        indexOf: function (substr) {
            return _.indexOf(this.items, substr);
        },

        reject: function (callback) {
            return _.reject(this.items, callback);
        },

        sortBy: function (callback, isSilent) {
            this.items.sort(callback);

            if (!isSilent) {
                this.trigger('reset');
                this.trigger('change');
            }
        },

        where: function (fx) {
            var result = new this.constructor();
            this.each(function (item) {
                if (fx(item)) {
                    result.add(item);
                }
            });
            return result;
        },

        contains: function (checkItem) {
            return this.any(function (item) {
                return item === checkItem;
            });
        },

        map: function (fx) {
            var result = new this.constructor();
            this.each(function (item) {
                result.add(fx(item));
            });
            return result;
        },

        clone: function () {
            var result = new this.constructor();
            this.each(function (item) {
                result.add(item);
            });
            return result;
        },

        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
        initialize: function () {
        },

        // The JSON representation of a Collection is an array.
        toJSON: function () {
            var clonedItems = [];
            _.each(_.clone(this.items), function (item) {
                if (item.toJSON) {
                    item = item.toJSON();
                }
                clonedItems.push(item);
            });
            return clonedItems;
        },

        // Get the model at the given index.
        at: function (index) {
            return this.items[index];
        },

        add: function (items, isSilent, at) {
            items = _.isArray(items) ? items : [items];

            var length = items.length;
            this.length += length;
            var index = _.isNumber(at) ? at : this.items.length;

            this.items.splice.apply(this.items, [index, 0].concat(items));

            for (var i = 0; i < length; i++) {
                var item = items[i];

                if (isSilent) {
                    continue;
                }

                this.trigger('add', item, this.indexOf(item));
                this.trigger('change');
            }

            return this;
        },

        // Add new elements to the end of the set. Pass silent to avoid firing the `add` event for every new item.
        push: function (items, isSilent) {
            return this.add(items, isSilent, this.items.length);
        },

        // Add new elements to the beginning of the set. Pass silent to avoid firing the `add` event for every new item.
        unshift: function (items, isSilent) {
            return this.add(items, isSilent, 0);
        },

        // Remove an item, or a list of items from the set. Pass silent to avoid
        // firing the `remove` event for each model has been removed.
        remove: function (items, isSilent) {
            items = _.isArray(items) ? items.slice() : [items];

            for (var i = 0; i < this.length; i++) {
                var item = this.items[i];

                if (_(items).indexOf(item) === -1) {
                    continue;
                }

                this.items.splice(i, 1);
                this.length--;

                if (!isSilent) {
                    this.trigger('remove', item, i);
                    this.trigger('change');
                }

                i--;
            }

            return this;
        },


        // Remove an item from fixed position. Pass silent to avoid firing the `remove` event for every model removed.
        removeAt: function (index, isSilent) {
            var item = this.items[index];

            this.items.splice(index, 1);
            this.length--;

            if (!isSilent) {
                this.trigger('remove', item, index);
                this.trigger('change');
            }

            return this;
        },

        // Remove last item. Pass silent to avoid firing the `remove` event for every model removed.
        pop: function (isSilent) {
            var length = this.items.length;
            var index = length - 1;
            var item = this.items[index];
            this.removeAt(index, isSilent);
            return item;
        },

        // Remove first item. Pass silent to avoid firing the `remove` event for every model removed.
        shift: function (isSilent) {
            var index = 0;
            var item = this.items[index];
            this.removeAt(index, isSilent);
            return item;
        },

        // Exchange elements with indexes index1 and index2 and firing `swap` event
        swap: function (index1, index2, isSilent) {
            //todo: need to implement for item1, item2 (not only for indexes) ?

            if (!this.items.hasOwnProperty(index1) || !this.items.hasOwnProperty(index2)) {
                return;
            }

            var tempItem = this.items[index1];
            this.items[index1] = this.items[index2];
            this.items[index2] = tempItem;

            if (!isSilent) {
                this.trigger('swap', index1, index2);
                this.trigger('change');
            }
        },

        // Step item-element up and firing `swap` event
        moveUp: function (item, isSilent, isCircling) {
            var index = this.items.indexOf(item);
            if (index === -1) {
                return;
            }

            var whereIndex = index - 1;
            if (index === 0) {
                if (!isCircling) {
                    return;
                }
                whereIndex = this.items.length - 1;
            }

            this.swap(index, whereIndex, isSilent);
            return true;
        },

        // Step item-element down and firing `swap` event
        moveDown: function (item, isSilent, isCircling) {
            var index = this.items.indexOf(item);
            if (index === -1) {
                return;
            }

            var whereIndex = index + 1;
            if (index === this.items.length - 1) {
                if (!isCircling) {
                    return;
                }
                whereIndex = 0;
            }

            this.swap(index, whereIndex, isSilent);
            return true;
        },

        // When you have more items than you want to add or remove individually,
        // you can reset the entire set with a new list of models, without firing
        // any `add` or `remove` events. Fires `reset` when finished.
        reset: function (items, isSilent) {
            //WARNING contract! items = items || [];
            if (!items) {
                throw new Error('Метод reset() надо вызывать в конце с готовым массивом данных!');
            }

            this.length = 0;
            this.items = [];

            this.add(items, true);

            if (!isSilent) {
                this.trigger('reset');
                this.trigger('change');
            }

            return this;
        },

        assign: function (collection, fx, isSilent) {
            var self = this;
            self.length = 0;
            self.items = [];

            collection.each(function (item) {
                self.add(fx ? fx(item) : item, true);
            });

            if (!isSilent) {
                self.trigger('reset');
                self.trigger('change');
            }

            return self;
        },

        previous: function (item, predicate) {
            var itemPosition = this.items.indexOf(item);
            if (itemPosition === -1) {
                return false;
            }
            if (!predicate) {
                this.currentPosition = itemPosition > 0 ? itemPosition - 1 : this.items.length - 1;
                return this.items[this.currentPosition];
            }
            else {
                var current = item;
                while (current = this.previous(current)) {
                    if (predicate.call(this, current)) {
                        this.currentPosition = this.items.indexOf(current);
                        return current;
                    }

                    if (current === item) {
                        return false;
                    }
                }
            }
        },

        next: function (item, predicate) {
            var itemPosition = this.items.indexOf(item);
            if (itemPosition === -1) {
                return false;
            }
            if (!predicate) {
                this.currentPosition = itemPosition < this.items.length - 1 ? itemPosition + 1 : 0;
                return this.items[this.currentPosition];
            } else {
                var current = item;
                while (current = this.next(current)) {
                    if (predicate.call(this, current)) {
                        this.currentPosition = this.items.indexOf(current);
                        return current;
                    }

                    if (current === item) {
                        return false;
                    }
                }
            }
        },

        first: function (predicate) {
            var self = this;
            if (self.items.length === 0) {
                return;
            }
            var startPosition = 0;
            if (!predicate) {
                self.currentPosition = startPosition;
                return self.items[self.currentPosition];
            }

            for (var i = startPosition; i < self.items.length; i++) {
                if (predicate.call(this, self.items[i])) {
                    this.currentPosition = i;
                    return self.items[i];
                }
            }
        },

        last: function (predicate) {
            var self = this;
            if (self.items.length === 0) {
                return;
            }
            var startPosition = self.items.length - 1;
            if (!predicate) {
                self.currentPosition = startPosition;
                return self.items[self.currentPosition];
            }

            for (var i = startPosition; i > 0; i--) {
                if (predicate.call(this, self.items[i])) {
                    this.currentPosition = i;
                    return self.items[i];
                }
            }
        },

        merge: function (newItems, comparator) {
            newItems = newItems || [];

            var before = function (a, b) {
                for (var i = 0; i < newItems.length; i++) {
                    if (comparator(a, newItems[i])) {
                        return true;
                    }
                    if (comparator(b, newItems[i])) {
                        return false;
                    }
                }

                return false;
            };

            var contains = function (haystack, needle, comparator) {
                for (var index = 0, length = haystack.length; index < length; index++) {
                    if (comparator(needle, haystack[index])) {
                        return true;
                    }
                }

                return false;
            };

            var self = this;
            var initItems = _.clone(this.items);

            _.each(initItems, function (item) {
                if (!contains(newItems, item, comparator)) {
                    self.remove(item);
                }
            });

            initItems = _.clone(self.items);
            var i = 0, j, currentPlace, item;

            while (i < initItems.length) {
                j = i + 1;
                currentPlace = 0;
                while (j < initItems.length) {
                    if (before(self.items[j], self.items[i])) {
                        if (!currentPlace || before(self.items[j], self.items[currentPlace])) {
                            currentPlace = j;
                        }
                    }
                    j++;
                }
                if (currentPlace) {
                    item = self.items[i];
                    self.remove(item);
                    self.add(item, false, currentPlace);
                } else {
                    i++;
                }
            }

            for (i = 0; i < newItems.length; i++) {
                if (!contains(initItems, newItems[i], comparator)) {
                    self.add(newItems[i], false, i);
                }
            }

            return this;
        },

        chain: function () {
            return _(this.items).chain();
        }
    }, {
        from: function (source, fx) {
            return this.generator(fx)(source);
        },

        generator: function (fx) {
            var self = this;
            return function (source) {
                return new self.prototype.constructor(fx ? _.map(source, fx) : source);
            };
        }
    });
});