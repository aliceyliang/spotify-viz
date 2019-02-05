// based on http://bl.ocks.org/lokesh005/1b23c84b68f5be134ff0 with edits by Alice Liang

function drawPlatelet(tag, formattedData, colors) {

  var margin = {top:40,left:40,right:40,bottom:40};
  width = 300;
  height = 300;
  radius = Math.min(width-100,height-100)/2;

  var arc = d3.arc()
           .outerRadius(0)
           .innerRadius(60)
       .cornerRadius(40);

  var a=width/2 - 20;
  var b=height/2 - 90;
  var svg = d3.select(tag).append("svg")
            .attr("viewBox", "0 0 " + width + " " + height/2)
      .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform","translate("+a+","+b+")");

  var tooltip = d3.select("body")
  	.append("div")
  	.style("position", "absolute")
  	.style("z-index", "10")
  	.style("visibility", "hidden");

  var pie = d3.pie()
            .sort(null)
            .value(function(d){return d.transform;})
        .padAngle(.02);

        var g = svg.selectAll(".arc")
          .data(pie(formattedData))
          .enter()
          .append("g")
          .attr("class","arc")
          .on("mouseover", function(d){
              d3.select(this).style("fill-opacity", 0.7);
              tooltip.html(d.data.name + " <b>[" + d.data.valence + "]</b>");
              return tooltip.style("visibility", "visible");
          })
          .on("mousemove", function(){
              return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
          })
          .on("mouseout", function(){
            d3.select(this).style("fill-opacity", 1);
            return tooltip.style("visibility", "hidden");
          });

      g.append("path")
      .attr("d",arc)
      .style("fill",function(d, idx){
          return colors[idx];
        })
       .attr("d", arc)
       .on("mouseover", function(d) {
              d3.select(this).style("fill-opacity", 0.7);
            })
       .on("mouseout", function(d, idx) {
          d3.select(this).style("fill-opacity", 1);
        });

};
