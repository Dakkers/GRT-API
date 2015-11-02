# GRT API
A simple RESTful API for the GRT.

## Routes
All routes return a response of the form:

```javascript
{
    meta: {
        status: INTEGER,          // HTTP status code
        queryHasResult: BOOLEAN   // whether or not some data is returned
    },
    result: {
        // dependent on route
    }
}
```

### `/buses/:number`
Returns description and intersection information for a bus. Query is of the form:

```
/buses/:number?names=1&stops=1
```

If `names` is 1, the intersection names (e.g. `"King", "Victoria"`) will be returned; otherwise, they'll be ignored. If `stops` is `1`, the stop numbers (e.g. `1124`) will be returned; otherwise, they'll be ignored. The bus description is always returned.

If both values are `1`, the value of `result` should be:

```
{
    "description": "Bus Description",
    "data": [
        {"stopnumber": 2232, "location1": "Kingsway", "location2": "Wilson"},
        ...
    ]
}
```

So:

- if `names=1` and `stops=0`, then `stopnumber` will NOT be a property of any object in `data`
- if `names=0` and `stops=1`, then `location1` and `location2` will NOT be properties of any object in `data`
- if `names=0` and `stops=0`, then `data` will be an empty array.

404 is sent back if:

- bus number does not exist

### `/intersections`
Returns information on intersection(s) for a given location and stop number. Query is of the form:

```
/intersections?loc1=LOCATION1&loc2=LOCATION2&stopnumber=STOPNUMBER&strict={0,1}
```

If all values are satisfied, the value of `result` will essentially verify whether or not the location has that stop number (so `queryHasResult` will be `true` or `false` respectively), i.e. the value of `data` will be non-empty or empty respectively:

```
// if given stop number actually corresponds to location ...
{
    "data": [{"stopnumber": 1889, "location1": "King", "location2": "Queen"}]
}

// otherwise
{
    "data": []
}
```

If `loc1` and `loc2` are satisfied, then similarly, the value of `result` will be either a stop number back or an empty array:

```
// if location has a stop number
{
    "data": [{"stopnumber": 1889}]
}

// otherwise
{
    "data": []
}
```

If `loc1` and `stopnumber` are satisfied, then the value of `result` will be either a second location back or an empty array:

```
{
    "data": [{"location2": "Queen"}]
}
```

If only `loc1` is satisfied, then the value of `result` will be either an array of second locations and stop numbers, or an empty array:

```
{
    "data": [
        {"location2": "Queen", "stopnumber": 1889},
        {"location2": "Ontario", "stopnumber": 1890},
        ...
    ]
}
```

404 is sent back if:

- `loc1` is undefined

### `/intersections/buses`
This route returns the same information as `/intersections`, except with bus numbers! Why even have the other route? That's a good question! But the other route is more performant if you don't need the bus numbers.

## Raw Data
To self host the API, you'll need the raw data set, which I don't have yet. Soon!

## License
GPL.
