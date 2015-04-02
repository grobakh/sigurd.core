define('core/view/templateDomExtension', {},
    function () {
        return {
            getClassName: function () {

                if (this.getElement()) {
                    this.attributes['class'] = this.element.className;
                }

                this.attributes['class'] = _.toString(this.attributes['class']);

                return this.attributes['class'];
            },

            hasClass: function (className) {
                return (" " + this.getClassName() + " ").has(" " + className + " ");
            },

            setClassName: function (className) {
                this.attributes['class'] = _.toString(className);

                if (this.getElement()) {
                    this.element.className = className;
                }
            },

            addClass: function (className) {
                var setClass;
                if (setClass = this.getClassName()) {
                    setClass = " " + setClass + " ";
                    if (!setClass.has(" " + className + " ")) {
                        this.setClassName(setClass.slice(1) + className);
                    }
                }
                else {
                    this.setClassName(className);
                }

                return this;
            },

            removeClass: function (className) {
                var currentClassName = this.getClassName();

                if (currentClassName && currentClassName.has(className)) {
                    var setClass = (" " + currentClassName + " ").replace(" " + className + " ", " ");
                    this.setClassName(setClass.slice(1, -1));
                }

                return this;
            },

            getValue: function () {

                if (this.getElement()) {
                    this.attributes.value = this.element.value;
                }

                this.attributes.value = _.toString(this.attributes.value);

                return this.attributes.value;
            },

            setValue: function (value) {
                this.attributes.value = _.toString(value);

                if (this.getElement()) {
                    this.element.value = this.attributes.value;
                }
            },

            //TODO remove. Currently used in wiki
            getText: function () {
                if (this.getElement()) {
                    return this.element.innerText;
                }

                return '';
            },

            getInnerHTML: function () {
                var self = this;
                if (self.getElement()) {
                    return self.element.innerHTML;
                } else {
                    var firstChild = self.getFirstChild();
                    return firstChild ? firstChild.value : '';
                }

                return '';
            },

            setText: function (text, isValueUnsafe) {
                text = _.toString(text);
                var value = isValueUnsafe ? text : _.encodeHTML(text);

                if (this.nodeName === 'input') {
                    this.setValue(value);
                    return;
                }

                var textNode;
                textNode = this.createFragment();
                this.setChildren([textNode]);

                textNode.isValueUnsafe = isValueUnsafe;
                textNode.value = text;

                if (this.getElement()) {

                    if (this.nodeName === 'textarea') {
                        this.element.value = value;
                    } else {
                        this.element.innerHTML = value;
                    }
                }
            },

            setFocus: function () {
                if (this.getElement() && this.element.focus) {
                    this.element.focus();
                }
            },

            setSelection: function () {
                if (this.getElement() && this.element.select) {
                    this.element.select();
                }
            },

            getAttribute: function (key) {
                if (this.getElement()) {
                    this.attributes[key] = this.element.getAttribute(key);
                }

                this.attributes[key] = _.toString(this.attributes[key]);
                return this.attributes[key];
            },

            setAttribute: function (key, value) {
                this.attributes[key] = _.toString(value);

                if (this.getElement()) {
                    this.element.setAttribute(key, this.attributes[key]);
                }
            },

            getStyle: function (styleName) {
                if (this.getElement()) {
                    var computedStyle = window.constructor.prototype.getComputedStyle.call(window, this.element);
                    return computedStyle.getPropertyValue(styleName);
                } else {
                    return "NOT IMPLEMENTED STYLE REQUEST"; //TODO implement
                }
            },

            setStyle: function (styleName, value) {
                if (this.getElement()) {
                    this.element.style.setProperty(styleName, value);
                } else {
                    // TODO make it more lazy
                    var css = " " + styleName + ":" + value + ";";
                    this.attributes.style = (_.toString(this.attributes.style)) + css;
                }
            },

            outerHeight: function () {
                if (this.getElement()) {
                    var computedStyle = window.constructor.prototype.getComputedStyle.call(window, this.element);
                    return parseInt(computedStyle.getPropertyValue('margin-top'), 10) +
                        parseInt(computedStyle.getPropertyValue('margin-bottom'), 10) + this.element.offsetHeight;
                }
                else {
                    return undefined;
                }
            },

            hide: function () {
                this.setStyle('display', 'none');
            },

            show: function (mode) {
                this.setStyle('display', mode || 'inline');
            },

            showBlock: function () {
                this.setStyle('display', 'block');
            },

            showInlineBlock: function () {
                this.setStyle('display', 'inline-block');
            },

            getStyleNumber: function (styleName) {
                return parseInt(this.getStyle(styleName), 10) || 0; //TODO MAX грязно, но заставляет IE работать
            },

            setStyleNumber: function (styleName, number) {
                this.setStyle(styleName, number + "px");
            },

            removeAttribute: function (key) {
                this.attributes[key] = undefined;

                if (this.getElement()) {
                    this.element.removeAttribute(key);
                }
            }
        };
    });