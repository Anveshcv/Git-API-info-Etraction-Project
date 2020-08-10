const csv = require('csv-parser');
const fs = require('fs');

var csvData = [];
var apiNames = [];
fs.createReadStream("APIsName.csv")
.pipe(csv(['ID',"API"]))
  .on('data', function (csvrow) {
    csvData.push(csvrow);
  })
  .on('end', function () {

    for (i = 0; i < 5; i++) {
      //str = csvData[i].API;

      console.log(csvData);
      // var replaced = str.split(' ').join('%20');

      // var apiFileResults={
      //   names:replaced
      // }
      // apiNames.push(apiFileResults);
      
    }
    for(y=0;y<apiNames.length;y++){
      console.log(apiNames[y].names);
    }
  });
  