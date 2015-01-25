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
            qualifiedOnly: false
        }
    },

    set: function(updateSet, opts) {
        var opts = opts || {};
        var silent = opts.silent || false;

        this._state = _.extend(this._state, updateSet);

        if(!silent)
            this.trigger(Flags.stateChange);
    },

    loadSystem: function(newSystemIndex, newType) {
        var newSystem = __data__[newSystemIndex];
        var newType = newType || 'batting';
        var components = newSystem.system[newType + '_fields'];

        var newState = {
            currentSystem: newSystem,
            currentType: newType,
            selectedComponents: _.valueMap(components, true),
            scoredComponents: {}
        };

        if( _(this._state).isEmpty() )
            newState = _.extend(this.getInitialState(newSystemIndex, newType),
                                newState);

        /* update weights and measures */
        /* ... */

        this.set(newState, {silent: true});

        this.trigger(Flags.systemReady);
    }
});
