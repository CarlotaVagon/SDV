var defVis = {};

(function (visualization){
  visualization.donut = {};

  var topLevelItem = {label: "Period"};

   var subsubDataWD = [
    {colorIndex: 5, value: 1.32, label: "0 to 17"},
    {colorIndex: 6, value: 19.64,  label: "18 to 49"},
    {colorIndex: 7, value: 80.39,  label: "50 or above"}
  ];

  var subsubDataDD = [
    {colorIndex: 5, value: 2.58, label: "0 to 17"},
    {colorIndex: 6, value: 24.15,  label: "18 to 49"},
    {colorIndex: 7, value: 49.88,  label: "50 or above"}
  ];
  
  var subsubDataOD = [
    {colorIndex: 5, value: 3.55, label: "0 to 17"},
    {colorIndex: 6, value: 31.89,  label: "18 to 49"},
    {colorIndex: 7, value: 66.46,  label: "50 or above"}
  ];

  var subsubDataWC = [
    {colorIndex: 5, value: 11.08, label: "0 to 17"},
    {colorIndex: 6, value: 96.33,  label: "18 to 49"},
    {colorIndex: 7, value: 252.46,  label: "50 or above"}
  ];

  var subsubDataDC = [
    {colorIndex: 5, value: 34.96, label: "0 to 17"},
    {colorIndex: 6, value: 154.12,  label: "18 to 49"},
    {colorIndex: 7, value: 183.74,  label: "50 or above"}
  ];
  
  var subsubDataOC = [
    {colorIndex: 5, value: 79.04, label: "0 to 17"},
    {colorIndex: 6, value: 285.9,  label: "18 to 49"},
    {colorIndex: 7, value: 322.44,  label: "50 or above"}
  ];
  var subData = [
    {colorIndex: 4, value: 135.57, childData: subsubDataWD, label: "Deaths"},
    {colorIndex: 3, value: 2872.04, childData: subsubDataWC, label: "Cases"}

  ];
  
  var subData2 = [
    {colorIndex: 4, value: 95.85, childData: subsubDataDD, label: "Deaths"},
    {colorIndex: 3, value: 2024.07, childData: subsubDataDC, label: "Cases"}

  ];
  
  var subData3 = [
    {colorIndex: 4, value: 120.44, childData: subsubDataOD, label: "Deaths"},
    {colorIndex: 3, value: 8688, childData: subsubDataOC, label: "Cases"}

  ];

  var data = [
    {colorIndex: 0, value: 3007.61, childData: subData, label: "Winter"},
    {colorIndex: 1, value: 2119.92, childData: subData2, label: "Delta"},
    {colorIndex: 2, value: 8808.44, childData: subData3, label: "Omicron"}
  ];

  var dataOriginal = data.slice(0);

  var selectedPath = [],
      selectedPathColors = [];

  function endall(transition, callback){
    var n = 0;
    transition
      .each(function(){
      ++n;
    })
      .on("end", function(){
      if(!--n) callback.apply(this, arguments);
    });
  }

  //Global Variables
  var margin = 75,
      width = 600,
      height = 600,
      radius = 175;

  var transformAttrValue = function(adjustLeft){
    var leftValue = margin + radius;
    if(adjustLeft){
      leftValue += adjustLeft;
    }
    return "translate(" + leftValue + "," + (margin + radius) + ")";
  };

      var colorRange = ["#91f4bb","#ec3523","#632d8f","#424faf","#f89e01","#c3deff","#f81cd3","#186700"];
  
    var colors = d3.scaleOrdinal().range(colorRange);
  
 // var colors = d3.scaleOrdinal(d3["schemeCategory20b"]);

  var chart, pieSVG, chartLabelsGroup, chartCenterLabelGroup, chartCenterLabel,
      arc, arcSmall, pie, path, chartSelect, arcOver;

  function zoomIn(d){

    if(!d.data.childData){
      //No children to zoom in to
      return false;
    }

    var sel = d3.select(this);

    //Search the current path to see the counter where it was selected. (Also update selected path)
    for(var i = 0; i < path._groups[0].length; i++){
      if(path._groups[0][i] == sel._groups[0][0]){
        selectedPath.push(i);
        selectedPathColors.push(d.data.colorIndex);
        break;
      }
    }

    //remove hover effect and return selected arc to 'normal' size
    sel.attr("d", arc);

    //create 'parent' outer arc
    var startAngle = d.startAngle,
        endAngle = d.endAngle;

    var arcSelect = d3.arc()
    .startAngle(function(s){
      return startAngle;
    })
    .endAngle(function(s){
      return endAngle;
    })
    .innerRadius(function(i){
      return radius - 20;
    })
    .outerRadius(function(o){
      return radius * 1.1
    });

    var newArc = chartSelect.append("path")
    .style("fill", colors(d.data.colorIndex))
    .attr('d', arcSelect)
    .on("click", zoomOut(d));

    newArc.transition()
      .duration(1000)
      .attrTween("d", function(){
      var newAngle = d.startAngle + 2 * Math.PI;
      var interpolate = d3.interpolate(d.endAngle, newAngle);
      return function(tick){
        endAngle = interpolate(tick);
        return arcSelect(d);
      };
    })
      .on("end", zoomInSweepEnded(d.data.childData));
  }

  function zoomOut(clickedItem, selectedItem){
    return function(){
      //Determine the current path item while zooming.
      var currentItem = getCurrentItemData(1); //sibling data for selected item (aka new data to show for building primary paths)
      selectedPath.pop();
      selectedPathColors.pop();

      selectedItem = selectedItem || d3.select(this);
      selectedItem.on("click", null);

      if(selectedPath.length > 0) {
        //in .secondary add a new path that will zoom in to form the new outer
        //gets it's data from the last element in selectedPath
        var parentItem = getCurrentItem();

        var arcSelect = d3.arc()
        .startAngle(function(s){
          return 0;
        })
        .endAngle(function(s){
          return 2 * Math.PI;
        })
        .innerRadius(function(i){
          return radius * 1.25;//radius;
        })
        .outerRadius(function(o){
          return (radius * 1.1) + (((radius * 1.25) - (radius - 20)) / 1.75);
        });

        var newOuterParentData = pie(getCurrentItemData(1));

        var newOuter = chartSelect.append("path")
        .style("fill", colors(parentItem.colorIndex))
        .attr('d', arcSelect)
        .attr('class', 'zoom-out')
        .style("transform", "scale(1.25)")
        .style('opacity', 0)
        .on("click", zoomOut(newOuterParentData[selectedPath[selectedPath.length - 1]]));

        newOuter
          .transition()
          .delay(350)
          .ease(d3.easeCubicOut)
          .duration(750)
          .style('opacity', 1)
          .style('transform', 'scale(1)')
          .on('end', function(){
          newOuter.style("transform", null);
        })
      }

      //takes old outer and resizes to zoom around and form it's proper place in new primary
      zoomZeArc(selectedItem, true, function(){
        //resize what was the outer parent to match it's data
        var startAngle = clickedItem.startAngle;
        var endAngle = clickedItem.startAngle + 2 * Math.PI;

        var arcSelect = d3.arc()
        .startAngle(function(s){
          return startAngle;
        })
        .endAngle(function(s){
          return endAngle;
        })
        .innerRadius(function(i){
          return radius - 20;
        })
        .outerRadius(function(o){
          return radius * 1.1;
        });

        var arcFinal = d3.arc()
        .startAngle(function(s){
          return startAngle;
        })
        .endAngle(function(s){
          return endAngle;
        })
        .outerRadius(radius)
        .innerRadius(radius - 20);

        selectedItem.transition()
          .duration(750)
          .attrTween("d", function(){
          var newAngle = clickedItem.startAngle + 2 * Math.PI;
          var interpolate = d3.interpolate(newAngle, clickedItem.endAngle);
          return function(tick){
            endAngle = interpolate(tick);
            return arcSelect(clickedItem);
          }
        })
          .on("end", function(){
          selectedItem.transition()
            .ease(d3.easeBounceIn)
            .duration(500)
            .attr("d", arcFinal)
            .on("end", function(){
            selectedItem.remove();
          });
        })
      });

      path
        .transition()
        .ease(d3.easeBackInOut)
        .duration(750)
        .attr("transform", "scale(.5), rotate(-90)")
        .style('opacity', 0)
        .call(endall, function(){
        path
          .attr("transform", "scale(1), rotate(0)")
          .style("opacity", 1);
        path = drawPrimaryPaths(currentItem)
          .on('click', zoomIn);

        updatePieLabels();
      });
    }
  }

  function zoomInSweepEnded(childData){
    return function(){

      var selectedItem = d3.select(this);
      var path = drawPrimaryPaths(childData);
      path.attr("transform", "scale(0.5), rotate(-90)")
        .style("opacity", 0);

      updatePieLabels();

      path
        .transition()
        .ease(d3.easeBackInOut)
        .duration(750)
        .attr("transform", "scale(1), rotate(0)")
        .style("opacity", 1)
        .call(function(){

      });

      //take any existing parent and zooms it out of existence
      d3.selectAll(".secondary .zoom-out")
        .transition()
        .ease(d3.easeBackInOut)
        .duration(750)
        .attr('transform', "scale(1.25)")
        .style("opacity", 0)
        .remove()
        .call(function(){

      });

      //takes selected item that just finished sweeping around and expands it out
      zoomZeArc(selectedItem, false);
    }
  }

  function drawPrimaryPaths(data){
    var pathUpdate = chart.selectAll("path")
    .data(pie(data));

    var pathEnter = pathUpdate.enter().append("path");

    pathUpdate.exit().remove();

    var pathEnterUpdate = pathEnter.merge(pathUpdate);

    pathEnterUpdate
      .style("fill", function(d){
      return colors(d.data.colorIndex);
    })
      .attr('d', arc)
      .each(function(d){
      this._current = d;
    })
      .on("mouseover", function () {
      //return false;
      d3.select(this).transition()
        .duration(100)
        .ease(d3.easeQuadOut)
        .attr("d", arcOver);
    }).on("mouseout", function () {
      //return false;
      d3.select(this).transition()
        .duration(500)
        .ease(d3.easeBounceOut)
        .attr("d", arc);
    }).on("click", zoomIn);
    path = pathEnterUpdate;
    return pathEnterUpdate;
  }

  function zoomZeArc(selectedItem, reverse, callback){
    //set sizing for outer arc
    var zoomScale = 1.25,
        origOuterRadius = radius * 1.1,
        origInnerRadius = radius - 20;

    var finalInnerRadius = radius * zoomScale;

    var curInnerRadius = origInnerRadius,
        curOuterRadius = origOuterRadius;

    var arcZoom = d3.arc()
    .startAngle(0)
    .endAngle(2 * Math.PI)
    .outerRadius(function(){
      return(curOuterRadius);
    })
    .innerRadius(function(){
      return (curInnerRadius);
    });

    //zooming in, so add 'zoom-out' class
    if(!reverse){
      selectedItem.attr("class", "zoom-out");
    }

    selectedItem
      .transition()
      .ease(d3.easeBackInOut)
      .duration(750)
      .attrTween("d", function(){
      var iInner = reverse ? d3.interpolate(finalInnerRadius, origInnerRadius) : d3.interpolate(origInnerRadius, finalInnerRadius);
      return function(tick){
        curInnerRadius = iInner(tick);
        curOuterRadius = origOuterRadius + ((curInnerRadius - origInnerRadius) / 1.75);
        return arcZoom(selectedItem);
      }
    })
      .on("end", function(){
      if(callback){
        callback();
      }
    });
  }

  function updatePieLabels(){

    chartCenterLabel.text(getCurrentItem().label);

    chartLabelsGroup.html("");

    var sliceLabels = chartLabelsGroup.selectAll("text").data(pie(path.data()));
    var currentData = getCurrentItemData();

    sliceLabels
      .enter()
      .append("text")
      .style("opacity", 0)
      .transition().duration(750)
      .style("opacity", 1)
      .attr("class", "outer-label")
      .attr('transform', function(d){
      return "translate(" + arcSmall.centroid(d) + ")";
    })
      .text(function(d, i){
      return currentData[i].label;
    });
  }

  function getCurrentItem(){
    if(selectedPath.length === 0){
      return topLevelItem;
    }
    var currentItem = data;
    for (var i = 0; i < selectedPath.length; i++){
      if(i + 1 < selectedPath.length){
        currentItem = currentItem[selectedPath[i]].childData;
      }
      else currentItem = currentItem[selectedPath[i]];
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

  function getCurrentItemData(minusIndex) {
    minusIndex = minusIndex | 0;
    var currentItem = data;

    for (var i = 0; i < selectedPath.length - minusIndex; i++) {
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

  visualization.donut.show = function(){
    var svgContainer = d3.select("#graph-container");
    svgContainer.html("");
    data = dataOriginal.slice(0);
    selectedPath = [];
    selectedPathColors = [];

    //Primary Chart

    pieSVG = svgContainer
      .append("svg")
      .attr("id", "svg-container")
      .attr("width", width)
      .attr("height", height);

    chart = pieSVG
      .append("g")
      .attr("class", "primary")
      .attr('transform', transformAttrValue());

    chartLabelsGroup = pieSVG
      .append("g")
      .attr("class", "labelGroup")
      .attr("transform", transformAttrValue(-35));

    chartCenterLabelGroup = pieSVG
      .append("g")
      .attr("class", "labelCenterGroup")
      .attr("transform", transformAttrValue())
      .style("text-transform", "uppercase");

    chartCenterLabel = chartCenterLabelGroup
      .append("text")
      .attr('dy', '.35em')
      .attr('class', 'chartLabel center')
      .attr('text-anchor', 'middle');

    arc = d3.arc()
      .outerRadius(radius)
      .innerRadius(radius - 20);

    arcSmall = d3.arc()
      .outerRadius(radius - 70)
      .innerRadius(radius - 80);

    // Arc Interaction Sizing
    arcOver = d3.arc()
      .outerRadius(radius * 1.1)
      .innerRadius(radius - 20);

    pie = d3.pie()
      .value(function(d){
      return d.value;
    })
      .sort(null);


    path = drawPrimaryPaths(data);

    updatePieLabels();

    chartSelect = pieSVG.append('g')
      .attr('class', 'secondary')
      .attr("transform", transformAttrValue());
  };

  return visualization;
}(defVis));

//console.log(defVis.donut.getBreadCrumbs());
defVis.donut.show();
