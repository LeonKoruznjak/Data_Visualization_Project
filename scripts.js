// Set dimensions and margins of the SVG
const width = 1000;
const height = 600;

// Define the zoom behavior
const zoom = d3.zoom().on("zoom", (event) => {
  svg.attr("transform", event.transform);
});

// Create SVG element
const svg = d3
  .select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .call(zoom) // Apply zoom behavior
  .append("g");

// Define the map projection
const projection = d3
  .geoMercator()
  .center([-87.6298, 41.8781]) // Center of Chicago
  .scale(50000) // Adjust scale as needed
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Create a tooltip div
const tooltip = d3.select(".tooltip");

// Load and display the GeoJSON data for Chicago
d3.json("chicago.geojson")
  .then(function (chicago) {
    svg.append("path").datum(chicago).attr("d", path).attr("class", "boundary");

    // Load the crime data
    d3.csv("cleaned_crime_data1.csv")
      .then(function (data) {
        updateMap(data);
        updateGraph1(data);
        updateGraph2(data);
        updateGraph3(data);
        updateGraph4(data);

        // Update map when month slider changes
        d3.select("#monthSlider").on("input", function () {
          updateMap(data);
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          d3.select("#selectedMonth").text(monthNames[this.value]);
          updateDaySlider(this.value);
        });

        d3.select("#wholeMonth").on("input", function () {
          updateMap(data);
          updateGraph1(filteredData, selectedCrimeType);
        });

        // Update map when year slider changes
        d3.select("#yearSlider").on("input", function () {
          const selectedYear = parseInt(this.value);
          updateGraph4(data, selectedYear);
          d3.select("#selectedYear").text(selectedYear);
          updateMap(data);
          d3.select("#selectedYear").text(this.value);
        });

        // Update map when day slider changes
        d3.select("#daySlider").on("input", function () {
          updateMap(data);
          d3.select("#selectedDay").text(this.value);
        });

        // Update day slider based on selected month
        function updateDaySlider(monthIndex) {
          const daysInMonth = new Date(2021, monthIndex + 1, 0).getDate(); // Get number of days in the selected month
          d3.select("#daySlider").attr("max", daysInMonth); // Set the max value of the day slider
          if (document.getElementById("wholeMonth").checked) {
            d3.select("#daySlider").property("value", daysInMonth); // Set the day slider value to the max if whole month is selected
            d3.select("#selectedDay").text(daysInMonth);
          }
        }

        let initialTransform;

        // Store the initial zoom transform
        svg.call(zoom.transform, (initialTransform = d3.zoomIdentity));

        function zoomToLocation([longitude, latitude]) {
          const [[x0, y0], [x1, y1]] = [
            projection([longitude, latitude]),
            projection([longitude, latitude]),
          ];
          svg
            .transition()
            .duration(750)
            .call(
              zoom.transform,
              d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(8) // Adjust zoom scale as needed
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
            );
        }

        // Update map when crime type changes
        d3.select("#crimeType").on("change", function () {
          const selectedCrimeType = this.value; // Get the selected crime type
          updateMap(data);
          updateGraph2(data, selectedCrimeType); // Update graph 2
        });

        function displayPopup(event, d) {
          // Zoom in
          const longitude = +d.Longitude;
          const latitude = +d.Latitude;
          zoomToLocation([longitude, latitude]);

          const crimeDate = new Date(d.Date);
          const arrestMade =
            d.Arrest.toString().toLowerCase() === "true" ? "True" : "False"; // Ensure correct interpretation
          const popupContent = `
            <div>
              <p>Date: ${crimeDate.toDateString()}</p>
              <p>Primary Type: ${d["Primary Type"]}</p>
              <p>Description: ${d.Description}</p>
              <p>Location: ${d["Location Description"]}</p>
              <p>Arrest made: ${arrestMade}</p>
              <button id="closePopup">Close</button>
            </div>
          `;
          // Add the popup to the body
          d3.select("body")
            .append("div")
            .attr("class", "popup")
            .html(popupContent)
            .style("left", event.pageX + "px")
            .style("top", event.pageY + "px");

          // Add event listener to the close button
          d3.select("#closePopup").on("click", function () {
            // Remove the popup
            d3.select(".popup").remove();
            // Zoom out to the original view
            svg
              .transition()
              .duration(750)
              .call(zoom.transform, initialTransform);
          });

          // Prevent map click event propagation
          d3.event.stopPropagation();
        }

        // Add event listeners to the dots outside the updateMap function
        svg.selectAll("circle").on("click", function (event, d) {
          displayPopup(event, d);
        });

        // Update map based on selected filters
        function updateMap(data) {
          const selectedMonth = parseInt(
            d3.select("#monthSlider").node().value
          );
          const selectedYear = parseInt(d3.select("#yearSlider").node().value);
          const selectedDay = parseInt(d3.select("#daySlider").node().value);
          const wholeMonth = document.getElementById("wholeMonth").checked;
          const selectedCrimeType = d3.select("#crimeType").node().value;

          const filteredData = data.filter(function (d) {
            const crimeDate = new Date(d.Date);
            const crimeMonth = crimeDate.getMonth();
            const crimeYear = crimeDate.getFullYear();
            const crimeDay = crimeDate.getDate();

            let crimeTypeCheck = true;
            if (selectedCrimeType !== "all") {
              crimeTypeCheck = d["Primary Type"] === selectedCrimeType;
            }

            if (wholeMonth) {
              return (
                crimeMonth === selectedMonth &&
                crimeYear === selectedYear &&
                crimeTypeCheck
              );
            } else {
              return (
                crimeMonth === selectedMonth &&
                crimeYear === selectedYear &&
                crimeDay === selectedDay &&
                crimeTypeCheck
              );
            }
          });

          // Remove existing circles
          svg.selectAll("circle").remove();

          // Add new circles based on filtered data
          svg
            .selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
              return projection([+d.Longitude, +d.Latitude])[0];
            })
            .attr("cy", function (d) {
              return projection([+d.Longitude, +d.Latitude])[1];
            })
            .attr("r", 2)
            .attr("fill", "red")
            .attr("opacity", 0.5)
            .on("mouseover", function (event, d) {
              d3.select(this).attr("fill", "yellow");
              tooltip.transition().duration(200).style("opacity", 0.9);
              const crimeDate = new Date(d.Date);
              tooltip
                .html(
                  `Date: ${crimeDate.toDateString()}<br>
                          Primary Type: ${d["Primary Type"]}<br>
                          Description: ${d.Description}<br>
                          Location: ${d["Location Description"]}`
                )
                .style("left", event.pageX + 5 + "px")
                .style("top", event.pageY - 28 + "px");
            })
            .on("mousemove", function (event, d) {
              tooltip
                .style("left", event.pageX + 5 + "px")
                .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", function (event, d) {
              d3.select(this).attr("fill", "red");
              tooltip.transition().duration(500).style("opacity", 0);
            })
            .on("click", function (event, d) {
              const longitude = +d.Longitude;
              const latitude = +d.Latitude;
              zoomToLocation([longitude, latitude]);
            });

          // Call updateGraph1 with selected crime type
          updateGraph1(filteredData, selectedCrimeType);

          updateGraph3(filteredData, selectedCrimeType);
          // Add event listeners to the dots outside the updateMap function
          svg.selectAll("circle").on("click", function (event, d) {
            displayPopup(event, d);
          });
        }

        function updateGraph1(data, selectedCrimeType) {
          const width = 220;
          const height = 220;
          const radius = Math.min(width, height) / 2;
          const margin = { top: 30, right: 20, bottom: 30, left: 100 };

          // Select the existing SVG element and remove it
          d3.select("#graph1").select("svg").remove();

          const svg = d3
            .select("#graph1")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

          // Append title
          svg
            .append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text("Arrest Percentages by Crime Type");

          const graph = svg
            .append("g")
            .attr(
              "transform",
              "translate(" +
                (width / 2 + margin.left) +
                "," +
                (height / 2 + margin.top) +
                ")"
            );

          const pie = d3.pie().value((d) => d.value);

          let dataReady = [];
          if (data.length === 0) {
            // If there's no data, display a message
            graph
              .append("text")
              .text("No data available")
              .attr("text-anchor", "middle")
              .attr("fill", "red")
              .attr("font-size", "14px")
              .attr("dy", "-0.5em");
          } else {
            // If "All" crime types are selected, calculate overall arrest percentages
            if (selectedCrimeType === "all") {
              dataReady = d3.rollups(
                data,
                (v) => v.length,
                (d) => d.Arrest
              );
            } else {
              dataReady = d3.rollups(
                data.filter((d) => d["Primary Type"] === selectedCrimeType),
                (v) => v.length,
                (d) => d.Arrest
              );
            }

            // Define explicit color mapping
            const colorMapping = { true: "orange", false: "blue" };

            const arc = d3.arc().innerRadius(0).outerRadius(radius);

            const arcs = graph
              .selectAll(".arc")
              .data(pie(dataReady.map((d) => ({ key: d[0], value: d[1] }))))
              .enter()
              .append("g")
              .attr("class", "arc");

            arcs
              .append("path")
              .attr("d", arc)
              .attr("fill", (d) => {
                // Log the key to debug
                console.log(d.data.key);
                return colorMapping[d.data.key.toString().toLowerCase()];
              })
              .transition()
              .duration(1000)
              .attrTween("d", function (d) {
                const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return function (t) {
                  return arc(i(t));
                };
              });

            arcs
              .append("text")
              .attr("transform", function (d) {
                return "translate(" + arc.centroid(d) + ")";
              })
              .attr("dy", "0.35em")
              .attr("text-anchor", "middle")
              .style("opacity", 0) // Initially hidden
              .transition()
              .delay(1000) // Delay to start after pie slices animation
              .duration(500)
              .style("opacity", 1) // Fade in
              .text(
                (d) => `${((d.data.value / data.length) * 100).toFixed(2)}%`
              );

            // Tooltip handling
            arcs
              .on("mouseover", function (event, d) {
                d3.select(this).select("path").attr("opacity", 0.7);
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip
                  .html(
                    `Arrest made: ${d.data.key}<br>Count: ${d.data.value} (${(
                      (d.data.value / data.length) *
                      100
                    ).toFixed(2)}%)`
                  )
                  .style("left", event.pageX + 5 + "px")
                  .style("top", event.pageY - 28 + "px");
              })
              .on("mousemove", function (event) {
                tooltip
                  .style("left", event.pageX + 5 + "px")
                  .style("top", event.pageY - 28 + "px");
              })
              .on("mouseout", function () {
                d3.select(this).select("path").attr("opacity", 1);
                tooltip.transition().duration(500).style("opacity", 0);
              });
          }
        }

        // Function to update the graph based on selected crime type
        function updateGraph2(data, selectedCrimeType) {
          const width = 400;
          const height = 450;
          const margin = { top: 30, right: 20, bottom: 30, left: 60 };

          // Remove existing SVG element
          d3.select("#graph2 svg").remove();

          const svg = d3
            .select("#graph2")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr(
              "transform",
              "translate(" + margin.left + "," + margin.top + ")"
            );

          // Filter data based on selected crime type
          const filteredData =
            selectedCrimeType !== "all"
              ? data.filter((d) => d["Primary Type"] === selectedCrimeType)
              : data;

          // Roll up the filtered data by year
          const dataReady = d3.rollups(
            filteredData,
            (v) => v.length,
            (d) => new Date(d.Date).getFullYear()
          );

          // Sort the data by year
          dataReady.sort((a, b) => a[0] - b[0]);

          const x = d3
            .scaleBand()
            .domain(dataReady.map((d) => d[0]))
            .range([0, width - margin.left - margin.right])
            .padding(0.1);

          const y = d3
            .scaleLinear()
            .domain([0, d3.max(dataReady, (d) => d[1])])
            .nice()
            .range([height - margin.top - margin.bottom, 0]);

          svg
            .append("g")
            .selectAll("rect")
            .data(dataReady)
            .enter()
            .append("rect")
            .attr("x", (d) => x(d[0]))
            .attr("y", (d) => y(0))
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .attr("fill", "steelblue")
            .on("mouseover", function (event, d) {
              d3.select(this).attr("fill", "orange");
              tooltip.transition().duration(200).style("opacity", 0.9);
              tooltip
                .html(`Year: ${d[0]} <br> Count: ${d[1]}`)
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 20 + "px");
            })
            .on("mouseout", function () {
              d3.select(this).attr("fill", "steelblue");
              tooltip.transition().duration(500).style("opacity", 0);
            })
            .transition()
            .duration(1000)
            .attr("y", (d) => y(d[1]))
            .attr("height", (d) => y(0) - y(d[1]));

          svg
            .append("g")
            .attr(
              "transform",
              "translate(0," + (height - margin.top - margin.bottom) + ")"
            )
            .call(d3.axisBottom(x));

          svg.append("g").call(d3.axisLeft(y));

          // Tooltip handling
          const tooltip = d3
            .select("#graph2")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip");

          svg
            .append("text")
            .attr("x", width / 2)
            .attr("y", 0 - margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Number of Crimes by Year");
        }

        function updateGraph3(data, selectedCrimeType) {
          const width = 400;
          const height = 450;
          const margin = { top: 40, right: 20, bottom: 90, left: 70 };

          // Select the existing SVG element and remove it
          d3.select("#graph3").select("svg").remove();

          const svg = d3
            .select("#graph3")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr(
              "transform",
              "translate(" + margin.left + "," + margin.top + ")"
            );

          let filteredData = data;
          if (selectedCrimeType !== "all") {
            filteredData = data.filter(
              (d) => d["Primary Type"] === selectedCrimeType
            );
          }

          const dataReady = d3.rollups(
            filteredData,
            (v) => v.length,
            (d) => d["Location Description"]
          );

          dataReady.sort((a, b) => b[1] - a[1]);

          const top5 = dataReady.slice(0, 5);

          const x = d3
            .scaleBand()
            .domain(top5.map((d) => d[0]))
            .range([0, width - margin.left - margin.right])
            .padding(0.1);

          const y = d3
            .scaleLinear()
            .domain([0, d3.max(top5, (d) => d[1])])
            .nice()
            .range([height - margin.top - margin.bottom, 0]);

          svg
            .append("g")
            .selectAll("rect")
            .data(top5)
            .enter()
            .append("rect")
            .attr("x", (d) => x(d[0]))
            .attr("y", height - margin.top - margin.bottom) // Start from the bottom
            .attr("width", x.bandwidth())
            .attr("height", 0) // Initially zero height
            .attr("fill", "steelblue")
            .on("mouseover", function (event, d) {
              // Show tooltip on hover
              tooltip.transition().duration(200).style("opacity", 0.9);
              tooltip
                .html(`Count: ${d[1]}`)
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 20 + "px");
            })
            .on("mouseout", function () {
              // Hide tooltip on mouseout
              tooltip.transition().duration(500).style("opacity", 0);
            })
            .transition()
            .duration(1000)
            .attr("y", (d) => y(d[1]))
            .attr(
              "height",
              (d) => height - margin.top - margin.bottom - y(d[1])
            ); // Animate bar heights

          svg
            .append("g")
            .attr(
              "transform",
              "translate(0," + (height - margin.top - margin.bottom) + ")"
            )
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-50)") // Rotate text at -30 degrees
            .style("text-anchor", "end"); // Align text to the end

          svg.append("g").call(d3.axisLeft(y));

          svg
            .append("text")
            .attr("x", width / 2)
            .attr("y", 0 - margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Top 5 Locations");
        }

        // Line chart comparing years
        function updateGraph4(data, selectedYear) {
          const width = 350;
          const height = 250;
          const margin = { top: 40, right: 40, bottom: 30, left: 70 };

          // Filter data for the selected year
          const yearData = data.filter(
            (d) => new Date(d.Date).getFullYear() === selectedYear
          );

          // Count crimes per month for the selected year
          const monthCounts = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const count = yearData.filter(
              (d) => new Date(d.Date).getMonth() + 1 === month
            ).length;
            return { month, count };
          });

          // Define an array of month names
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];

          // Remove previous SVG element if it exists
          d3.select("#graph4 svg").remove();

          // Create SVG element
          const svg = d3
            .select("#graph4")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

          // Create scales
          const xScale = d3
            .scaleBand()
            .domain(monthCounts.map((d) => monthNames[d.month - 1])) // Use month names
            .range([0, width - margin.left - margin.right])
            .padding(0.1);

          const yScale = d3
            .scaleLinear()
            .domain([0, d3.max(monthCounts, (d) => d.count)])
            .nice()
            .range([height - margin.bottom, 0]);

          // Create line function
          const line = d3
            .line()
            .x((d) => xScale(monthNames[d.month - 1]) + xScale.bandwidth() / 2) // Use month names
            .y((d) => yScale(d.count));

          // Append line path
          const path = svg
            .append("path")
            .datum(monthCounts)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

          // Get the total length of the path
          const totalLength = path.node().getTotalLength();

          // Set the initial style of the line
          path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(1000)
            .attr("stroke-dashoffset", 0); // Animate the line to draw it

          // Append data points
          svg
            .selectAll(".point")
            .data(monthCounts)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr(
              "cx",
              (d) => xScale(monthNames[d.month - 1]) + xScale.bandwidth() / 2
            ) // Use month names
            .attr("cy", (d) => yScale(d.count))
            .attr("r", 4)
            .attr("fill", "steelblue")
            .style("opacity", 0)
            .on("mouseover", function (event, d) {
              d3.select(this).attr("r", 6);
              tooltip.transition().duration(200).style("opacity", 0.9);
              tooltip
                .html(`Month: ${monthNames[d.month - 1]}<br>Crimes: ${d.count}`) // Use month names
                .style("left", event.pageX + 5 + "px")
                .style("top", event.pageY - 28 + "px");
            })
            .on("mousemove", function (event) {
              tooltip
                .style("left", event.pageX + 5 + "px")
                .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", function () {
              d3.select(this).attr("r", 4);
              tooltip.transition().duration(500).style("opacity", 0);
            })
            .transition()
            .delay(1000)
            .style("opacity", 1);

          // Append x axis
          svg
            .append("g")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

          // Append y axis
          svg.append("g").call(d3.axisLeft(yScale));

          // Append title
          svg
            .append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`Crimes Per Month in ${selectedYear}`);
        }
      })
      .catch(function (error) {
        console.error("Error loading or processing crime data:", error);
      });
  })
  .catch(function (error) {
    console.error("Error loading or processing GeoJSON data:", error);
  });
