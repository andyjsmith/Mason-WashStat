// Check if the device is mobile
function isMobile() {
	return /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);
}

// Clear the average chart
function clearAverage() {
	dryerAvgData.x = []
	dryerAvgData.y = []
	washerAvgData.x = []
	washerAvgData.y = []
	Plotly.redraw("average");
}

// Redraw the average chart with data from averageData
function redrawAverage() {
	averageData.forEach(element => {
		if(element["timecode"].toString()[0] === daychooser.value) {
		dryerAvgData.x.push(timecodeToTime(element["timecode"]));
		dryerAvgData.y.push(element["available_dryers"]);
		washerAvgData.x.push(timecodeToTime(element["timecode"]));
		washerAvgData.y.push(element["available_washers"]);
		}
	});
	Plotly.redraw("average");
}

// Definitions for the history chart
var dryerData = {
	x: [],
	y: [],
	mode: "lines",
	name: "Dryers"
};

var washerData = {
	x: [],
	y: [],
	mode: "lines",
	name: "Washers",
	tickformat: "%H~%M~%S.%2f"
};

var data = [washerData, dryerData];

var layout = {
	title: "Available machines last 12 hours",
	xaxis: {
		tickformat: "%a %I:%M%p",
		fixedrange: false,
		tickmode: "auto",
		nticks: 12
	},
	yaxis: {
		fixedrange: true
	},
	font: {
		family: "Arial, monospace",
		size: 12,
		color: "#000000"
	},
	margin: {
		l: 25,
		r: 25,
		b: 100,
		t: 100,
		pad: 4
	},
	legend: {
		"orientation": "h",
		x: 0,
		y: -0.35
	}
};

// Definitions for the average chart
var dryerAvgData = {
	x: [],
	y: [],
	mode: "lines",
	line: {shape: "spline"},
	name: "Dryers"
};

var washerAvgData = {
	x: [],
	y: [],
	mode: "lines",
	name: "Washers",
	line: {shape: "spline"},
	tickformat: "%H~%M~%S.%2f"
};

var dataAvg = [washerAvgData, dryerAvgData];

var layoutAvg = {
	title: "Daily averages",
	xaxis: {
		fixedrange: false,
		tickmode: "auto",
		nticks: 24
	},
	yaxis: {
		fixedrange: true
	},
	font: {
		family: "Arial, monospace",
		size: 12,
		color: "#000000"
	},
	margin: {
		l: 25,
		r: 25,
		b: 100,
		t: 100,
		pad: 4
	},
	legend: {
		"orientation": "h",
		x: 0,
		y: -0.3
	}
};

// Disable zooming if on mobile to prevent accidental zooms and confusion
if (isMobile()) {
	layout.xaxis.fixedrange = true;
	layoutAvg.xaxis.fixedrange = true;
}

// Create the plots
Plotly.newPlot("history", data, layout, {responsive: true});
Plotly.newPlot("average", dataAvg, layoutAvg, {responsive: true});

// Custom comparison function for sorting timecodes
function compare(a,b) {
	if (a.timecode < b.timecode)
		return -1;
	if (a.timecode > b.timecode)
		return 1;
	return 0;
}

// Convert a timecode into a 12-hour time
function timecodeToTime(timecode) {
	if (timecode.substr(1, 2) >= 12) {
		return ((timecode.substr(1, 2) - 12 == 0 ? "12" : timecode.substr(1, 2) - 12)) + ":" + timecode.substr(3) + "0" + " PM";
	} else {
		return (timecode.substr(1, 2) == 0 ? "12" : timecode.substr(1, 2)) + ":" + timecode.substr(3) + "0" + " AM";
	}
}

// Where the averaged data is stored
var averageData;

// Get the two select elements
var roomchooser = document.getElementById("roomchooser");
var daychooser = document.getElementById("daychooser");

// Clear and redraw the average chart when a day is chosen
daychooser.addEventListener("change", () => {
	clearAverage();
	redrawAverage();
});

// Request new data when the room is changed
roomchooser.addEventListener("change", () => {
	$.get("/api/history/" + roomchooser.value, function(data) {
		data.forEach(element => {
			dryerData.x.push(new Date(element["time"]));
			dryerData.y.push(element["available_dryers"]);
			washerData.x.push(new Date(element["time"]));
			washerData.y.push(element["available_washers"]);
		});
		Plotly.redraw("history");
	});

	dryerData.x = []
	dryerData.y = []
	washerData.x = []
	washerData.y = []
	data.forEach(element => {
		dryerData.x.push(new Date(element["time"]));
		dryerData.y.push(element["available_dryers"]);
		washerData.x.push(new Date(element["time"]));
		washerData.y.push(element["available_washers"]);
	});
	Plotly.redraw("history");

	// Clear the average graph and request new data
	clearAverage();
	$.get("/api/average/" + roomchooser.value, function(data) {
		averageData = data.sort(compare);
		redrawAverage();
	});
});