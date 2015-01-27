/* toggle element for a single component */
var ComponentView = Backbone.View.extend({
    template: _.template(
        '<li>'+
        '  <label>' +
        '    <%= label %>' +
        '  </label>' +
        '  <label>' +
        '    <input type="checkbox" data-type="scored" /> Score?' +
        '    <input class="component-weight" data-type="points" type="number" value="<%= value %>" />' +
        '  </label>' +
        '  <label>' +
        '    <input type="checkbox" data-type="enabled" <% if(enabled) { %>checked="checked"<% } %> /> Display?' +
        '  </label>' +
        '</li>'
    ),

    initialize: function(opts) {
        _(this).bindAll('render', 'onToggle');

        this.componentName = opts.componentName;
        this.enabled = opts.enabled;
        this.scored = false;
        this.points = 1;

        this.render();
    },

    render: function() {
        var label = ComponentMap[projectionStore.get('currentType')][this.componentName].label;

        var el = this.template({
            name: this.componentName,
            label: label,
            value: 1,
            enabled: this.enabled
        });

        this.setElement(el);
        this.$el.on('change', this.onToggle);
        return this;
    },

    onToggle: function(evt) {
        this.enabled = this.$('[data-type="enabled"]').prop('checked');
        this.scored = this.$('[data-type="scored"]').prop('checked');
        this.points = this.$('[data-type="points"]').val();
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
        var type = projectionStore.get('currentType');
        var fields = system.system[type + '_fields'];
        var selectedComponents = projectionStore.get('selectedComponents');
 
        _(fields).each(function(componentName, i) {
            var view = new ComponentView({
                componentName: componentName,
                enabled: _(selectedComponents).contains(componentName)
            });

            this.$components.append(view.el);
            this.componentViews.push(view);
        }.bind(this));
    },

    /* informs global state of which components to display */
    onUpdateComponentInfo: function(component, state) {
        var selectedComponents = [];
        var scoredComponents = [];

        _(this.componentViews).each(function(view) {
            if(view.enabled)
                selectedComponents.push(view.componentName);

            if(view.scored)
                scoredComponents.push(view.componentName);
        });

        projectionStore.set({
            selectedComponents: selectedComponents,
            scoredComponents: scoredComponents
        });
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
        var scoredComponents = projectionStore.get('scoredComponents');
        var projections = projectionStore.getProjections();

        /* remove table */
        var oldTable = this.el.getElementsByTagName('table')[0];
        this.el.removeChild(oldTable);

        /* create brand new table */
        var newTable = document.createElement('table');

        /* create header row */
        var headerRow = document.createElement('tr');
        var playerNameHeader = document.createElement('th');
        playerNameHeader.textContent = 'Player';
        headerRow.appendChild(playerNameHeader);

        _(selectedComponents).each(function(componentName) {
            var th = document.createElement('th');
            var label = ComponentMap[type][componentName].label;
            th.textContent = label;
            headerRow.appendChild(th);
        });

        if(scoredComponents.length > 0) {
            var zValueTh = document.createElement('th');
            zValueTh.textContent = 'Value';
            headerRow.appendChild(zValueTh);
        }

        var thead = document.createElement('thead');
        thead.appendChild(headerRow);
        newTable.appendChild(thead);

        var tbody = document.createElement('tbody');

        /* create table body */
        _(projections).each(function(ppro) {
            if(this.textFilter != ''
               && ppro.player.name.toLowerCase().indexOf(this.textFilter.toLowerCase()) == -1)
                return false;

            var row = document.createElement('tr');
            var playerNameEl = document.createElement('td');
            playerNameEl.textContent = ppro.player.name;
            row.appendChild(playerNameEl);

            _(selectedComponents).each(function(component) {
                var td = document.createElement('td');
                td.textContent = ppro[component];
                row.appendChild(td);
            });

            if(scoredComponents.length > 0) {
                var zValueTd = document.createElement('td');
                zValueTd.textContent = ppro.zValue;
                row.appendChild(zValueTd);
            }

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
