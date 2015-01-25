/* toggle element for a single component */
var ComponentView = Backbone.View.extend({
    defaultEnabled: true,
    defaultScored: false,

    template: _.template(
        '<li>'+
        '  <label>' +
        '    <%= label %>' +
        '  </label>' +
        '  <label>' +
        '    <input type="checkbox" data-type="scored" /> Score?' +
        '    <input class="component-weight" type="number" value="<%= value %>" />' +
        '  </label>' +
        '  <label>' +
        '    <input type="checkbox" data-type="enalbed" checked="checked" /> Display?' +
        '  </label>' +
        '</li>'
    ),

    initialize: function(opts) {
        _(this).bindAll('render', 'onToggle');

        this.parent = opts.parent;
        this.componentName = opts.componentName;
        this.enabled = opts.enabled || this.defaultEnabled;

        this.render();
    },

    render: function() {
        var label = ComponentMap[projectionStore.get('currentType')][this.componentName].label;

        var el = this.template({
            name: this.componentName,
            label: label,
            value: 1
        });

        this.setElement(el);
        this.$el.on('click', 'input[type="checkbox"]', this.onToggle);
        return this;
    },

    onToggle: function(evt) {
        this.enabled = evt.target.checked;
    }
});

var ComponentSelectionView = Backbone.View.extend({
    initialize: function() {
        _(this).bindAll('render', 'onUpdateComponentInfo');

        this.componentViews = [];
        this.$components = this.$('ul');
        this.$commit = this.$('button');

        this.$commit.click(this.onUpdateComponentInfo);

        projectionStore.on(Flags.systemReady, this.render);
    },

    /* renders toggles for all components projected by the current system */
    render: function() {
        var system = projectionStore.get('currentSystem');
        var fields = system.system.batting_fields;
 
        _(fields).each(function(component) {
            var view = new ComponentView({componentName: component, parent: this});
            this.componentViews.push(view);
            this.$components.append( view.el );
        }.bind(this));
    },

    /* informs global state of which components to display */
    onUpdateComponentInfo: function(component, state) {
        var selectedComponents = projectionStore.get('selectedComponents');
        _(this.componentViews).each(function(view) {
            selectedComponents[view.componentName] = view.enabled;
        });
        projectionStore.set({selectedComponents: selectedComponents});
    }
});

var TableView = Backbone.View.extend({
    textFilter: '',

    initialize: function() {
        _(this).bindAll('render', 'onQualified', 'onFilterByText');

        this.$('#qualified-only').click(this.onQualified);
        this.$('input').keyup( _(this.onFilterByText).debounce(100) );

        projectionStore.on(Flags.systemReady, this.render);
        projectionStore.on(Flags.stateChange, this.render);
    },

    /* renders large data table--
       note: we dip down to raw dom operations for speed */
    render: function() {
        var system = projectionStore.get('currentSystem');
        var type = projectionStore.get('currentType');
        var selectedComponents = projectionStore.get('selectedComponents');
        var qualifiedOnly = projectionStore.get('qualifiedOnly');

        /* remove table */
        var oldTable = this.el.getElementsByTagName('table')[0];
        this.el.removeChild(oldTable);

        /* create brand new table */
        var newTable = document.createElement('table');

        /* which fields will we display? */
        var typeFields = _(selectedComponents).keysWithValue(true);

        /* create header row */
        var headerRow = document.createElement('tr');
        var playerNameHeader = document.createElement('th');
        playerNameHeader.textContent = 'Player';
        headerRow.appendChild(playerNameHeader);

        _(typeFields).each(function(componentName) {
            var td = document.createElement('th');
            var label = ComponentMap[projectionStore.get('currentType')][componentName].label;
            td.textContent = label;
            headerRow.appendChild(td);
        });

        var thead = document.createElement('thead');
        thead.appendChild(headerRow);
        newTable.appendChild(thead);

        var tbody = document.createElement('tbody');

        /* create table body */
        _(system.batting_projections).each(function(ppro) {
            if(qualifiedOnly && ppro['s_pa'] < 100)
                return false;

            if(this.textFilter != ''
               && ppro.player.name.toLowerCase().indexOf(this.textFilter.toLowerCase()) == -1)
                return false;

            var row = document.createElement('tr');
            var playerNameEl = document.createElement('td');
            playerNameEl.textContent = ppro.player.name;
            row.appendChild(playerNameEl);

            _(typeFields).each(function(component) {
                var td = document.createElement('td');
                td.textContent = ppro[component];
                row.appendChild(td);
            });

            tbody.appendChild(row);
        }.bind(this));

        newTable.appendChild(tbody);

        this.el.appendChild(newTable);
    },

    onFilterByText: function(evt) {
        this.textFilter = evt.target.value;
        this.render();
    },

    onQualified: function() {
        var qualifiedOnly = projectionStore.get('qualifiedOnly');
        projectionStore.set({qualifiedOnly: !qualifiedOnly});
    }
});

var App = function() {
    this.init();
}

App.prototype.init = function() {
    this.componentSelectionView = new ComponentSelectionView({el: $('#components')});
    this.tableView = new TableView({el: $('#app')});

    // store.reset(__data__);
    projectionStore.loadSystem(0, 'batting');
}

$(function() {
    new App();
});
