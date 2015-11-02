var express = require("express"),
  pg  = require("pg"),
  secrets = require("./secrets.json"),
  app = express();

var client = new pg.Client(secrets.conString);
client.connect();

var response404 = {
  meta: {
    status: 404,
    queryHasResult: false
  }
};

app.get("/grt/api/intersections/buses", function(req, res) {
  var loc1, loc2, stopNum, strict, dbQuery, sanitizedInput;

  if (!req.query.loc1) {
    return res.status(404).send(response404);
  }

  loc1 = req.query.loc1;
  loc2 = req.query.loc2 || "NULL";
  stopNum = req.query.stopnum || 0;
  strict  = (req.query.strict === "1") ? true : false;

  if (loc2 === "NULL") {
    if (stopNum === 0) {
      dbQuery = "SELECT Location2, Intersections.StopNumber, BusNumber FROM Intersections INNER \
                 JOIN BusesIntersections ON (Intersections.StopNumber = \
                 BusesIntersections.StopNumber) WHERE Location1 = ($1)";
      sanitizedInput = [loc1];
    } else {
      dbQuery = "SELECT Location2, BusNumber FROM Intersections INNER JOIN BusesIntersections ON \
                 (Intersections.StopNumber = BusesIntersections.StopNumber) WHERE Location1 = ($1) \
                 AND Intersections.StopNumber = ($2)";
      sanitizedInput = [loc1, stopNum];
    }
  } else {
    if (stopNum === 0) {
      dbQuery = "SELECT Intersections.StopNumber, BusNumber FROM Intersections INNER JOIN \
                 BusesIntersections ON (Intersections.StopNumber = BusesIntersections.StopNumber) \
                 WHERE Location1 = ($1) AND Location2 = ($2)";
      if (!strict) {
        dbQuery += " OR (Location1 = ($2) AND Location2 = ($1))";
      }
      sanitizedInput = [loc1, loc2];
    } else {
      dbQuery = "SELECT BusNumber FROM Intersections INNER JOIN BusesIntersections ON \
                 (Intersections.StopNumber = BusesIntersections.StopNumber) WHERE Location1 = ($1) \
                 AND Location2 = ($2) AND Intersections.StopNumber = ($3)";
      sanitizedInput = [loc1, loc2, stopNum];
    }
  }

  client.query(dbQuery, sanitizedInput, function(err, result) {
    if (err) {
      return res.status(404).json(response404);
    }

    var dataReturned = (result.rows.length) ? true : false;

    res.json({
      meta: {
        status: 200,
        queryHasResult: dataReturned
      },
      result: {
        data: result.rows
      }
    });
  });
});

app.get("/grt/api/intersections", function(req, res) {
  var loc1, loc2, stopNum, strict, dbQuery, sanitizedInput;

  if (!req.query.loc1) {
    return res.status(404).send(response404);
  }

  loc1 = req.query.loc1;
  loc2 = req.query.loc2 || "NULL";
  stopNum = req.query.stopnumber || 0;
  strict  = (req.query.strict === "1") ? true : false;

  if (loc2 === "NULL") {
    if (stopNum === 0) {
      dbQuery = "SELECT Location2, StopNumber FROM Intersections WHERE Location1 = ($1)";
      sanitizedInput = [loc1];
    } else {
      dbQuery = "SELECT Location2 FROM Intersections WHERE Location1 = ($1) AND StopNumber = ($2)";
      sanitizedInput = [loc1, stopNum];
    }
  } else {
    if (stopNum === 0) {
      dbQuery = "SELECT StopNumber FROM Intersections WHERE (Location1 = ($1) AND Location2 = ($2))";
      if (!strict) {
        dbQuery += " OR (Location1 = ($2) AND Location2 = ($1))";
      }
      sanitizedInput = [loc1, loc2];
    } else {
      dbQuery = "SELECT * FROM Intersections WHERE Location1 = ($1) AND Location2 = ($2) \
                 AND StopNumber = ($3)";
      sanitizedInput = [loc1, loc2, stopNum];
    }
  }

  client.query(dbQuery, sanitizedInput, function(err, result) {
    if (err) {
      return res.status(404).send(response404);
    }

    var dataReturned = (result.rows.length) ? true : false;

    res.status(200).json({
      meta: {
        status: 200,
        queryHasResult: dataReturned
      },
      result: {
        data: result.rows
      }
    });
  });
});

app.get("/grt/api/buses/:number", function(req, res) {
  var number = req.params.number,
    names = (req.query.names === "1") ? true : false,
    stops = (req.query.stops === "1") ? true : false,
    dbQuery;

  if (names) {
    if (stops) {
      dbQuery = "SELECT Intersections.StopNumber, Intersections.Location1, Intersections.Location2 \
                 FROM BusesIntersections INNER JOIN Intersections ON (Intersections.StopNumber = \
                 BusesIntersections.StopNumber) WHERE BusNumber = ($1)";
    } else {
      dbQuery = "SELECT Intersections.Location1, Intersections.Location2 FROM BusesIntersections \
                 INNER JOIN Intersections ON (Intersections.StopNumber = BusesIntersections.StopNumber) \
                 WHERE BusNumber = ($1)";
    }
  } else {
    if (stops) {
      dbQuery = "SELECT Intersections.StopNumber FROM BusesIntersections INNER JOIN Intersections \
                 ON (Intersections.StopNumber = BusesIntersections.StopNumber) WHERE BusNumber = ($1)";
    }
  }

  client.query("SELECT Description FROM Buses WHERE Number = ($1)", number, function(err, result) {
    // if the bus doesn't exist, respond with 404
    if (err || !result.rows.length) {
      return res.status(404).send(response404);
    }

    var description = result.rows[0].description,
      response = {
        meta: {
          status: 200,
          queryHasResult: true,
        },
        result: {
          description: description,
          data: []
        }
      };

    if (dbQuery) {
      client.query(dbQuery, [number], function(err, result) {
        if (err) {
          return res.status(404).send(response404);
        }
        response.result.data = result.rows;
        res.json(response);
      });
    } else {
      res.json(response);
    }
  });
});

app.listen(4000);
