// Import the Google Cloud client library
const {BigQuery} = require('@google-cloud/bigquery');

async function queryStackOverflow() {
  // Queries a public Stack Overflow dataset.

  // Create a client
  const bigqueryClient = new BigQuery();

  // The SQL query to run
  const sqlQuery = `SELECT repo.name FROM githubarchive.year.2019 
  where repo.name LIKE '%googlemaps%' 
  or repo.name LIKE '%google-maps%' 
  or repo.name LIKE '%google-maps-api%' 
  or repo.name LIKE '%googlemapsapi%' 
  Group by
  repo.name`;

  const options = {
    query: sqlQuery,
  };

  // Run the query
  const [rows] = await bigqueryClient.query(options);
console.log(rows);
}
queryStackOverflow();