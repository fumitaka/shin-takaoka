
function HourMin(hms) {
	var array = hms.split(":")
	var h = parseInt(array[0])
	var m = parseInt(array[1])
	this.hour = h
	this.min = m
}
HourMin.prototype.toString = function() {
	return this.hour + ":" + ("0" + this.min).slice(-2)
};

function compareHourMin(a, b) {
	if (a.hour < b.hour) {
		return -1
	} else if (a.hour > b.hour) {
		return 1
	} else {
		if (a.min < b.min) {
			return -1
		} else if (a.min > b.min) {
			return 1
		} else {
			return 0
		}
	}
}

function compareDepartureTime(a, b) {
	return compareHourMin(a["departure_time"], b["departure_time"])
}

var stops = []
var trips = []
var stop_times = []
var calendar = []
var calendar_dates = []


function readTable(table, data) {
	var lines = data.split(/\r\n|\r|\n/)
	var heads = lines[0].split(",")
	for (var i = 1; i < lines.length; ++i) {
		cols = lines[i].split(",")
		var item = {}
		for (var j = 0; j < cols.length; ++j) {
			item[heads[j]] = cols[j]
		}
		table.push(item)
	}
}

function main() {
	
	var stopDesc = {}
	for (var i = 0; i < stops.length; ++i) {
		stopDesc[stops[i]["stop_id"]] = stops[i]["stop_desc"]
	}
	
	var today = new Date()
	var day = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][today.getDay()]

	var services = {}
	
	for (var i = 0; i < calendar.length; ++i) {
		if (calendar[i][day] == "1") {
			services[calendar[i]["service_id"]] = true
		}
	}
	
	var year = today.getFullYear()
	var month = today.getMonth() + 1
	var date = today.getDate()
	var ymdStr = year.toString() + ("00" + month).slice(-2) + ("00" + date).slice(-2)

	for (var i = 0; i < calendar_dates.length; ++i) {
		if (calendar_dates[i]["date"] == ymdStr) {
			if (calendar_dates[i]["exception_type"] == "1") {
				services[calendar_dates[i]["service_id"]] = undefined
			} else if (calendar_dates[i]["exception_type"] == "2") {
				services[calendar_dates[i]["service_id"]] = true
			}
		}
	}
	
	var trip_headsign = {}
	for (var i = 0; i < trips.length; ++i) {
		if (services[trips[i]["service_id"]]) {
			trip_headsign[trips[i]["trip_id"]] = trips[i]["trip_headsign"]
		}
	}
	
	var southbound = []
	var northbound = []
	for (var i = 0; i < stop_times.length; ++i) {
		if (stop_times[i]["stop_id"] == "TakaokaEkiMinamiGuchi1") {
			if (trip_headsign[stop_times[i]["trip_id"]]) {
				southbound.push({departure_time: new HourMin(stop_times[i]["departure_time"]), headsign: trip_headsign[stop_times[i]["trip_id"]], stop_desc: stopDesc[stop_times[i]["stop_id"]]})
			}
		} else if (stop_times[i]["stop_id"] == "ShinTakaokaEki1" || stop_times[i]["stop_id"] == "ShinTakaokaEki2") {
			if (trip_headsign[stop_times[i]["trip_id"]]) {
				northbound.push({departure_time: new HourMin(stop_times[i]["departure_time"]), headsign: trip_headsign[stop_times[i]["trip_id"]], stop_desc: stopDesc[stop_times[i]["stop_id"]]})
			}
		}
	}
	southbound.sort(compareDepartureTime)
	northbound.sort(compareDepartureTime)
	
	var nowTime = new HourMin("" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds())
	
	var southboundFirst = southbound.length
	for (var i = 0; i < southbound.length; ++i) {
		if (compareHourMin(nowTime, southbound[i]["departure_time"]) < 0) {
			southboundFirst = i
			break
		}
	}

	var northboundFirst = northbound.length
	for (var i = 0; i < northbound.length; ++i) {
		if (compareHourMin(nowTime, northbound[i]["departure_time"]) < 0) {
			northboundFirst = i
			break
		}
	}
	
	document.getElementById("bus-sb-1-stop").textContent = southbound[southboundFirst]["stop_desc"]
	document.getElementById("bus-sb-1-time").textContent = southbound[southboundFirst]["departure_time"]
	document.getElementById("bus-sb-1-dest").textContent = southbound[southboundFirst]["headsign"]
	document.getElementById("bus-sb-2-stop").textContent = southbound[southboundFirst + 1]["stop_desc"]
	document.getElementById("bus-sb-2-time").textContent = southbound[southboundFirst + 1]["departure_time"]
	document.getElementById("bus-sb-2-dest").textContent = southbound[southboundFirst + 1]["headsign"]

	document.getElementById("bus-nb-1-stop").textContent = northbound[northboundFirst]["stop_desc"]
	document.getElementById("bus-nb-1-time").textContent = northbound[northboundFirst]["departure_time"]
	document.getElementById("bus-nb-1-dest").textContent = northbound[northboundFirst]["headsign"]
	document.getElementById("bus-nb-2-stop").textContent = northbound[northboundFirst + 1]["stop_desc"]
	document.getElementById("bus-nb-2-time").textContent = northbound[northboundFirst + 1]["departure_time"]
	document.getElementById("bus-nb-2-dest").textContent = northbound[northboundFirst + 1]["headsign"]
}

window.onload = function() {
	$.get("csv/stops.txt", readTable.bind(undefined, stops))
	$.get("csv/trips.txt", readTable.bind(undefined, trips))
	$.get("csv/stop_times.txt", readTable.bind(undefined, stop_times))
	$.get("csv/calendar.txt", readTable.bind(undefined, calendar))
	$.get("csv/calendar_dates.txt", readTable.bind(undefined, calendar_dates))
	
	setTimeout(main, 1000)
}

