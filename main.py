from flask import Flask
from flask import render_template
from flask import jsonify
import mysql.connector as mariadb
import os

try:
	os.environ["DB_PASS"]
except KeyError:
	quit("Database password DB_PASS was not defined in the environment!")

conn = mariadb.connect(user="wash", password=os.environ["DB_PASS"], database="wash")
cursor = conn.cursor(buffered=True)

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/history/<room>")
def history(room=None):
	cursor.execute("SELECT time, weekday, available_washers, available_dryers FROM wash.history WHERE room=%s AND time >= DATE_SUB(NOW(), INTERVAL 12 HOUR) ORDER BY `time` DESC", (room,))
	results = []
	for time, weekday, available_washers, available_dryers in cursor:
		results.append({"time": time.strftime("%Y-%m-%d %H:%M"), "weekday": weekday, "available_washers": available_washers, "available_dryers": available_dryers})
	return jsonify(results)

@app.route("/api/average/<room>")
def weekAverage(room=None):
	cursor.execute("SELECT time, weekday, available_washers, available_dryers FROM wash.history WHERE room=%s AND time >= DATE_SUB(NOW(), INTERVAL 21 DAY) ORDER BY `time` DESC", (room,))
	results = []
	averages = {}
	for time, weekday, available_washers, available_dryers in cursor:
		# Generate a code for each time
		# Format: #####
		#            ^^ Minutes
		#          ^^ Hour
		#         ^ Weekday
		timecode = str(time.weekday()) + "%02d" % time.hour + ("%02d" % time.minute)[:1]
		
		# Create timecode in dictionary if it doesn't exist
		try:
			averages[timecode]
		except KeyError:
			averages[timecode] = {"washer": [], "dryer": []}
		
		try:
			averages[timecode]
		except KeyError:
			averages[timecode] = []
		
		# Add all results to timecodes
		averages[timecode]["dryer"].append(available_dryers)
		averages[timecode]["washer"].append(available_washers)

	# For every timecode
	for tc in averages:
		average = sum(averages[tc]["washer"]) / len(averages[tc]["washer"])
		averages[tc]["washer_avg"] = average
		average = sum(averages[tc]["dryer"]) / len(averages[tc]["dryer"])
		averages[tc]["dryer_avg"] = average
		firstWeekday = sorted(averages)[0][:1]
		results.append({"timecode": tc, "available_washers": averages[tc]["washer_avg"], "available_dryers": averages[tc]["dryer_avg"]})
	return jsonify(results)

@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, public, max-age=0"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    return r