var D3Graphics = D3Graphics || {};

// Global namespace
D3Graphics.Flowing = D3Graphics.Flowing || {};

/** Configuration vars */
D3Graphics.Flowing.configuration = {
    container: '',
    container_year: '#yearvalue',
    max_columns: 6,
    canvas: { width: 0, height: 0, margin: { top: 10, right: 10, bottom: 10, left: 10 } },
    items: { width: 180, height: 90, margin: { top: 10, right: 10, bottom: 10, left: 10 } },
    scale_factor = 1.4
}

/** Data vars */
D3Graphics.Flowing.data = {
    source: null,
    groups: [],
    items: null,
}

/** Interpolation functions */
D3Graphics.Flowing.interpolation = {
    x0: null,
    y0: null,
    x: null,
    y: null,
}

D3Graphics.Flowing.controls = {
    focus: null,
    paused: false,
    current_year: 0
}

D3Graphics.Flowing.events = {
    mouseover: function () {
        if (D3Graphics.Flowing.controls.paused) {
            D3Graphics.Flowing.controls.focus.style("display", null);
        }
    },
    mouseout: function () {
        if (D3Graphics.Flowing.controls.paused) {
            D3Graphics.Flowing.controls.focus.style("display", "none");
            d3.select(D3Graphics.Flowing.configuration.container_year).text(D3Graphics.Flowing.controls.current_year);
        }
    },
    mouseclick: function () {
        if (D3Graphics.Flowing.controls.paused) {
            var xmove = D3Graphics.Flowing.interpolation.x.invert(d3.mouse(this)[0]);
            var index = D3Graphics.Flowing.tools.bisectYear(focus.datum().values, xmove, 1);
            CURR_YEAR = START_YEAR + index;
            resort();
        }
    },
    mousemove: function () {
        if (D3Graphics.Flowing.controls.paused) {
            var xmove = D3Graphics.Flowing.interpolation.x.invert(d3.mouse(this)[0]);
            var index = 0;

            focus.select("circle")
                .attr("cx", D3Graphics.Flowing.interpolation.x(xmove))
                .attr("cy", function (d) {
                    index = D3Graphics.Flowing.tools.bisectYear(d.values, xmove, 1);

                    d3.select("#yearvalue").text(START_YEAR + index);

                    if (USER_SCALE == "item") {
                        y.domain([0, d.max_servings * scale_factor]);
                    } else {
                        y.domain([0, food_groups[d.food_group].max]);
                    }
                    return y(d.values[index].value);
                });
            focus.select("text")
                .attr("x", x(xmove))
                .attr("y", function (d) {
                    if (USER_SCALE == "item") {
                        y.domain([0, d.max_servings * scale_factor]);
                    } else {
                        y.domain([0, food_groups[d.food_group].max]);
                    }
                    return y(d.values[index].value);
                })
                .text(function (d) {
                    return numberFormat(d.values[index].value);
                });
        }
    }
}

/** Tools functions */
D3Graphics.Flowing.tools = {
    bisectYear: null,
    numberFormat: null,
    area: null,
    line: null,
    resort: function () {

        var year_index = CURR_YEAR - START_YEAR;

        Object.keys(food_groups).forEach(function (grp, i) {

          var partial_domain = foods.filter(function (d) {
            return d.food_group == grp;
          })
            .sort(function (a, b) {
              return d3.descending(a.values[year_index].value, b.values[year_index].value);
            })
            .map(function (d, i) { return d.field; });
          var num_left = num_rows - partial_domain.length;

          if (num_left > 0) {
            var full_domain = partial_domain.concat(d3.range(num_left));
          } else {
            var full_domain = partial_domain;
          }

          var y1 = y0.domain(full_domain).copy();

          d3.select("#charts").selectAll("svg." + grp)
            .sort(function (a, b) { return y1(a.field) - y1(b.field); });

          // if (PAUSED) {
          // 	var move_duration = 750;
          // } else {
          // 	var move_duration = USER_SPEED;
          // }

          var transition = d3.select("#charts").transition().duration(USER_SPEED),
            delay = function (d, i) { return i * 50; };

          transition.selectAll("svg." + grp)
            .delay(delay)
            .style("top", function (d) { return y1(d.field) + "px"; });

        });
      }
}

/** Built all data structure require by graphic from data */
D3Graphics.Flowing.compile = function () {
    // Get a list of all columns' names from the file source. It omit the field year
    var fields = d3.keys(D3Graphics.Flowing.data.source[0]).filter(function (key) { return key !== "year"; });
    // Mapping values to data structure. In this mapping get values for every item of the group
    D3Graphics.Flowing.data.items = fields.map(function (fname, i) {
        // Split the field name to get the master group and its categories
        var words = fname.split("_");
        // Get the group's name
        var group = words[0];
        // Get printable name
        var real_name = words.slice(1, words.length).join(" ");
        // Return data structure
        return {
            field: real_name,
            group: group,
            // Get all rows only from the column required
            values: data.map(function (d) {
                return { year: d.year, value: d[fname] };
            })
        };
    });

    // Max for each item
    D3Graphics.Flowing.data.items.forEach(function (f) {
        f.max = d3.max(f.values, function (d) { return d.value; });
        // This approaches the cycle and make categories with maximums
        if (D3Graphics.Flowing.data.groups[f.group] === null) {
            var json = {};
            json[f.group] = { 'max': f.max };
            D3Graphics.Flowing.data.groups.push(json);
        }
        else if (D3Graphics.Flowing.data.groups[f.group].max < f.max) {
            D3Graphics.Flowing.data.groups[f.group].max = f.max;
        }
    });
}

