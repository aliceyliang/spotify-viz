// based on http://bl.ocks.org/tjdecke/5558084 with edits by Alice Liang

function drawHeat(tag, data) {

        const margin = { top: 100, right: 0, bottom: 120, left: 160 },
            width = 700 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom,
            gridSize = Math.floor(width / 24),
            legendElementWidth = gridSize,
            buckets = 5,
            colors = ["#ffffff",'#edf8e9','#bae4b3','#74c476','#238b45']

        const svg = d3.select(tag).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        const listLabels = svg.selectAll(".listLabel")
            .data(_.uniq(_.map(data, 'playlist')))
            .enter().append("text")
              .text(function (d) { return d; })
              .attr("x", 0)
              .attr("y", (d, i) => i * gridSize)
              .style("text-anchor", "end")
              .attr("transform", "translate(-30," + gridSize / 1.5 + ") ")

              var tooltip = d3.select("body")
              	.append("div")
              	.style("position", "absolute")
              	.style("z-index", "10")
              	.style("visibility", "hidden");

        const timeLabels = svg.selectAll(".timeLabel")
          .data(_.uniq(_.map(data, 'key')))
          .enter().append("text")
            .text(function(d) { return d; })
            .attr("transform", function(d, i) {
                  return "translate(" + ( i * gridSize) + ",0)"
                          + `translate(${-18+(gridSize / 2)}, -10) rotate(-90)`;
             } )
            .style("text-anchor", "start")
            .attr("class", function(d, i) { return ((i >= 8 && i <= 16) ?
                                       "timeLabel mono axis axis-worktime" :
                                       "timeLabel mono axis");
             });

            const maxVal = d3.max(data, (d) => d.value);

            const colorScale = d3.scaleQuantile()
              .domain([0, 0.001, maxVal/4, 1*maxVal/3, maxVal])
              // .domain([0, buckets - 1, d3.max(data, (d) => d.value)])
              .range(colors);

              // debugger;

            const cards = svg.selectAll(".hour")
                .data(data, (d) => d.idx+':'+d.keyIndex);

            cards.append("title");

            cards.enter().append("rect")
                .attr("x", (d) => (d.keyIndex - 1) * gridSize)
                .attr("y", (d) => (d.idx - 1) * gridSize)
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("class", "hour bordered")
                .attr("width", gridSize)
                .attr("height", gridSize)
                .style("fill", colors[0])
               .on("mouseover", function(d){
                   tooltip.html(Math.round(d.value*10000)/100+"%");
                   return tooltip.style("visibility", "visible");
               })
               .on("mousemove", function(){
                   return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
               })
               .on("mouseout", function(){
                 return tooltip.style("visibility", "hidden");
               })
              .merge(cards)
                .transition()
                .duration(1000)
                .style("fill", (d) => colorScale(d.value));

            cards.select("title").text((d) => d.value);

            cards.exit().remove();

            const legend = svg.selectAll(".legend")
                .data([0].concat(colorScale.quantiles()), (d) => d);

            const legend_g = legend.enter().append("g")
                .attr("class", "legend");

            legend_g.append("rect")
              .attr("x", (d, i) => legendElementWidth * i * 2)
              .attr("y", height + gridSize/2) // height + 100)
              .attr("width", legendElementWidth * 2)
              .attr("height", gridSize /2)
              .style("fill", (d, i) => colors[i]);

            legend_g.append("text")
              .attr("class", "mono")
              .text(function(d) {
                  if (d!==0) {
                     return " > " + Math.round(d*100) + "%"
                      }
                  })
              .attr("x", (d, i) => 5+(legendElementWidth * i * 2))
              .attr("y", height + gridSize/2);

            legend.exit().remove();
        };
