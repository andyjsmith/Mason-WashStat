var roomchooser = document.getElementById("roomchooser");

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
	title: "Washer and Dryer Availability",
	xaxis: {
		tickformat: "%a %I:%M%p"
	},
	yaxis: {
		fixedrange: true
	},
	font: {
		family: "Arial, monospace",
		size: 12,
		color: "#000000"
	}
};

Plotly.newPlot("history", data, layout);


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
	title: "Washer and Dryer Averages",
	xaxis: {
		//tickformat: "%a %I:%M%p"
	},
	yaxis: {
		fixedrange: true
	},
	font: {
		family: "Arial, monospace",
		size: 12,
		color: "#000000"
	}
};

Plotly.newPlot("average", dataAvg, layoutAvg);

function compare(a,b) {
	if (a.timecode < b.timecode)
		return -1;
	if (a.timecode > b.timecode)
		return 1;
	return 0;
}

function timecodeToTime(timecode) {
	if (timecode.substr(1, 2) >= 12) {
		return ((timecode.substr(1, 2) - 12 == 0 ? "12" : timecode.substr(1, 2) - 12)) + ":" + timecode.substr(3) + "0" + " PM";
	} else {
		return (timecode.substr(1, 2) == 0 ? "12" : timecode.substr(1, 2)) + ":" + timecode.substr(3) + "0" + " AM";
	}
}

var averageData;
var daychooser = document.getElementById("daychooser");
daychooser.addEventListener("change", () => {
	clearAverage();
	redrawAverage();
});

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

function clearAverage() {
	dryerAvgData.x = []
	dryerAvgData.y = []
	washerAvgData.x = []
	washerAvgData.y = []
	Plotly.redraw("average");
}

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