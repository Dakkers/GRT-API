import csv
import json
import psycopg2

with open("./secrets.json") as SECRETS_FILE:
	SECRETS = json.loads(SECRETS_FILE.read())
	user = SECRETS["user"]
	pw   = SECRETS["pass"]

grtapi = psycopg2.connect(host="localhost", user=user, password=pw, database="GRT")
cur = grtapi.cursor()
cur.execute("DROP TABLE IF EXISTS Intersections")
cur.execute( ("CREATE TABLE Intersections ("
			  "id serial PRIMARY KEY,"
			  "Location1 text,"
			  "Location2 text,"
			  "StopNumber integer )"
			) )

data = csv.reader(open("./data/6.csv"))
rownum = 0

for row in data:
	if rownum != 0:
		loc1, loc2, stopnum = row
		cur.execute( ("INSERT INTO Intersections (Location1, Location2, StopNumber) "
					  "VALUES ('%s', '%s', '%s')" % (loc1, loc2, stopnum) ) )
	rownum += 1

grtapi.commit()
cur.close()
grtapi.close()
