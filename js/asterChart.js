// based on http://bl.ocks.org/bbest/2de0e25d4840c68f2db1 with edits by Alice Liang

function drawAster(tag, formattedData) {

  var width = 500,
    height = 500,
    radius = Math.min(width, height) / 2,
    innerRadius = 0.3 * radius;

  var pie = d3.pie()
      .sort(null)
      .value(function(d) { return d.width; });

  var tooltip = d3.select("body")
  	.append("div")
  	.style("position", "absolute")
  	.style("z-index", "10")
  	.style("visibility", "hidden");

  var arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(function (d) {
      return (radius - innerRadius) * (d.data.score / 100.0) + innerRadius;
    });

  var outlineArc = d3.arc()
          .innerRadius(innerRadius)
          .outerRadius(radius);

  var svg = d3.select(tag).append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  // svg.call(tip);

  var path = svg.selectAll(".solidArc")
      .data(pie(formattedData))
      .enter().append("path")
      .attr("fill", function(d) { return d.data.color; })
      .attr("class", "solidArc")
      .attr("stroke", "gray")
      .attr("d", arc)
      .on("mouseover", function(d){
          d3.select(this).style("fill-opacity", 0.7);
          tooltip.html(d.data.label + " <b>[" + d.data.score + "]</b>");
          return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function(){
          return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
      })
      .on("mouseout", function(){
        d3.select(this).style("fill-opacity", 1);
        return tooltip.style("visibility", "hidden");
      });

  var outerPath = svg.selectAll(".outlineArc")
      .data(pie(formattedData))
    .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("class", "outlineArc")
      .attr("d", outlineArc);

  // calculate the weighted mean score
  var score =
    formattedData.reduce(function(a, b) {
      return a + (b.score * b.weight);
    }, 0) /
    formattedData.reduce(function(a, b) {
      return a + b.weight;
    }, 0);

  svg.append("svg:text")
    .attr("class", "aster-score")
    .attr("dy", ".35em")
    .attr("text-anchor", "middle") // text-align: right
    .text(Math.round(score));

};
