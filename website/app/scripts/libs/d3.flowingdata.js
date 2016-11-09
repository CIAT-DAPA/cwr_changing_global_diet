var D3Graphics = D3Graphics || {};

// Global namespace
D3Graphics.Flowing = D3Graphics.Flowing || {};

/** Configuration vars */
D3Graphics.Flowing.configuration = {
    container: '',
    container_header: '',
    container_year: '',
    max_columns: 6,
    canvas: { width: 1000, height: 0, margin: { top: 10, right: 10, bottom: 10, left: 10 } },
    items: { width: 180, height: 90, margin: { top: 5, right: 5, bottom: 5, left: 5 }, width_full: 180, height_full: 100 },
    scale_factor: 1,
    rows: 6,
    columns: 6
}

/** Data vars */
D3Graphics.Flowing.data = {
    source: null,
    groups: {},
    items: null,
    start_year: 0,
    end_year: 0,
    subgroup: []
}

/** Interpolation functions */
D3Graphics.Flowing.interpolation = {
    x0: null,
    y0: null,
    x: null,
    y: null,
    color: null,
    color_subgroup: null
}

D3Graphics.Flowing.controls = {
    focus: null,
    paused: false,
    current_year: 0,
    speed: 750,
    scale: 'group'
}

D3Graphics.Flowing.events = {
    mouseover: null,
    mouseout: null,
    mouseclick: null,
    mousemove: null
}

/** Tools functions */
D3Graphics.Flowing.tools = {
    bisectYear: null,
    numberFormat: null,
    area: null,
    line: null,
    resort: null,
    timer: null,
    rescale: null
}

/** Built all data structure require by graphic from data */
D3Graphics.Flowing.compile = function () {
    // Init fields
    D3Graphics.Flowing.data.groups = {};
    D3Graphics.Flowing.data.subgroup= [];
    // Get a list of all columns' names from the file source. It omit the field year
    var fields = d3.keys(D3Graphics.Flowing.data.source[0]).filter(function (key) { return key !== "year"; });
    // Mapping values to data structure. In this mapping get values for every item of the group
    D3Graphics.Flowing.data.items = fields.map(function (fname, i) {
        // Split the field name to get the master group and its categories
        var words = fname.split("_");
        // Get the group's name
        var group = words[0];
        // Get subgroup
        var subgroup = words.slice(1, words.length).join("_");
        if(D3Graphics.Flowing.data.subgroup.indexOf(subgroup) < 0)
            D3Graphics.Flowing.data.subgroup.push(subgroup);
        // Get printable name
        var real_name = words.slice(1, words.length).join(" ");
        // Return data structure
        return {
            field: real_name,
            group: group,
            subgroup: subgroup,
            // Get all rows only from the column required
            values: D3Graphics.Flowing.data.source.map(function (d) {
                return { year: parseInt(d.year), value: parseFloat(d[fname]) };
            })
        };
    });

    // Select start year
    D3Graphics.Flowing.data.start_year = parseInt(d3.min(D3Graphics.Flowing.data.source, function (d) { return d['year']; }));
    D3Graphics.Flowing.data.end_year = parseInt(d3.max(D3Graphics.Flowing.data.source, function (d) { return d['year']; }));
    D3Graphics.Flowing.controls.current_year = D3Graphics.Flowing.data.start_year;

    // Max for each item    
    D3Graphics.Flowing.data.items.forEach(function (f) {
        f.max = d3.max(f.values, function (d) { return d.value; });
        // This approaches the cycle and make categories with maximums
        if (D3Graphics.Flowing.data.groups[f.group] == null) {
            var json = {};
            json[f.group] = { 'max': f.max };
            D3Graphics.Flowing.data.groups[f.group] = { 'max': f.max };
        }
        else if (D3Graphics.Flowing.data.groups[f.group].max < f.max) {
            D3Graphics.Flowing.data.groups[f.group].max = f.max;
        }
    });
}

