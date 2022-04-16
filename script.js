var definitionVisualization = {};

(function (visualization) {

    visualization.donut = {};

    var topLevelItem = {label: "Channel"};

    var subSubData = [
        {colorIndex: 10, value: 3075, label: "Label 1"},
        {colorIndex: 11, value: 6150, label: "Label 2"},
        {colorIndex: 12, value: 6832, label: "Label 3"},
        {colorIndex: 13, value: 7516, label: "Label 4"},
        {colorIndex: 14, value: 6291, label: "Label 5"}
    ];

    var subData = [
        {colorIndex: 5, value: 1000, label: "Region 1"},
        {colorIndex: 6, value: 1000, label: "Region 2"},
        {colorIndex: 7, value: 1000, label: "Region 3"},
        {colorIndex: 8, value: 1000, label: "Region 4"},
        {colorIndex: 9, value: 5000, childData: subSubData, label: "Region 5"}
    ];

    var data = [
        {colorIndex: 0, value: 25, childData: subData, label: "Call Center"},
        {colorIndex: 1, value: 25, childData: subData, label: "Third Party"},
        {colorIndex: 2, value: 16.66667, childData: subData, label: "Web"},
        {colorIndex: 3, value: 16.66667, childData: subData, label: "Mobile"},
        {colorIndex: 4, value: 16.66667, childData: subData, label: "In-Store"}
    ];

    var dataOriginal = data.slice(0); //Keep a record around for book-keeping purposes

    var selectedPath = [];

    function endall(transition, callback) {
        var n = 0;
        transition
            .each(function () {
                ++n;
            })
            .each("end", function () {
                if (!--n) callback.apply(this, arguments);
            });
    }

    // Global Variables

    var margin = {top: 50, right: 0, bottom: 10, left: 127.5};
    var width = 555;
    var height = 800;

    var radius = 150;

    var transformAttrValue = function (adjustLeft) {
        var leftValue = margin.left + radius;
        if (adjustLeft) {
            leftValue = leftValue + adjustLeft;
        }
        return "translate(" + leftValue + "," + (margin.top + radius) + ")";
    }
    var colorRange = ["#ffb822","#00bf8c","#219ddb","#ad85cc","#f95275","#80B647","#11AEB4","#6791D4","#D36CA1","#FC803B"];
  
    var colors = d3.scale.ordinal().range(colorRange);

    var chart, chartLabelsGroup, chartCenterLabelGroup, chartCenterLabel,
        arc, arcSmall, pie, path, chartSelect, chartSelectTertiary, arcOver;

    function zoomIn(d) {

        if (!d.data.childData) {
            //At deepest available level
            return false;
        }

        var sel = d3.select(this);

        //Search the current path to see the counter where it was selected. (Also update selected path)

        for (var i = 0; i < path[0].length; i++) {
            if (path[0][i] == sel[0][0]) {
                selectedPath.push(i);
                break;
            }
        }

        sel.attr("d", arc);

        var startAngle = d.startAngle;
        var endAngle = d.endAngle;

        var arcSelect = d3.svg.arc()
            .startAngle(function (s) {
                return startAngle;
            })
            .endAngle(function (s) {
                return endAngle;
            })
            .innerRadius(function (i) {
                return radius - 20
            })
            .outerRadius(function (o) {
                return radius * 1.1
            });

        var newArc = chartSelect.append('path')
            .style("fill", colors(d.data.colorIndex))
            .attr("d", arcSelect)
            .on("click", zoomOut(d));

        newArc.transition()
            .duration(1000)
            .attrTween("d", function () {
                var newAngle = d.startAngle + 2 * Math.PI;
                var interpolate = d3.interpolate(d.endAngle, newAngle);
                return function (tick) {
                    endAngle = interpolate(tick);
                    return arcSelect(d);
                };
            })
            .each("end", zoomInSweepEnded(d.data.childData))

    }

    function zoomOut(clickedItem, selectedItem) {

        return function () {

            //Determine the current parent item while zooming.

            var currentItem = getCurrentItemData(1);
            selectedPath.pop(); //Update the path

            //If we have another parent we need to show the zoom further out arc.

            if (selectedPath.length > 0) {
                chartSelectTertiary.attr("style", "");
                chartSelectTertiary.on("click", function () {
                    //TODO: Fix this!!!
                  zoomOut({startAngle: 0, endAngle:0}, chartSelectTertiary.select("path"))();
                });
            }

            //Proceed with animations

            selectedItem = selectedItem || d3.select(this);

            selectedItem.on("click", null);

            zoomZeArc(selectedItem, true, function () {

                var startAngle = clickedItem.startAngle;
                var endAngle = clickedItem.startAngle + 2 * Math.PI;

                var arcSelect = d3.svg.arc()
                    .startAngle(function (s) {
                        return startAngle;
                    })
                    .endAngle(function (s) {
                        return endAngle;
                    })
                    .innerRadius(function (i) {
                        return radius - 20
                    })
                    .outerRadius(function (o) {
                        return radius * 1.1
                    });

                var arcFinal = d3.svg.arc()
                    .startAngle(function (s) {
                        return startAngle;
                    })
                    .endAngle(function (s) {
                        return endAngle;
                    })
                    .outerRadius(radius)
                    .innerRadius(radius - 20);

                selectedItem.transition()
                    .duration(750)
                    .attrTween("d", function () {
                        var newAngle = clickedItem.startAngle + 2 * Math.PI;
                        var interpolate = d3.interpolate(newAngle, clickedItem.endAngle);
                        return function (tick) {
                            endAngle = interpolate(tick);
                            return arcSelect(clickedItem);
                        };
                    })
                    .each("end", function () {
                        selectedItem.transition()
                            .ease("bounce")
                            .duration(500)
                            .attr("d", arcFinal)
                            .each("end", function () {
                                //Finished animating and bouncing
                                d3.select(".secondary").html("");
                            });
                    });

            });

            path
                .transition()
                .ease("back-in-out")
                .duration(750)
                .attr("transform", "scale(.5), rotate(-90)")
                .style("opacity", 0)
                .call(endall, function () {

                    path
                        .attr("transform", "scale(1), rotate(0)")
                        .style("opacity", 1)
                        .data(pie(currentItem))
                        .style("fill", function (d) {
                            return colors(d.data.colorIndex);
                        })
                        .attr("d", arc)
                        .on("click", zoomIn)
                        .each(function (d, counter) {
                            //this._current = d;)
                        }); // store the initial angles

                    updatePieLabels();

                })

        }
    }

    function zoomInSweepEnded(childData) {

        return function () {

            chartSelectTertiary.attr("style", "display: none");

            var selectedItem = d3.select(this);

            path
                .attr("transform", "scale(0.5), rotate(-90)")
                .style("opacity", 0);

            path
                .data(pie(childData))
                .style("fill", function (d) {
                    return colors(d.data.colorIndex);
                })
                .attr("d", arc);

            updatePieLabels();

            path
                .transition()
                .ease("back-in-out")
                .duration(750)
                .attr("transform", "scale(1), rotate(0)")
                .style("opacity", 1)
                .call(function () {
                    //Finished scaling
                });
            ;

            d3.selectAll(".zoom-out")
                .transition()
                .ease("back-in-out")
                .duration(750)
                .attr("transform", "scale(1.25)")
                .style("opacity", 0)
                .remove()
                .call(function () {
                    //Finished zooming out
                });

            setTimeout(function () {
                var secondaryHtml = d3.select(".secondary").html();
                d3.select(".tertiary").html(secondaryHtml);
            }, 850);

            zoomZeArc(selectedItem, false);

        }
    }

    function zoomZeArc(selectedItem, reverse, callback) {

        var zoomScale = 1.25;

        var origOuterRadius = radius * 1.1;
        var origInnerRadius = radius - 20;

        var finalInnerRadius = radius * zoomScale;

        var curInnerRadius = origInnerRadius;
        var curOuterRadius = origOuterRadius;

        var arcZoom = d3.svg.arc()
            .startAngle(0)
            .endAngle(2 * Math.PI)
            .outerRadius(function () {
                return (curOuterRadius);
            })
            .innerRadius(function () {
                return (curInnerRadius);
            });

        if (!reverse) {
            selectedItem.attr("class", "zoom-out");
        }

        selectedItem
            .transition()
            .ease("back-in-out")
            .duration(750)
            .attrTween("d", function () {
                var iInner = reverse ? d3.interpolate(finalInnerRadius, origInnerRadius) : d3.interpolate(origInnerRadius, finalInnerRadius);
                return function (tick) {
                    curInnerRadius = iInner(tick);
                    curOuterRadius = origOuterRadius + ((curInnerRadius - origInnerRadius) / 1.75);
                    return arcZoom(selectedItem);
                }
            })
            .each("end", function () {
                if (callback) {
                    callback();
                }
            });

    }


    function updatePieLabels() {

        chartCenterLabel.text(getCurrentItem().label);

        //Updates pie chart labels. Needs to be after path data gets set!

        chartLabelsGroup.html("");

        var sliceLabels = chartLabelsGroup.selectAll("text").data(pie(path.data()))
        var currentData = getCurrentItemData();

        sliceLabels
            .enter()
            .append("text")
            .style("opacity", 0)
            .transition().duration(750)
            .style("opacity", 1)
            .attr("class","outer-label")
            .attr("transform", function(d) {
                return "translate(" + arcSmall.centroid(d) + ")";
            })
            .text(function(d ,i) {
                return currentData[i].label;
            });

    }

    function getCurrentItem() {
        if (selectedPath.length == 0) {
            return topLevelItem;
        }
        var currentItem = data;
        for (var i = 0; i < selectedPath.length; i++) {
            if (i + 1 < selectedPath.length) {
                currentItem = currentItem[selectedPath[i]].childData;
            } else {
                currentItem = currentItem[selectedPath[i]];
            }
        }
        return currentItem;
    }

    function getCurrentItemAsBreadCrumbs() {
        if (selectedPath.length == 0) {
            return [topLevelItem.label];
        }
        var currentItem = data;
        var returnList = [topLevelItem.label];
        for (var i = 0; i < selectedPath.length; i++) {
            returnList.push(currentItem[selectedPath[i]].label);
            if (i + 1 < selectedPath.length) {
                currentItem = currentItem[selectedPath[i]].childData;
            } else {
                currentItem = currentItem[selectedPath[i]];
            }
        }
        return returnList;
    }

    function getCurrentItemData(startIndex) {
        startIndex = startIndex | 0;
        var currentItem = data;
        for (var i = startIndex; i < selectedPath.length; i++) {
            currentItem = currentItem[selectedPath[i]].childData
        }
        return currentItem;
    }

    function getRandomNumberInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    visualization.donut.getBreadCrumbs = function() {
        return getCurrentItemAsBreadCrumbs();
    };

    visualization.donut.randomize = function() {

        //Set some random dataz and animate it

        var currentDataLevel = getCurrentItemData();
        for (var i=0; i<currentDataLevel.length; i++) {
            currentDataLevel[i].value = currentDataLevel[i].value * getRandomNumberInRange(75, 125) / 100.0;
        }

        path.data(pie(currentDataLevel))

        path.transition().duration(750).attrTween("d", function(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) {
                return arc(i(t));
            };
        });

    };

    visualization.donut.show = function () {

        var svgContainer = d3.select("#graph-container");
        svgContainer.html("");

        data = dataOriginal.slice(0);
        selectedPath = [];

        // Primary Chart
        chart = svgContainer
            .append("svg")
            .attr("id", "svg-container")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("class", "primary")
            .attr("transform", transformAttrValue());

        chartLabelsGroup = d3.select("#svg-container")
            .append("g")
            .attr("class", "labelGroup")
            .attr("transform", transformAttrValue(-20));

        chartCenterLabelGroup = d3.select("#svg-container")
            .append("g")
            .attr("class", "labelCenterGroup")
            .attr("transform", transformAttrValue());

        chartCenterLabel = chartCenterLabelGroup
            .append("text")
            .attr("dy", ".35em")
            .attr("class", "chartLabel center")
            .attr("text-anchor", "middle");

        arc = d3.svg.arc()
            .outerRadius(radius)
            .innerRadius(radius - 20);

        arcSmall = d3.svg.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 80);

        pie = d3.layout.pie()
            .value(function (d) {
                return d.value;
            })
            .sort(null);

        path = chart.selectAll("path")
            .data(pie(data))
            .enter().append("path")
            .style("fill", function (d) {
                return colors(d.data.colorIndex);
            })
            .attr("d", arc)
            .each(function (d) {
                this._current = d;
            }); // store the initial angles

        updatePieLabels();

        // Secondary Chart
        chartSelect = d3.select("svg")
            .append("g")
            .attr("class", "secondary")
            .attr("transform", transformAttrValue());

        // Tertiary Chart
        chartSelectTertiary = d3.select("svg")
            .append("g")
            .attr("class", "tertiary")
            .attr("style", "display:none")
            .attr("transform", transformAttrValue());

        // Arc Interaction Sizing
        arcOver = d3.svg.arc()
            .outerRadius(radius * 1.1)
            .innerRadius(radius - 20);

        path.on("mouseover", function () {
            //return false;
            d3.select(this).transition()
                .ease("in")
                .duration(100)
                .attr("d", arcOver);
        }).on("mouseout", function () {
            //return false;
            d3.select(this).transition()
                .ease("bounce")
                .duration(500)
                .attr("d", arc);
        }).on("click", zoomIn);

    };

    return visualization;

}(definitionVisualization));

definitionVisualization.donut.show();