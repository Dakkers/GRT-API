var express = require("express"),
  pg  = require("pg"),
  secrets = require("./secrets.json"),
  app = express();

var client = new pg.Client(secrets.conString);
client.connect();

app.get("/grt/api/intersection", function(req, res) {
  var loc1, loc2, stopNum, strict, dbQuery, sanitizedInput;

  if (!req.query.loc1) {
    res.status(404).send({meta: {status: 404}});
    return;
  }

  loc1 = req.query.loc1;
  loc2 = req.query.loc2 || "NULL";
  stopNum = req.query.stopnum || 0;
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
    var dataReturned;

    if (err) {
      return res.status(404).send({meta: {status: 404}});
    }

    if (result.rows.length) {
      dataReturned = true;
    }

    res.status(200).json({
      meta: {status: 200, queryHasResult: dataReturned},
      data: result.rows
    });
  });
});

app.listen(4000);
