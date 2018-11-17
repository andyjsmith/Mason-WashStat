from requests_html import HTMLSession
session = HTMLSession()
import requests
from datetime import datetime
import mysql.connector as mariadb
import csv
import os

try:
	os.environ["DB_PASS"]
except KeyError:
	quit("Database password DB_PASS was not defined in the environment!")


# Connect the the MariaDB database
conn = mariadb.connect(user="wash", password=os.environ["DB_PASS"], database="wash")
cursor = conn.cursor()

time = datetime.now().strftime("%m/%d/%y %H:%M")
weekday = datetime.today().weekday()

# Load the URLs of the laundry rooms
with open("rooms.csv") as f:
	rooms = [{k: v for k, v in row.items()} for row in csv.DictReader(f, skipinitialspace=True)]

# Fetch status of each laundry room
for room in rooms:
	r = session.get(room["url"])
	table = r.html.find(".container", first=True).find("table", first=True).find("tr")

	machines = []
	for item in table:
		try:
			item.attrs["class"]
			cols = item.find("td")[:4]
			machines.append({
				"number": cols[0].text,
				"type": cols[1].text,
				"status": cols[2].text,
				"time": cols[3].text
			})
		except KeyError:
			pass

	for machine in machines:
		machine["number"] = int(machine["number"].split(" ")[1])
		try:
			machine["time"] = int(machine["time"].split(" ")[0])
		except ValueError:
			machine["time"] = 0

	machines = sorted(machines, key=lambda k: k["number"])

	available_washers = 0
	eoc_washers = 0
	available_dryers = 0
	eoc_dryers = 0
	for machine in machines:
		if machine["status"] == "Available":
			if machine["type"] == "Washer":
				available_washers += 1
			if machine["type"] == "Dryer":
				available_dryers += 1
		if machine["status"] == "End of cycle":
			if machine["type"] == "Washer":
				eoc_washers += 1
			if machine["type"] == "Dryer":
				eoc_dryers += 1

	print("Stats for %s (%s)" % (room["name"], room["id"]))
	print("Washers: %d available, %d end of cycle" % (available_washers, eoc_washers))
	print("Dryers: %d available, %d end of cycle" % (available_dryers, eoc_dryers))

	cursor.execute("INSERT INTO history (time, weekday, available_washers, eoc_washers, available_dryers, eoc_dryers, room) VALUES (%s,%s,%s,%s,%s,%s,%s)", (datetime.now(), weekday, available_washers, eoc_washers, available_dryers, eoc_dryers, room["id"]))
	conn.commit()