/** Initialize all components for the graphic */
D3Graphics.Flowing.init = function () {
    // Init the container
    var div = document.getElementById(D3Graphics.Flowing.configuration.container);
    D3Graphics.Flowing.configuration.canvas.width = div.clientWidth;
    D3Graphics.Flowing.configuration.canvas.height = div.clientWidth;
    // Set the items size
    var items_width = D3Graphics.Flowing.configuration.canvas.width / D3Graphics.Flowing.configuration.max_columns;
    var items_margin_right = D3Graphics.Flowing.configuration.items.margin.right * D3Graphics.Flowing.configuration.max_columns;
    var items_margin_left = D3Graphics.Flowing.configuration.items.margin.left * D3Graphics.Flowing.configuration.max_columns;
    D3Graphics.Flowing.configuration.items.width = items_width - items_margin_right - items_margin_left;
    /*var items_height = D3Graphics.Flowing.configuration.canvas.height;
    var items_margin_top = D3Graphics.Flowing.configuration.items.margin.top * D3Graphics.Flowing.configuration.max_columns;
    var items_margin_bottom = D3Graphics.Flowing.configuration.items.margin.bottom * D3Graphics.Flowing.configuration.max_columns;
    D3Graphics.Flowing.configuration.items.height = items_height - items_margin_top - items_margin_bottom;*/
    D3Graphics.Flowing.configuration.items.height = 90;

    // Init the tools 
    D3Graphics.Flowing.tools.bisectYear = d3.bisector(function (d) { return d.year; }).left;
    D3Graphics.Flowing.tools.numberFormat = d3.format(".2f");
    D3Graphics.Flowing.tools.area = d3.svg.area()
        .x(function (d) { return x(d.year); })
        .y0(D3Graphics.Flowing.configuration.items.height)
        .y1(function (d) { return y(d.value); });
    D3Graphics.Flowing.tools.line = d3.svg.line()
        .x(function (d) { return x(d.year); })
        .y(function (d) { return y(d.value); });

}

/** Render */
D3Graphics.Flowing.render = function () {
    // Compile data
    D3Graphics.Flowing.compile();

    // Init configurations and Controls
    D3Graphics.Flowing.init();

    // Set the interpolation values
    D3Graphics.Flowing.interpolation.x0 = d3.scale.ordinal().rangeRoundPoints([0, 890]).domain(Object.keys(D3Graphics.Flowing.data.groups));
    D3Graphics.Flowing.interpolation.y0 = d3.scale.ordinal().domain(d3.range(10)).rangeRoundPoints([0, 520]);
    D3Graphics.Flowing.interpolation.x = d3.scale.linear().range([0, D3Graphics.Flowing.configuration.width]);
    D3Graphics.Flowing.interpolation.y = d3.scale.linear().range([D3Graphics.Flowing.configuration.height, 0]);
    // Min and Max year for the x domain
    D3Graphics.Flowing.interpolation.x.domain([
        d3.min(D3Graphics.Flowing.data.items, function (s) { return s.values[0].year; }),
        d3.max(D3Graphics.Flowing.data.items, function (s) { return s.values[s.values.length - 1].year; })
    ]);

    // Start chart for each item

    var svg = d3.select(D3Graphics.Flowing.configuration.container).selectAll("svg")
        .data(D3Graphics.Flowing.data.items)
        .enter().append("svg")
        .attr("id", function (d) { return d.field; })
        .attr("class", function (d) { return d.group; })
        .attr("width", D3Graphics.Flowing.configuration.items.width + (D3Graphics.Flowing.configuration.items.margin.right * D3Graphics.Flowing.configuration.max_columns) + (D3Graphics.Flowing.configuration.items.margin.left * D3Graphics.Flowing.configuration.max_columns))
        .attr("height", D3Graphics.Flowing.configuration.items.height)
        .style("left", function (d, i) { return x0(d.group) + "px"; })
        // .style("top", function(d,i) { return y0(i) + "px"; })
        .append("g")
        .attr("transform", "translate(" + D3Graphics.Flowing.configuration.items.margin.left + "," + D3Graphics.Flowing.configuration.items.margin.top + ")");

    svg.append("rect")
        .attr("class", "chartbg")
        .attr("width", D3Graphics.Flowing.configuration.items.width)
        .attr("height", D3Graphics.Flowing.configuration.items.height);
    svg.append("path")
        .attr("class", "area")
        .attr("d", function (d) { y.domain([0, D3Graphics.Flowing.data.groups[d.group].max]); return area(d.values); });
    svg.append("path")
        .attr("class", "line")
        .attr("d", function (d) { y.domain([0, D3Graphics.Flowing.data.groups[d.group].max]); return line(d.values); });
    svg.append("text")
        .attr("class", "foodname")
        .attr("dy", "1.1em")
        .attr("dx", "0.4em")
        .text(function (d) { return d.field; });

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

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", D3Graphics.Flowing.configuration.items.width)
        .attr("height", D3Graphics.Flowing.configuration.items.height)
        .on("mouseover", D3Graphics.Flowing.events.mouseover)
        .on("mouseout", D3Graphics.Flowing.events.mouseout)
        .on("mousemove", D3Graphics.Flowing.events.mousemove)
        .on("click", D3Graphics.Flowing.events.mouseclick);

}

/** Start Controls **/
D3Graphics.Flowing.Control = D3Graphics.Flowing.Control || {};


/** End Controls **/

/** Start Groups **/
D3Graphics.Flowing.Groups = D3Graphics.Flowing.Groups || {};


/** End Groups **/

/** Start Measure **/
D3Graphics.Flowing.Measure = D3Graphics.Flowing.Measure || {};


/** End Measure **/