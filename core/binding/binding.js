define('core/binding/binding', ['core/object'], function (Object) {
    return Object.extend(
        {
            setValueSafe: function (realTarget, realSource) {
                var source = realSource && realSource.length ? realSource[realSource.length - 1] : realSource;
                var target = realTarget && realTarget.length ? realTarget[realTarget.length - 1] : realTarget;

                if (!target || !target.point) {
                    return;
                }

                if(!source || !source.point)
                {
                    target.point.set(target.prop);
                    return;
                }

                target.point.set(target.prop, source.point.get(source.prop));
            },

            getPoint: function (target, targetPath) {
                if (!target) {
                    return null;
                }

                if (targetPath.indexOf(".") !== -1) {
                    var points = targetPath.split(".");
                    var point = target;
                    do {
                        var shift = points.shift();
                        point = point.get(shift);

                        if (!point) {
                            return null;
                        }

                    } while (points[1]);
                    return { point: point, prop: points[0] };
                }
                else {
                    return { point: target, prop: targetPath };
                }
            },

            getPointSubscribed: function (target, targetPath, action) {
                var subscribers = [];

                if (!target) {
                    return subscribers;
                }

                if (target && targetPath.indexOf(".") !== -1) {
                    var points = targetPath.split(".");
                    var point = target;
                    do {
                        point.addHandler(points[0], action);
                        subscribers.push({ point: point, prop: points[0] });

                        var shift = points.shift();
                        point = point.get(shift);

                        if (!point) {
                            subscribers.push(null);
                            return subscribers;
                        }

                    } while (points[1]);

                    point.addHandler(points[0], action);
                    subscribers.push({ point: point, prop: points[0] });
                    return subscribers;
                }
                else {
                    target.addHandler(targetPath, action);
                    subscribers.push({ point: target, prop: targetPath });
                    return subscribers;
                }
            },

            destroySubscribed: function (subscribers, action) {
                var current;

                while (current = subscribers.shift()) {  //Присвоение, не сравнение. Выходит при null в массиве.
                        current.point.removeHandler(current.prop, action);
                }
            }
        });
});