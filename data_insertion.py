import os
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
cur.execute("DROP TABLE IF EXISTS Buses")
cur.execute("DROP TABLE IF EXISTS BusesIntersections")
cur.execute( ("CREATE TABLE Buses ("
              "Number integer PRIMARY KEY,"
              "Description text )"
            ) )
cur.execute( ("CREATE TABLE Intersections ("
              "Location1 text,"
              "Location2 text,"
              "StopNumber integer PRIMARY KEY )"
            ) )
cur.execute( ("CREATE TABLE BusesIntersections ("
              "id serial PRIMARY KEY,"
              "BusNumber integer REFERENCES Buses(Number),"
              "StopNumber integer REFERENCES Intersections(StopNumber) )"
            ) )

buses = csv.reader(open(os.path.join("data", "buses.csv")))
for (busnumber, desc) in buses:

    intersections_path = os.path.join("data", "intersections", "%s.csv" % busnumber)

    # skip data that's missing
    if not os.path.exists(intersections_path):
        continue

    cur.execute( "INSERT INTO Buses (Number, Description) VALUES (%s, %s)", (busnumber, desc) )

    data = csv.reader(open(intersections_path))

    for (loc1, loc2, stopnumber) in data:
        # add to Intersections table, but ignore if stopnumber already exists in it
        cur.execute( "SELECT * FROM Intersections WHERE StopNumber = %s", (stopnumber,) )
        if cur.fetchone() is None:
            cur.execute( ("INSERT INTO Intersections (Location1, Location2, StopNumber) "
                          "VALUES (%s, %s, %s)" ), (loc1, loc2, stopnumber) )

        # add to BusesIntersections table, but ignore if combination already exists
        cur.execute( ("SELECT * FROM BusesIntersections WHERE BusNumber = %s "
                      "AND StopNumber = %s"), (busnumber, stopnumber) )
        if cur.fetchone() is None:
            cur.execute( ("INSERT INTO BusesIntersections (BusNumber, StopNumber) "
                          "VALUES (%s, %s)" ), (busnumber, stopnumber) )

grtapi.commit()
cur.close()
grtapi.close()
