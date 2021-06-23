// https://observablehq.com/@eightants/moving-bubble-chart-using-d3-js-internship-search-data-w-per@396
export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["2021search.csv",new URL("./files/bed52ca013b9c31f8fadc251dfd61653b595532e28f1455e86d31d5232f05891541f6d43e7fa8362dcdda91f2c094961968fa95136e95961946cc10318db149c",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# Moving Bubble Chart Using D3.js (Internship Search Data w/ Persisting Bubble Colors)`
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5")
)});
  main.variable(observer("width")).define("width", function(){return(
860
)});
  main.variable(observer("height")).define("height", function(){return(
600
)});
  main.variable(observer("radius")).define("radius", function(){return(
2
)});
  main.variable(observer("padding")).define("padding", function(){return(
1
)});
  main.variable(observer("cluster_padding")).define("cluster_padding", function(){return(
5
)});
  main.variable(observer("groups")).define("groups", ["width","height"], function(width,height)
{
  const groups = {
    "wait": { x: 1*width/4, y: 3*height/6, color: "#BEE5AA", cnt: 0, fullname: "Waiting" },
    "vac": { x: 2*width/4, y: 3*height/6, color: "#93D1BA", cnt: 0, fullname: "Vaccinating" },
    "obs": { x: 3*width/4, y: 3*height/6, color: "#a579ce", cnt: 0, fullname: "Observation" },
  };
  return groups
}
);
  main.variable(observer("stages")).define("data", ["FileAttachment"], function(FileAttachment){return(
FileAttachment("2021search.csv").csv({typed: true})
)});
  main.variable(observer("people")).define("people", ["stages","d3"], function(stages,d3)
{
  const people = {};
  stages.forEach(d => {
    if (d3.keys(people).includes(d.pid + "")) {
      people[d.pid + ""].push(d);
    } else {
      people[d.pid + ""] = [d];
    }
  });
  return people
}
);
  main.variable(observer("nodes")).define("nodes", ["d3","people","groups","radius"], function(d3,people,groups,radius){return(
d3.keys(people).map(function(d) {
  // Initialize count for each group.
  groups[people[d][0].grp].cnt += 1;
  return {
    id: "node"+d,
    x: groups[people[d][0].grp].x + Math.random(),
    y: groups[people[d][0].grp].y + Math.random(),
    r: radius,
    color: groups[people[d][Math.max(people[d].length -2,1)].grp].color,
    group: people[d][0].grp,
    timeleft: people[d][0].duration,
    entry : people[d][0].entry,
    exit: people[d][0].exit,
    istage: 0,
    stages: people[d]
  }
})
)});
  main.variable(observer()).define(["html"], function(html){return(
html`<!DOCTYPE html>
<head>
  <meta charset="utf-8">
  <title>Timed Moving Bubbles</title>
  <link rel="stylesheet" href="style/style.css" type="text/css" media="screen" />
</head>
 
<div id="main-wrapper">
  <div id="chart"></div>
  <h1 id="timecount">Time so far: <span class="cnt">0</span></h1>
</div><!-- @end #main-wrapper -->
`
)});
  main.variable(observer("chart")).define("chart", ["d3","width","height","nodes","groups","forceCluster","forceCollide"], function(d3,width,height,nodes,groups,forceCluster,forceCollide)
{
  // Variables.
  var time_so_far = 0;
  console.log(JSON.stringify(nodes));
  // The SVG object.
  // const svg = d3.select("#chart").append("svg")
  //   .attr("width", width + 20 + 20)
  //   .attr("height", height + 20 + 20)
  //   .append("g")
  //   .attr("transform", "translate(" + 20 + "," + 20 + ")");
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width+40, height+40]);
  
  // ???
  svg.append("g")
    .attr("transform", "translate(" + 20 + "," + 20 + ")");
    
  // ???
  d3.select("#chart").style("width", (width + 20 + 20) + "px");

  // Circle for each node.
  const circle = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("fill", d => d.color);
  
  // Group name labels
  svg.selectAll('.grp')
    .data(d3.keys(groups))
    .join("text")
    .attr("class", "grp")
    .attr("text-anchor", "middle")
    .attr("x", d => groups[d].x)
    .attr("y", d => groups[d].y + 100)
    .text(d => groups[d].fullname);

  // Group counts
  svg.selectAll('.grpcnt')
    .data(d3.keys(groups))
    .join("text")
    .attr("class", "grpcnt")
    .attr("text-anchor", "middle")
    .attr("x", d => groups[d].x)
    .attr("y", d => groups[d].y + 80)
    .text(d => d3.format(",.0f")(groups[d].cnt));
  
  // Forces
  const simulation = d3.forceSimulation(nodes)
    .force("x", d => d3.forceX(d.x))
    .force("y", d => d3.forceY(d.y))
    .force("cluster", forceCluster())
    .force("collide", forceCollide())
    .alpha(.09)
    .alphaDecay(0);

  // Adjust position of circles.
  simulation.on("tick", () => {
    circle
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)

      circle.attr("fill", d => { if (groups[d.group].color == "match") { return d.color }return groups[d.group].color});
  });
  
  const textb = svg.append("text").text("").attr("x", 60).attr("y", 100).attr("fill", "black");
  let startdate = new Date(2020, 6, 1,8,0)
  
  // Make time pass. Adjust node stage as necessary.
  function timer() {
     circle
     .filter(function(d,i){ return d.entry == time_so_far; })
     .transition()
     .delay((d, i) => i * 5)
     .duration(800)
     .attrTween("r", d => {
      const i = d3.interpolate(0, d.r);
      return t => d.r = i(t);
    })
     .transition()
     .delay(function(d,i) {return 1000*(d.entry-d.exit)})
     .ease(d3.easeCubicIn)
     .attr("r", 80)
     .attr("stroke-opacity", 0)
     .remove();
    
    nodes.forEach(function (o, i) {
      o.timeleft -= 1;
      if (o.timeleft == 0 && o.istage < o.stages.length - 1) {
        // Decrease count for previous group.
        groups[o.group].cnt -= 1;
        // Update current node to new group.
        o.istage += 1;
        o.group = o.stages[o.istage].grp;
        o.timeleft = o.stages[o.istage].duration;
        // Increment count for new group.
        groups[o.group].cnt += 1;
      }
    });
    // Increment time.
  
    time_so_far += 1;
    var currdate = new Date(startdate.getTime() + time_so_far * 60000);
    textb.text(currdate.toTimeString());
    // Update counters.
    svg.selectAll('.grpcnt').text(d => d3.format(",.0f")(groups[d].cnt));
    
    if (currdate < new Date(2020, 6, 1,17,30)) {
      d3.timeout(timer, 250);
    }
  } // @end timer()
  
  
  // Start things off after a few seconds.
  d3.timeout(timer, 5000);
  
  return svg.node()
}
);
  main.variable(observer("forceCluster")).define("forceCluster", ["groups"], function(groups){return(
function forceCluster() {
  const strength = .05;
  let nodes;

  function force(alpha) {
    const l = alpha * strength;
    for (const d of nodes) {
      d.vx -= (d.x - groups[d.group].x) * l;
      d.vy -= (d.y - groups[d.group].y) * l;
    }
  }
  force.initialize = _ => nodes = _;

  return force;
}
)});
  main.variable(observer("forceCollide")).define("forceCollide", ["padding","cluster_padding","d3"], function(padding,cluster_padding,d3){return(
function forceCollide() {
  const alpha = 0.2; // fixed for greater rigidity!
  const padding1 = padding; // separation between same-color nodes
  const padding2 = cluster_padding; // separation between different-color nodes
  let nodes;
  let maxRadius;

  function force() {
    const quadtree = d3.quadtree(nodes, d => d.x, d => d.y);
    for (const d of nodes) {
      const r = d.r + maxRadius;
      const nx1 = d.x - r, ny1 = d.y - r;
      const nx2 = d.x + r, ny2 = d.y + r;
      
      quadtree.visit((q, x1, y1, x2, y2) => {
        if (!q.length) do {
          if (q.data !== d) {
            const r = d.r + q.data.r + (d.group === q.data.group ? padding1 : padding2);
            let x = d.x - q.data.x, y = d.y - q.data.y, l = Math.hypot(x, y);
            if (l < r) {
              l = (l - r) / l * alpha;
              d.x -= x *= l, d.y -= y *= l;
              q.data.x += x, q.data.y += y;
            }
          }
        } while (q = q.next);
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    }
  }

  force.initialize = _ => maxRadius = d3.max(nodes = _, d => d.r) + Math.max(padding1, padding2);

  return force;
}
)});
  return main;
}
