// Based on https://bl.ocks.org/pbogden/854425acb57b4e5a4fdf4242c068a127 with edits by Alice Liang

function drawForce(tag, d, num, z) {

  let margin = {top: 100, right: 100, bottom: 0, left: 100};

  let width = 600,
      height = 650,
      padding = 1.5, // separation between same-color circles
      clusterPadding = 0.3, // separation between different-color circles
      maxRadius = height*0.03;

  let n = num, // total number of nodes
      m = 10, // number of distinct clusters
      // z = d3.scaleOrdinal(d3.schemeCategory20),
      clusters = new Array(m);

  let svg = d3.select(tag)
      .append('svg')
      .attr('height', height)
      .attr('width', width)
      .append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

  var tooltip = d3.select("body")
      	.append("div")
      	.style("position", "absolute")
      	.style("z-index", "10")
      	.style("visibility", "hidden")
        .attr("class","force-tip");

  let radiusScale = d3.scaleLinear()
      .domain(d3.extent(d, function(d) { return +d.energy;} ))
      .range([1, maxRadius]);

  // console.log(radiusScale(300000));

    let nodes = d.map((d) => {
      // scale radius to fit on the screen
      let scaledRadius  = radiusScale(+d.energy),
          forcedCluster = +d.playlist_num;

      // add cluster id and radius to array
      d = {
        cluster     : forcedCluster,
        r           : scaledRadius,
        energy      : d.energy,
        track       : d.track,
        playlist    : d.playlist
      };
      // add to clusters array if it doesn't exist or the radius is larger than another radius in the cluster
      if (!clusters[forcedCluster] || (scaledRadius > clusters[forcedCluster].r)) clusters[forcedCluster] = d;

      return d;
    });


    // append the circles to svg then style
    // add functions for interaction
    let circles = svg.append('g')
          .datum(nodes)
        .selectAll('.circle')
          .data(d => d)
        .enter().append('circle')
          .attr('r', (d) => d.r)
          .attr('fill', (d) => z(d.cluster))
          .attr('stroke', 'black')
          .attr('stroke-width', 1)
          .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended))
          // // add tooltips to each circle
          // .on("mouseover", function(d) {
          //     d3.select(this).style("fill-opacity", 0.7);
          //     div.transition()
          //         .duration(200)
          //         .style("opacity", .9);
          //     div.html(d.playlist + ": " + d.track + " [<b>" + d.energy + "</b>]")
          //         .style("left", (d3.event.pageX) + "px")
          //         .style("top", (d3.event.pageY - 28) + "px");
          //     })
          // .on("mouseout", function(d) {
          //     d3.select(this).style("fill-opacity", 1);
          //     div.transition()
          //         .duration(500)
          //         .style("opacity", 0);
          // });
          .on("mouseover", function(d){
              d3.select(this).style("fill-opacity", 0.7);
              tooltip.html(d.playlist + ": " + d.track + " [<b>" + d.energy + "</b>]");
              return tooltip.style("visibility", "visible");
          })
          .on("mousemove", function(){
              return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
          })
          .on("mouseout", function(){
              d3.select(this).style("fill-opacity", 1);
              return tooltip.style("visibility", "hidden");
          });


    // create the clustering/collision force simulation
    let simulation = d3.forceSimulation(nodes)
        .velocityDecay(0.2)
        .force("x", d3.forceX().strength(.0005))
        .force("y", d3.forceY().strength(.0005))
        .force("collide", collide)
        .force("cluster", clustering)
        .on("tick", ticked);

    function ticked() {
        circles
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y);
    }

    // Drag functions used for interactivity
    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // These are implementations of the custom forces.
    function clustering(alpha) {
        nodes.forEach(function(d) {
          var cluster = clusters[d.cluster];
          if (cluster === d) return;
          var x = d.x - cluster.x,
              y = d.y - cluster.y,
              l = Math.sqrt(x * x + y * y),
              r = d.r + cluster.r;
          if (l !== r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            cluster.x += x;
            cluster.y += y;
          }
        });
    }

    function collide(alpha) {
      var quadtree = d3.quadtree()
          .x((d) => d.x)
          .y((d) => d.y)
          .addAll(nodes);

      nodes.forEach(function(d) {
        var r = d.r + maxRadius + Math.max(padding, clusterPadding),
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function(quad, x1, y1, x2, y2) {

          if (quad.data && (quad.data !== d)) {
            var x = d.x - quad.data.x,
                y = d.y - quad.data.y,
                l = Math.sqrt(x * x + y * y),
                r = d.r + quad.data.r + (d.cluster === quad.data.cluster ? padding : clusterPadding);
            if (l < r) {
              l = (l - r) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.data.x += x;
              quad.data.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      });
    }


}
