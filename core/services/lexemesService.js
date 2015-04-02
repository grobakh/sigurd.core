define('core/services/lexemesService', {
    Object: 'core/object',
    networkService: instance('core/services/networkService'),
    appConfig: instance('appConfig')
}, function (imported) {

    var ruAlphabet = ['а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л',
        'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я',
        '_', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

    //стандартная международная транслитерация (с вики)
    var transliterationMap = ['a' , 'b', 'v', 'g', 'd', 'e', 'e', 'j', 'z', 'i', 'i', 'k', 'l',
        'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'f','h', 'c', 'ch', 'sh', 'sc', '', 'y', '', 'e', 'iu', 'ia',
        '_', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];



    return imported.Object.extend({

        reset: function () {
            this.lexemes = [];
        },

        triggerLang: function () {
            var self = this;
            var newLang;

            var resultAsync = future.create();

            if (!this.langOld) {
                this.langOld = imported.appConfig.lang;
                newLang = "none";
            } else {
                newLang = this.langOld;
                this.langOld = null;
            }

            imported.appConfig.lang = newLang;

            var lexemeCodes = _.keys(this.lexemes);
            this.reset();

            future.when(this.downloadLexemesAsync(lexemeCodes)).then(function () {
                self.trigger('lang', self);

                resultAsync.resolve();
            });

            return resultAsync;
        },

        downloadLexemesAsync: function (lexemeCodes) {
            var self = this;
            self.lexemes = self.lexemes || {};

            var existingLexemes = _.keys(self.lexemes);
            lexemeCodes = _.reject(lexemeCodes, function (code) {
                return _.contains(existingLexemes, code);
            });

            if (lexemeCodes.length === 0) {
                return;
            }

            return imported.networkService.postObjectAsync("translate/getLexemes",
                lexemeCodes, function (response) {
                    self.lexemes = _.extend(self.lexemes, response.lexemes);
                });
        },

        replaceArgs: function (token, args) {
            var i = 1;
            while (args[i] !== undefined) {
                token = token.replace('%' + i, args[i]);
                i++;
            }
            return token;
        },

        getToken: function (lexemeCode, tokenCode, args) {
            if (!this.lexemes[lexemeCode]) {
                return "No lexeme found (" + lexemeCode + ")";
            }

            if (!this.lexemes[lexemeCode][tokenCode]) {
                return "No token found (" + lexemeCode + "." + tokenCode + ")";
            }

            var result = this.lexemes[lexemeCode][tokenCode];
            if (args && args.length) {
                result = this.replaceArgs(result, args);
            }

            return result;
        },

        getErrorToken: function (errorCode, args) {
            var errorCodeSplit = errorCode.split(".");
            if (errorCodeSplit.length !== 2) {
                return errorCode;
            }

            var errorLexeme = errorCodeSplit[0];
            var errorToken = errorCodeSplit[1];
            if (!this.lexemes[errorLexeme] || !this.lexemes[errorLexeme][errorToken]) {
                return errorCode;
            }

            var result = this.lexemes[errorLexeme][errorToken];
            if (args && args.length) {
                result = this.replaceArgs(result, args);
            }

            return result;
        },


        getLexeme: function (lexemeCode) {
            if (!this.lexemes[lexemeCode]) {
                return "No lexeme found (" + lexemeCode + ")";
            }

            return this.lexemes[lexemeCode];
        },

        removeCommonStringErrors: function (str) {
            str = str || "";
            return str.toLowerCase().replace(/ё/gi, 'е').replace(/\s+/gi, ' ').trim();
        },

        findInString: function (request, source, algorithm) {
            request = this.removeCommonStringErrors(request);
            source = this.removeCommonStringErrors(source);

            if (request.startsWith('"') && request.endsWith('"')) {
                request = request.substr(1, request.length - 2);
                algorithm = "equals";
            }

            switch (algorithm) {
                case "contains":
                    return source.has(request);
                case "equals":
                    return source === request;
                default:
                    var requestWords = request.split(' ');

                    return _(requestWords).all(function (requestWord) {
                        return source.has(requestWord);
                    });
            }
        },

        transliterate: function (string) {
            if (!string) {
                return string;
            }

            var result = "", c;

            string = string.trim().replace(/\s/g,'_');

            for (var i = 0; i < string.length; i++) {
                c = string.charAt(i);
                var isUpperCase = c === c.toUpperCase();

                for (var j = 0; j < ruAlphabet.length; j++) {
                    if (c.toLowerCase() === ruAlphabet[j]) {
                        c = isUpperCase ? transliterationMap[j].toUpperCase() : transliterationMap[j];
                    }
                }

                if (transliterationMap.indexOf(c.toLowerCase()) !== -1) {
                    result += c;
                }
            }

            return result;
        }


    });
});