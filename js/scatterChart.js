// based on http://bl.ocks.org/weiglemc/6185069 with edits by Alice Liang

function drawScatter(tag, data, color) {

  // begin chart
  var margin = {top: 20, right: 20, bottom: 30, left: 100},
      width = 700 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var x = d3.scaleLinear()
      .range([0, width]);

  var y = d3.scaleLinear()
      .range([height, 0]);

  // var color = d3.scaleOrdinal(d3.schemeCategory10);

  var xAxis = d3.axisBottom(x);

  var yAxis = d3.axisLeft(y)
              .ticks(10)
              .tickFormat(function(d) {
                return _.find(data, {idx : d}).playlist
              });
  ;

  var tooltip = d3.select("body")
  	.append("div")
  	.style("position", "absolute")
  	.style("z-index", "10")
  	.style("visibility", "hidden");

  var svg = d3.select(tag).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    data.forEach(function(d) {
      d.danceability = +d.danceability;
      d.idx = +d.idx;
    });

    x.domain(d3.extent(data, function(d) { return d.danceability; })).nice();
    y.domain(d3.extent(data, function(d) { return d.idx; })).nice();

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Danceability");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

      svg.selectAll(".dot")
        .data(data)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", function(d) { return x(d.danceability); })
        .attr("cy", function(d) { return y(d.idx); })
        .style("fill", function(d) { return color(d.idx); })
        .on("mouseover", function(d){
            d3.select(this).style("fill-opacity", 0.7);
            tooltip.html(d.track);
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function(){
            return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
        })
        .on("mouseout", function(){
          d3.select(this).style("fill-opacity", 1);
          return tooltip.style("visibility", "hidden");
        });

};
