_.mixin({
    valueMap: function(keys, value) {
        var obj = {};
        _(keys).each(function(key) {
            obj[key] = value;
        });
        return obj;
    },

    keysWithValue: function(obj, value) {
        var keys = [];

        _.each(obj, function (v, k) {
            if (v === value)
                keys.push(k);
        });

        return keys;
    }
});