/** Initialize all components for the graphic */
D3Graphics.Flowing.init = function () {
    // Init the container
    var div = document.getElementById(D3Graphics.Flowing.configuration.container.replace('#', ''));
    D3Graphics.Flowing.configuration.canvas.width = div.clientWidth * .99;
    // Set the items size
    D3Graphics.Flowing.configuration.items.width_full = D3Graphics.Flowing.configuration.canvas.width / D3Graphics.Flowing.configuration.max_columns;
    var items_margin_right = D3Graphics.Flowing.configuration.items.margin.right;
    var items_margin_left = D3Graphics.Flowing.configuration.items.margin.left;
    D3Graphics.Flowing.configuration.items.width = D3Graphics.Flowing.configuration.items.width_full - items_margin_right - items_margin_left;

    // Set the interpolation values    
    var keys = Object.keys(D3Graphics.Flowing.data.groups);
    D3Graphics.Flowing.configuration.columns = keys.length;
    var max = D3Graphics.Flowing.configuration.canvas.width - D3Graphics.Flowing.configuration.items.width_full - (items_margin_right + items_margin_left);
    D3Graphics.Flowing.interpolation.x0 = d3.scale.ordinal().rangeRoundPoints([0, max]).domain(keys);
    var height_max = (D3Graphics.Flowing.configuration.items.height_full * keys.length) * 1.8;
    D3Graphics.Flowing.interpolation.y0 = d3.scale.ordinal().domain(d3.range(keys.length)).rangeRoundPoints([0, height_max]);
    D3Graphics.Flowing.interpolation.x = d3.scale.linear().range([0, D3Graphics.Flowing.configuration.items.width]);
    D3Graphics.Flowing.interpolation.y = d3.scale.linear().range([D3Graphics.Flowing.configuration.items.height, 0]);
    // Min and Max year for the x domain
    D3Graphics.Flowing.interpolation.x.domain([
        d3.min(D3Graphics.Flowing.data.items, function (s) { return s.values[0].year; }),
        d3.max(D3Graphics.Flowing.data.items, function (s) { return s.values[s.values.length - 1].year; })
    ]);
    D3Graphics.Flowing.interpolation.color = d3.scale.ordinal().domain(keys)
                                                .range(["#ec3c3c", "#77ec3c", "#3cece9", "#3c3cec", "#c63cec", "#ec3c82"]);    
    D3Graphics.Flowing.interpolation.color_subgroup = d3.scale.category20().domain(D3Graphics.Flowing.data.subgroup);
    //var colors = 'FF0000 FF4500 EE4000 CD3700 CD0000 8B0000 A2CD5A 66CD00 458B00 228B22 006400 EED5B7 CDAA7D 8B7355 8B4513 EEC900 00BFFF 1E90FF 1C86EE 104E8B 0000CD FFA500 FF8C00'.split(' ').map(function (c) { return '#' + c; });
    //D3Graphics.Flowing.interpolation.color_subgroup = d3.scale.ordinal().domain(D3Graphics.Flowing.data.subgroup).range(colors);

    // Init the tools 
    D3Graphics.Flowing.tools.bisectYear = d3.bisector(function (d) { return d.year; }).left;
    D3Graphics.Flowing.tools.numberFormat = d3.format(".1f");

    D3Graphics.Flowing.tools.area = d3.svg.area()
        .x(function (d) { return D3Graphics.Flowing.interpolation.x(d.year); })
        .y0(D3Graphics.Flowing.configuration.items.height)
        .y1(function (d) { return D3Graphics.Flowing.interpolation.y(d.value); });

    D3Graphics.Flowing.tools.line = d3.svg.line()
        .x(function (d) { return D3Graphics.Flowing.interpolation.x(d.year); })
        .y(function (d) { return D3Graphics.Flowing.interpolation.y(d.value); });
    
    // Controls
    D3Graphics.Flowing.controls.speed = 750;
}

