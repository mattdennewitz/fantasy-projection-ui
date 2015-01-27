var projectionStore = _.extend({}, Backbone.Events, {
    _state: {},

    get: function(key) {
        return this._state[key];
    },

    getInitialState: function(initialSystemIndex, initialType) {
        var system = __data__[initialSystemIndex];

        var selectedComponents = _.valueMap(
            system.system[initialType + '_fields'].slice(),
            true
        );

        return {
            currentSystem: system,
            currentType: initialType,
            selectedComponents: selectedComponents,
            scoredComponents: {},
            stats: {},
            qualifiedOnly: false
        }
    },

    /* returns filtered projections */
    getProjections: function() {
        var type = this.get('currentType');
        var projections = this.getAllProjections();
        var stats = this.get('stats');
        var scoredComponents = this.get('scoredComponents');

        /* return only qualified players */
        if(this.get('qualifiedOnly') === true) {
            projections = _(projections).filter(function(projection) {
                return projection[Settings[type].baselineField] >= Settings[type].defaultMin;
            });
        }

        /* set z-scores */
        _(projections).each(function(projection) {
            var z = 0;

            _(scoredComponents).each(function(componentName) {
                var value = projection[componentName] * ComponentMap[type][componentName].dir;

                console.log(componentName, value);

                z += ss.z_score(value,
                                stats[componentName].avg,
                                stats[componentName].stdev)
            });

            projection.zValue = (new Number(z)).toFixed(3);
        });

        /* sort by z values */
        if(scoredComponents.length > 0) {
            projections = _(projections).sortBy(function(projection) {
                return -1 * projection.zValue;
            });
        }

        return projections;
    },

    /* returns -all- projections, unfiltered */
    getAllProjections: function() {
        return this.get('currentSystem')[this.get('currentType') + '_projections'];
    },

    set: function(updateSet, opts) {
        var opts = opts || {};
        var silent = opts.silent || false;

        _.extend(this._state, updateSet);

        if(!silent)
            this.trigger(Flags.stateChange);
    },

    /* calculates summary stats for current projection set */
    getStats: function(projections, components) {
        var weights = {};

        _(components).each(function(componentName) {
            var values = _(projections).pluck(componentName);

            weights[componentName] = {
                avg: ss.mean(values),
                stdev: ss.standard_deviation(values),
                min: ss.min(values),
                max: ss.max(values)
            }
        }.bind(this));

        return weights;
    },

    loadSystem: function(newSystemIndex, newType) {
        var newSystem = __data__[newSystemIndex];
        var newType = newType;
        var components = newSystem.system[newType + '_fields'];

        var newState = {
            currentSystem: newSystem,
            currentType: newType,
            selectedComponents: Settings[newType].defaultSelectedFields,
            scoredComponents: []
        };

        /* calculate summary stats for projection set */
        newState.stats = this.getStats(newSystem[newType + '_projections'],
                                       components);

        if( _(this._state).isEmpty() )
            newState = _.extend(this.getInitialState(newSystemIndex, newType),
                                newState);

        this.set(newState, {silent: true});

        this.trigger(Flags.systemReady);
    }
});
