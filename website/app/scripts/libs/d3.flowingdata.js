function Flowing() {
    /** Configuration vars */
    this.configuration = {
        container: '#charts',
        container_header: '#charts_header',
        container_year: '#yearvalue',
        canvas: { width: 1000, height: 0, margin: { top: 10, right: 10, bottom: 10, left: 10 } },
        items: { width: 180, height: 90, margin: { top: 5, right: 5, bottom: 5, left: 5 }, width_full: 180, height_full: 100 },
        scale_factor: .8,
        rows: 6,
        columns: 6,
        minimum:10
    };

    /** Data vars */
    this.data = {
        source: null,
        groups: {},
        items: null,
        start_year: 0,
        end_year: 0,
        subgroup: []
    };

    /** Interpolation functions */
    this.interpolation = {
        x0: null,
        y0: null,
        x: null,
        y: null,
        color: null,
        color_subgroup: null
    };

    this.controls = {
        focus: null,
        paused: false,
        current_year: 0,
        speed: 2000
    };

    this.events = {
        mouseover: null,
        mouseout: null,
        mouseclick: null,
        mousemove: null
    };

    /** Tools functions */
    this.tools = {
        bisectYear: null,
        numberFormat: null,
        area: null,
        line: null,
        resort: null,
        timer: null,
        started: false,
        id: null,

    }
}

Flowing.prototype.dispose = function () {
    if(this.controls.id!=null)
        clearTimeout(this.controls.id);
}


/** Built all data structure require by graphic from data */
Flowing.prototype.compile = function () {
    // Init fields
    var that = this;
    this.data.groups = {};
    this.data.subgroup= [];
    // Get a list of all columns' names from the file source. It omit the field year
    var fields = d3.keys(this.data.source[0]).filter(function (key) { return key !== "year"; });
    // Mapping values to data structure. In this mapping get values for every item of the group
    this.data.items = fields.map(function (fname, i) {
        // Split the field name to get the master group and its categories
        var words = fname.split("_");
        // Get the group's name
        var group = words[0];
        // Get subgroup
        var subgroup = words.slice(1, words.length).join("_");
        if(that.data.subgroup.indexOf(subgroup) < 0)
            that.data.subgroup.push(subgroup);
        // Get printable name
        var real_name = words.slice(1, words.length).join(" ");
        // Return data structure
        return {
            field: real_name,
            group: group,
            subgroup: subgroup,
            // Get all rows only from the column required
            values: that.data.source.map(function (d) {
                return { year: parseInt(d.year), value: parseFloat(d[fname]) };
            })
        };
    });

    this.data.items = this.data.items.filter(function(item){
        return  d3.max(item.values, function(d){ return d.value}) >= that.configuration.minimum;
    }); 

    // Select start year
    this.data.start_year = parseInt(d3.min(this.data.source, function (d) { return d['year']; }));
    this.data.end_year = parseInt(d3.max(this.data.source, function (d) { return d['year']; }));
    this.controls.current_year = this.data.start_year;

    // Max for each item    
    this.data.items.forEach(function (f) {
        f.max = d3.max(f.values, function (d) { return d.value; });
        // This approaches the cycle and make categories with maximums
        if (that.data.groups[f.group] == null) {
            var json = {};
            json[f.group] = { 'max': f.max };
            that.data.groups[f.group] = { 'max': f.max };
        }
        else if (that.data.groups[f.group].max < f.max) {
            that.data.groups[f.group].max = f.max;
        }
    });
}
/** Initialize all components for the graphic */
Flowing.prototype.init = function () {  
    var that = this;  
    // Init the container
    var div = document.getElementById(this.configuration.container.replace('#', ''));
    this.configuration.canvas.width = div.clientWidth * .99;
    // Set the items size
    var keys = Object.keys(this.data.groups);
    this.configuration.columns = keys.length;
    this.configuration.items.width_full = this.configuration.canvas.width / this.configuration.columns;
    var items_margin_right = this.configuration.items.margin.right;
    var items_margin_left = this.configuration.items.margin.left;
    this.configuration.items.width = this.configuration.items.width_full - items_margin_right - items_margin_left;

    // Set the interpolation values    
    var max = this.configuration.canvas.width - this.configuration.items.width_full - (items_margin_right + items_margin_left);
    this.interpolation.x0 = d3.scale.ordinal().rangeRoundPoints([0, max]).domain(keys);
    var height_max = (this.configuration.items.height_full * keys.length) * 1.8;
    this.interpolation.y0 = d3.scale.ordinal().domain(d3.range(keys.length)).rangeRoundPoints([0, height_max]);
    this.interpolation.x = d3.scale.linear().range([0, this.configuration.items.width]);
    this.interpolation.y = d3.scale.linear().range([this.configuration.items.height, 0]);
    // Min and Max year for the x domain
    this.interpolation.x.domain([
        d3.min(this.data.items, function (s) { return s.values[0].year; }),
        d3.max(this.data.items, function (s) { return s.values[s.values.length - 1].year; })
    ]);
    this.interpolation.color = d3.scale.ordinal().domain(keys)
        .range(["#ec3c3c", "#77ec3c", "#3cece9", "#3c3cec", "#c63cec", "#ec3c82"]);
    //this.interpolation.color_subgroup = d3.scale.category20().domain(this.data.subgroup);
    var colors = 'A8D1D7 F3928E CC97AD CBB7AE 89A5C6 F9E061 D2CC6E 979797 FFC265 BEC7C2 7EC1A6'.split(' ').map(function (c) { return '#' + c; });
    this.interpolation.color_subgroup = d3.scale.ordinal().domain(this.data.subgroup).range(colors);

    // Init the tools 
    this.tools.bisectYear = d3.bisector(function (d) { return d.year; }).left;
    this.tools.numberFormat = d3.format(".1f");

    this.tools.area = d3.svg.area()
        .x(function (d) { return that.interpolation.x(d.year); })
        .y0(this.configuration.items.height)
        .y1(function (d) { return that.interpolation.y(d.value * that.configuration.scale_factor); });

    this.tools.line = d3.svg.line()
        .x(function (d) { return that.interpolation.x(d.year); })
        .y(function (d) { return that.interpolation.y(d.value * that.configuration.scale_factor); });

    // Controls
    this.controls.speed = 2000;
    this.controls.started = false;
    this.controls.id= null;
}