/** Render */
D3Graphics.Flowing.render = function () {
    // Compile data
    D3Graphics.Flowing.compile();

    // Init configurations and Controls
    D3Graphics.Flowing.init();
    
    
    // Start chart for each item
    var svg_header = d3.select(D3Graphics.Flowing.configuration.container_header).selectAll("svg")
        .data(Object.keys(D3Graphics.Flowing.data.groups))
        .enter().append("svg")
        .attr("width", D3Graphics.Flowing.configuration.items.width_full)
        .attr("height", 30)
        .style("left", function (d, i) { return D3Graphics.Flowing.interpolation.x0(d) + "px"; })
        .append("text")
        .attr("dy", "1.1em")
        .attr("dx", "0.4em")
        .text(function (d) { var title = d.charAt(0).toUpperCase() + d.slice(1); return title.replaceAll('-',' '); })
        .attr("transform", "translate(" + D3Graphics.Flowing.configuration.items.margin.left + "," + D3Graphics.Flowing.configuration.items.margin.top + ")");

    var svg = d3.select(D3Graphics.Flowing.configuration.container).selectAll("svg")
        .data(D3Graphics.Flowing.data.items)
        .enter().append("svg")
        .attr("id", function (d) { return d.field; })
        .attr("class", function (d) { return d.group; })
        .attr("width", D3Graphics.Flowing.configuration.items.width_full)
        .attr("height", D3Graphics.Flowing.configuration.items.height_full)
        .style("left", function (d, i) { return D3Graphics.Flowing.interpolation.x0(d.group) + "px"; })
        .append("g")
        .attr("transform", "translate(" + D3Graphics.Flowing.configuration.items.margin.left + "," + D3Graphics.Flowing.configuration.items.margin.top + ")");

    svg.append("rect")
        .attr("class", "chartbg")
        .attr("width", D3Graphics.Flowing.configuration.items.width)
        .attr("height", D3Graphics.Flowing.configuration.items.height);

    svg.append("path")
        .attr("class", "area")
        .style("fill", function (d) { return D3Graphics.Flowing.interpolation.color_subgroup(d.subgroup); })
        .attr("d", function (d) {
            D3Graphics.Flowing.interpolation.y.domain([0, D3Graphics.Flowing.data.groups[d.group].max]);
            return D3Graphics.Flowing.tools.area(d.values);
        });

    svg.append("path")
        .attr("class", "line")
        .attr("d", function (d) {
            D3Graphics.Flowing.interpolation.y.domain([0, D3Graphics.Flowing.data.groups[d.group].max]);
            return D3Graphics.Flowing.tools.line(d.values);
        });
    svg.append("text")
        .attr("class", "foodname")
        .attr("dy", "1.1em")
        .attr("dx", "0.4em")
        .text(function (d) { return d.field.charAt(0).toUpperCase() + d.field.slice(1); });

    // Focusing on mouseovers
    D3Graphics.Flowing.controls.focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");
    D3Graphics.Flowing.controls.focus.append("circle")
        .attr("class", "marker")
        .attr("r", 3);
    D3Graphics.Flowing.controls.focus.append("text")
        .attr("class", "value")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.5em");
    
    // Reording 
    D3Graphics.Flowing.tools.resort = function () {

        var year_index = D3Graphics.Flowing.controls.current_year - D3Graphics.Flowing.data.start_year;
        
        Object.keys(D3Graphics.Flowing.data.groups).forEach(function (grp, i) {

            var partial_domain = D3Graphics.Flowing.data.items.filter(function (d) { return d.group == grp; })
                .sort(function (a, b) { return d3.descending(a.values[year_index].value, b.values[year_index].value); })
                .map(function (d, i) { return d.field; });

            var num_left = D3Graphics.Flowing.configuration.columns - partial_domain.length;

            var full_domain = num_left > 0 ? partial_domain.concat(d3.range(num_left)) : partial_domain;

            var y1 = D3Graphics.Flowing.interpolation.y0.domain(full_domain).copy();

            d3.select(D3Graphics.Flowing.configuration.container).selectAll("svg." + grp)
                .sort(function (a, b) { return y1(a.field) - y1(b.field); });

            var transition = d3.select(D3Graphics.Flowing.configuration.container).transition().duration(D3Graphics.Flowing.controls.speed),
                delay = function (d, i) { return i * 50; };            
            
            transition.selectAll("svg." + grp)
                .delay(delay)
                .style("top", function (d) { return y1(d.field) + "px"; });

        });
    }

    D3Graphics.Flowing.tools.timer = function () {
        if (!D3Graphics.Flowing.controls.paused) {
            D3Graphics.Flowing.controls.current_year += 1;
            d3.select(D3Graphics.Flowing.configuration.container_year).text(D3Graphics.Flowing.controls.current_year);

            // Resort accordingly
            D3Graphics.Flowing.tools.resort();

            // Tick focus markers
            D3Graphics.Flowing.controls.focus.style("display", null);
            var index = 0;

            D3Graphics.Flowing.controls.focus.select("circle")
                .attr("cx", D3Graphics.Flowing.interpolation.x(D3Graphics.Flowing.controls.current_year))
                .attr("cy", function (d) {
                    index = D3Graphics.Flowing.tools.bisectYear(d.values, D3Graphics.Flowing.controls.current_year, 1);
                    //D3Graphics.Flowing.interpolation.y.domain([0, d.max * D3Graphics.Flowing.configuration.scale_factor]);
                    D3Graphics.Flowing.interpolation.y.domain([0, D3Graphics.Flowing.data.groups[d.group].max * D3Graphics.Flowing.configuration.scale_factor]);
                    return D3Graphics.Flowing.interpolation.y(d.values[index].value);
                });
            D3Graphics.Flowing.controls.focus.select("text")
                .attr("x", D3Graphics.Flowing.interpolation.x(D3Graphics.Flowing.controls.current_year))
                .attr("y", function (d) {
                    //D3Graphics.Flowing.interpolation.y.domain([0, d.max * D3Graphics.Flowing.configuration.scale_factor]);
                    D3Graphics.Flowing.interpolation.y.domain([0, D3Graphics.Flowing.data.groups[d.group].max * D3Graphics.Flowing.configuration.scale_factor]);
                    return D3Graphics.Flowing.interpolation.y(d.values[index].value);
                })
                .text(function (d) { return D3Graphics.Flowing.tools.numberFormat(d.values[index].value); });

            // Go again.
            if (D3Graphics.Flowing.controls.current_year == D3Graphics.Flowing.data.end_year) {
                D3Graphics.Flowing.controls.current_year = D3Graphics.Flowing.data.start_year;
                setTimeout(D3Graphics.Flowing.tools.timer, D3Graphics.Flowing.controls.speed * 5);
            }
            else {
                setTimeout(D3Graphics.Flowing.tools.timer, D3Graphics.Flowing.controls.speed);
            }
        }
    }
/*
    D3Graphics.Flowing.tools.rescale = function () {
        var index = D3Graphics.Flowing.controls.current_year - D3Graphics.Flowing.data.start_year;
        svg.select("path.area")
            .transition()
            .duration(600)
            .attr("d", function (d) {
                D3Graphics.Flowing.interpolation.y.domain([0, d.max * D3Graphics.Flowing.configuration.scale_factor]);
                return D3Graphics.Flowing.tools.area(d.values);
            });
        svg.select("path.line")
            .transition()
            .duration(600)
            .attr("d", function (d) {
                D3Graphics.Flowing.interpolation.y.domain([0, d.max * D3Graphics.Flowing.configuration.scale_factor]);
                return D3Graphics.Flowing.tools.line(d.values);
            });

        D3Graphics.Flowing.controls.focus.select("circle")
            .transition()
            .duration(600)
            .attr("cy", function (d) {
                D3Graphics.Flowing.interpolation.y.domain([0, d.max * D3Graphics.Flowing.configuration.scale_factor]);
                return D3Graphics.Flowing.interpolation.y(d.values[index].value);
            });
        D3Graphics.Flowing.controls.focus.select("text")
            .transition()
            .duration(600)
            .attr("y", function (d) {
                D3Graphics.Flowing.interpolation.y.domain([0, d.max * D3Graphics.Flowing.configuration.scale_factor]);
                return D3Graphics.Flowing.interpolation.y(d.values[index].value);
            });
    }
*/
    // Events
    D3Graphics.Flowing.events.mouseover = function () {
        if (D3Graphics.Flowing.controls.paused) {
            D3Graphics.Flowing.controls.focus.style("display", null);
        }
    }
    D3Graphics.Flowing.events.mouseout = function () {
        if (D3Graphics.Flowing.controls.paused) {
            D3Graphics.Flowing.controls.focus.style("display", "none");
            d3.select(D3Graphics.Flowing.configuration.container_year).text(D3Graphics.Flowing.controls.current_year);
        }
    }
    D3Graphics.Flowing.events.mouseclick = function () {
        if (D3Graphics.Flowing.controls.paused) {            
            var xmove = D3Graphics.Flowing.interpolation.x.invert(d3.mouse(this)[0]);
            var index = D3Graphics.Flowing.tools.bisectYear(D3Graphics.Flowing.controls.focus.datum().values, xmove, 1);
            D3Graphics.Flowing.tools.current_year = D3Graphics.Flowing.controls.start_year + index;
            D3Graphics.Flowing.tools.resort();
        }
    }
    D3Graphics.Flowing.events.mousemove = function () {
        if (D3Graphics.Flowing.controls.paused) {
            var xmove = D3Graphics.Flowing.interpolation.x.invert(d3.mouse(this)[0]);
            var index = 0;

            D3Graphics.Flowing.controls.focus.select("circle")
                .attr("cx", D3Graphics.Flowing.interpolation.x(xmove))
                .attr("cy", function (d) {
                    index = D3Graphics.Flowing.tools.bisectYear(d.values, xmove, 1);
                    d3.select(D3Graphics.Flowing.configuration.container_year).text(D3Graphics.Flowing.data.start_year + index);
                    //D3Graphics.Flowing.interpolation.y.domain([0, d.max * D3Graphics.Flowing.configuration.scale_factor]);
                    D3Graphics.Flowing.interpolation.y.domain([0, D3Graphics.Flowing.data.groups[d.group].max * D3Graphics.Flowing.configuration.scale_factor]);
                    return D3Graphics.Flowing.interpolation.y(d.values[index].value);
                });
            D3Graphics.Flowing.controls.focus.select("text")
                .attr("x", D3Graphics.Flowing.interpolation.x(xmove))
                .attr("y", function (d) {
                    D3Graphics.Flowing.interpolation.y.domain([0, D3Graphics.Flowing.data.groups[d.group].max * D3Graphics.Flowing.configuration.scale_factor]);
                    return D3Graphics.Flowing.interpolation.y(d.values[index].value);
                })
                .text(function (d) {
                    return D3Graphics.Flowing.tools.numberFormat(d.values[index].value);
                });
        }
    }

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", D3Graphics.Flowing.configuration.items.width)
        .attr("height", D3Graphics.Flowing.configuration.items.height)
        .on("mouseover", D3Graphics.Flowing.events.mouseover)
        .on("mouseout", D3Graphics.Flowing.events.mouseout)
        .on("mousemove", D3Graphics.Flowing.events.mousemove)
        .on("click", D3Graphics.Flowing.events.mouseclick);

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
            D3Graphics.Flowing.controls.paused = true;
        } else {
            D3Graphics.Flowing.controls.speed = +speed;
            if (D3Graphics.Flowing.controls.paused) {
                D3Graphics.Flowing.controls.paused = false;
                D3Graphics.Flowing.tools.timer();
            }
        }
    });

    D3Graphics.Flowing.tools.resort();
    D3Graphics.Flowing.tools.timer();
}
