const fs = require("fs");
const csvParser = require("csv-parser");

// Error Messages
const LogInputArgumentsError = (type) => {
  if (type === "points") {
    console.log("Please enter valid points.");
  } else if (type === "file") {
    console.log("Please enter valid CSV file.");
  } else {
    console.log("Please enter points to be spend and CSV file only.");
  }
};

// Read the CSV file and fetch the data
const readCSV = (points, csvFile) => {
  let payerPointsHistory = [];
  fs.createReadStream(csvFile)
    .pipe(csvParser())
    .on("data", (data) => payerPointsHistory.push(data))
    .on("end", () => {
        // sorting the data based on timestamp
      const sortedData = payerPointsHistory.sort((first, second) =>
        first.timestamp.localeCompare(second.timestamp)
      );
      pointsSpent(sortedData, points);
    });
};

// Adding points, seeing how much is spent and showing balances
const pointsSpent = (pointsTransactions, points) => {
  let sum = 0;
  let pointsReachCheck = false;
  let providedPoints = points;
  const payersHashMap = new Map();
  pointsTransactions.map((payerObj) => {
    // adding points to the hashMap
    if (payersHashMap.get(payerObj.payer)) {
      payersHashMap.get(payerObj.payer).push(payerObj.points);
    } else {
      payersHashMap.set(payerObj.payer, [payerObj.points]);
    }

    if (sum < points) {
      const payerPoints = +payerObj.points;
      sum += payerPoints;
      providedPoints = providedPoints - payerPoints;
      // removing the points from the hashmap 
      payersHashMap.get(payerObj.payer).pop(payerObj.points);
      if (providedPoints <= 0) {
        // Pushing the updated value to hashmap
        payersHashMap
          .get(payerObj.payer)
          .push(payerObj.points - (providedPoints + payerPoints));
      }
    }
    if (sum >= points) pointsReachCheck = true;
  });
  
  // If the spend points are more than the available displaying the following message
  pointsReachCheck
    ? displayBalances(payersHashMap)
    : console.log("No Sufficient points are available");
};

// Display the output in JSON format
const displayBalances = (finalPayersInfo) => {
  const outputObj = {};
  for (const key of finalPayersInfo.keys()) {
    outputObj[key] = finalPayersInfo
      .get(key)
      .reduce((a, b) => +a + +b, 0);
  }
  console.log("Final Points Balance: ");
  // To Display tidy JSON
  console.log(JSON.stringify(outputObj, null, 4));

};


// Function to check arguments
(() => {
    if (process.argv.length === 4) {
      const points =+ process.argv[2];
      const csvFile = process.argv[3];
      if (isNaN(points) || points <= 0) {
        LogInputArgumentsError("points");
        return;
      }
      if (!csvFile.endsWith(".csv")) {
        LogInputArgumentsError("file");
        return;
      }
      readCSV(points, csvFile);
    } else {
      LogInputArgumentsError();
      return;
    }
  })();