/** Render */
Flowing.prototype.render = function () {
    var that = this;

    // Clear before executions
    this.dispose();

    // Compile data
    this.compile();

    // Init configurations and Controls
    this.init();

    // Start chart for each item
    var svg_header = d3.select(this.configuration.container_header).selectAll("svg")
        .data(Object.keys(this.data.groups))
        .enter().append("svg")
        .attr("width", this.configuration.items.width_full)
        .attr("height", 30)
        .style("left", function (d, i) { return that.interpolation.x0(d) + "px"; })
        .append("text")
        .attr("dy", "1.1em")
        .attr("dx", "0.4em")
        .text(function (d) { var title = d.charAt(0).toUpperCase() + d.slice(1); return title.replaceAll('-', ' '); })
        .attr("transform", "translate(" + that.configuration.items.margin.left + "," + that.configuration.items.margin.top + ")");

    var svg = d3.select(this.configuration.container).selectAll("svg")
        .data(this.data.items)
        .enter().append("svg")
        .attr("id", function (d) { return d.field; })
        .attr("class", function (d) { return d.group; })
        .attr("width", this.configuration.items.width_full)
        .attr("height", this.configuration.items.height_full)
        .style("left", function (d, i) { return that.interpolation.x0(d.group) + "px"; })
        .append("g")
        .attr("transform", "translate(" + that.configuration.items.margin.left + "," + that.configuration.items.margin.top + ")");

    svg.append("rect")
        .attr("class", "chartbg")
        .attr("width", this.configuration.items.width)
        .attr("height", this.configuration.items.height);

    svg.append("path")
        .attr("class", "area")
        .style("fill", function (d) { return that.interpolation.color_subgroup(d.subgroup); })
        .attr("d", function (d) {
            that.interpolation.y.domain([0, that.data.groups[d.group].max]);
            return that.tools.area(d.values);
        });

    svg.append("path")
        .attr("class", "line")
        .attr("d", function (d) {
            that.interpolation.y.domain([0, that.data.groups[d.group].max]);
            return that.tools.line(d.values);
        });
    svg.append("text")
        .attr("class", "item_title")
        .attr("dy", "1.1em")
        .attr("dx", "0.4em")
        .text(function (d) { return d.field.charAt(0).toUpperCase() + d.field.slice(1); });

    // Focusing on mouseovers
    this.controls.focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");
    this.controls.focus.append("circle")
        .attr("class", "marker")
        .attr("r", 3);
    this.controls.focus.append("text")
        .attr("class", "value")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.5em");

    // Reording 
    this.tools.resort = function () {

        var year_index = that.controls.current_year - that.data.start_year;

        Object.keys(that.data.groups).forEach(function (grp, i) {

            var partial_domain = that.data.items.filter(function (d) { return d.group == grp; })
                .sort(function (a, b) { return d3.descending(a.values[year_index].value, b.values[year_index].value); })
                .map(function (d, i) { return d.field; });

            var num_left = that.configuration.columns - partial_domain.length;

            var full_domain = num_left > 0 ? partial_domain.concat(d3.range(num_left)) : partial_domain;
            
            var y1 = that.interpolation.y0.domain(full_domain).copy();

            
            var height_max = (that.configuration.items.height_full * full_domain.length) * 1.8;
            y1.rangeRoundPoints([0, height_max]);

            d3.select(that.configuration.container).selectAll("svg." + grp)
                .sort(function (a, b) { return y1(a.field) - y1(b.field); });

            var transition = d3.select(that.configuration.container).transition().duration(that.controls.speed),
                delay = function (d, i) { return i * 50; };

            transition.selectAll("svg." + grp)
                .delay(delay)
                .style("top", function (d) {  return y1(d.field) + "px"; });

        });
    }

    this.tools.timer = function () {        
        if (!that.controls.paused) {            
            that.controls.current_year += 1;
            d3.select(that.configuration.container_year).text(that.controls.current_year);

            // Resort accordingly
            that.tools.resort();

            // Tick focus markers
            that.controls.focus.style("display", null);
            var index = 0;

            that.controls.focus.select("circle")
                .attr("cx", that.interpolation.x(that.controls.current_year))
                .attr("cy", function (d) {
                    index = that.tools.bisectYear(d.values, that.controls.current_year, 1);
                    that.interpolation.y.domain([0, that.data.groups[d.group].max]);
                    return that.interpolation.y(d.values[index].value * that.configuration.scale_factor);
                });
            that.controls.focus.select("text")
                .attr("x", that.interpolation.x(that.controls.current_year))
                .attr("y", function (d) {
                    that.interpolation.y.domain([0, that.data.groups[d.group].max]);
                    return that.interpolation.y(d.values[index].value * that.configuration.scale_factor);
                })
                .text(function (d) { return that.tools.numberFormat(d.values[index].value); });

            // Go again.
            if (that.controls.current_year == that.data.end_year) {
                that.controls.current_year = that.data.start_year;
            }
            if(!that.controls.started)
                that.controls.id = setTimeout(that.tools.timer, that.controls.speed );
        }
    }

    // Events
    this.events.mouseover = function () {
        if (that.controls.paused) {
            that.controls.focus.style("display", null);
        }
    }
    this.events.mouseout = function () {
        if (that.controls.paused) {
            that.controls.focus.style("display", "none");
            d3.select(that.configuration.container_year).text(that.controls.current_year);
        }
    }
    this.events.mouseclick = function () {
        if (that.controls.paused) {
            var xmove = that.interpolation.x.invert(d3.mouse(this)[0]);
            var index = that.tools.bisectYear(that.controls.focus.datum().values, xmove, 1);
            that.tools.current_year = that.controls.start_year + index;
            that.tools.resort();
        }
    }
    this.events.mousemove = function () {
        if (that.controls.paused) {
            var xmove = that.interpolation.x.invert(d3.mouse(this)[0]);
            var index = 0;

            that.controls.focus.select("circle")
                .attr("cx", that.interpolation.x(xmove))
                .attr("cy", function (d) {
                    index = that.tools.bisectYear(d.values, xmove, 1);
                    d3.select(that.configuration.container_year).text(that.data.start_year + index);
                    //this.interpolation.y.domain([0, d.max * this.configuration.scale_factor]);
                    that.interpolation.y.domain([0, that.data.groups[d.group].max]);
                    return that.interpolation.y(d.values[index].value * that.configuration.scale_factor);
                });
            that.controls.focus.select("text")
                .attr("x", that.interpolation.x(xmove))
                .attr("y", function (d) {
                    that.interpolation.y.domain([0, that.data.groups[d.group].max]);
                    return that.interpolation.y(d.values[index].value * that.configuration.scale_factor);
                })
                .text(function (d) {
                    return that.tools.numberFormat(d.values[index].value);
                });
        }
    }

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", this.configuration.items.width)
        .attr("height", this.configuration.items.height)
        .on("mouseover", this.events.mouseover)
        .on("mouseout", this.events.mouseout)
        .on("mousemove", this.events.mousemove)
        .on("click", this.events.mouseclick);

    // Speed control buttons
    d3.selectAll("#sourcecontrol .button").on("click", function () {
        d3.select("#sourcecontrol .current").classed("current", false);
        d3.select(this).classed("current", true);
    });

    d3.selectAll("#speedcontrol .button").on("click", function () {
        var speed = d3.select(this).attr("data-speed");
        d3.select("#speedcontrol .current").classed("current", false);
        d3.select(this).classed("current", true);

        if (speed == "pause") {
            that.controls.paused = true;
        } else {
            that.controls.speed = +speed;
            if (that.controls.paused) {
                that.controls.paused = false;
                that.tools.timer();
            }
        }
    });

    this.tools.resort();
    this.tools.timer();
}
