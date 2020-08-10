const https = require("https");
const csv = require('csv-parser');
const fs = require('fs');
var moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format")
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

let username = "saicharansv07@gmail.com";
let password = "ea76460d01b9d936a025e9106b8136367dd5ca8e";
//** anvesh umich token---- 3623f22cf7c1e81aae0f16541c93f6681cd1c52d  */
//** anvesh token ---- 1d1fd2968b1cfebb807f52b51271e042768c350a */
//**anvesh apple token-----  e79a0d9538e854b2c661da16f75cc976299480aa */
var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
var a = 13938;
let reaction_type = "";
//** Api File reading code */
var csvData = [];
var apiNames = [];
fs.createReadStream("APIsName.csv")
    .pipe(csv(['ID', "API"]))
    .on('data', function (csvrow) {
        csvData.push(csvrow);
    })
    .on('end', function () {

        for (i = 0; i < csvData.length; i++) {
            str = csvData[i].API;
            var id = csvData[i].ID
            var replaced = str.split(' ').join('%20');

            var apiFileResults = {
                ID: id,
                names: replaced
            }
            apiNames.push(apiFileResults);
        }
        setTimeout(apiInformation.bind(this, a), 2000);
    });
var onRepoDataFetched = function () {
    a++;
    if (a < apiNames.length)
        setTimeout(apiInformation.bind(this, a), 2000);
};

var apiInformation = function (a) {

    //console.log(apiNames.length);
    if (a < apiNames.length) {
        let repositories = [];
        var results = [];
        var options = {
            host: 'api.github.com',
            path: '/search/repositories?q='+ apiNames[a].names,
            method: 'GET',
            headers: {
                'user-agent': 'node.js',
                "Authorization": auth
            }
        };
        var request = https.request(options, function (res) {
            let data = "";
            let no_of_pages = "";
            res.on('data', (d) => {
                data += d;
            });
            res.on('end', () => {

                var parse = require('parse-link-header');
                var parsed = parse(res.headers.link);
                if (parsed == null) {
                    no_of_pages = 1;
                }
                //console.log(data);
                // console.log(res.headers);
                else {
                    no_of_pages = parsed.last.page;
                }
                //console.log(res.headers.link);
                function getRepositoriesInfo(i) {
                    if (i <= no_of_pages) {
                        //console.log(i);

                        // console.log("page" + i);
                        //console.log(apiNames);
                        console.log("fetching page " + i + " of " + csvData[a].API+"("+apiNames[a].ID+")");
                        var options1 = {
                            host: 'api.github.com',
                            path: '/search/repositories?q='+ apiNames[a].names +'&page='+ i,
                            method: 'GET',
                            headers: {
                                'user-agent': 'node.js',
                                "Authorization": auth
                            }
                        };
                        //console.log(options1);
                        https.get(options1, (res) => {
                            //console.log("hello")
                            let data = "";
                            res.on('data', (d) => {
                                data += d;
                            });
                            res.on('end', () => {
                                //console.log(options1);
                                let repositories_data = JSON.parse(data);
                                if (repositories_data.total_count == 0) {
                                    onRepoDataFetched();
                                }
                                let rep_per_page = repositories_data.items.length;
                                //console.log(rep_per_page);
                                for (y = 0; y < rep_per_page; y++) {
                                    var result = {
                                        rep_name: repositories_data.items[y].full_name,
                                        rep_id: repositories_data.items[y].id,
                                        api_name: repositories_data.items[y].name
                                    }
                                    repositories.push(result);
                                }
                                //console.log(repositories)
                                i++;
                                //console.log(i);
                                setTimeout(getRepositoriesInfo.bind(this, i), 2000);
                            });
                        });
                    }
                    else {
                        //** */
                        function getRepoDetailsByIndex(i) {
                            if (i < repositories.length) {
                                // console.log("inside if block",i);
                                var options = {
                                    host: 'api.github.com',
                                    path: '/repos/'+ repositories[i].rep_name+'/issues',
                                    method: 'GET',
                                    headers: {
                                        'user-agent': 'node.js',
                                        "Authorization": auth
                                    }
                                };
                                //console.log(options)
                                var request = https.request(options, function (resp) {
                                    //console.log("")
                                    let data = "";
                                    resp.on("data", chunk => {
                                        data += chunk;
                                    });
                                    resp.on("end", () => {
                                        //error_msg = JSON.parse(data).message;
                                        //console.log(error_msg)
                                        let activity_data = JSON.parse(data);
                                        //console.log(activity_data);
                                        //**code for writing data into csv file  */
                                        //console.log(activity_data)
                                        const csvWriter = createCsvWriter({
                                            path: 'CSV files/Repository issues information/' + apiNames[a].ID + '.csv',
                                            header: [
                                                { id: 'api_id', title: 'API Id' },
                                                { id: 'rep_id', title: 'Repository Id' },
                                                { id: 'api_name', title: 'API Name' },
                                                { id: 'rep_name', title: 'Repository name' },
                                                { id: 'issue_title', title: 'Issue Title' },
                                                { id: 'issue_body', title: 'Issue Body' },
                                                { id: 'issue_user_id', title: 'Issue User ID' },
                                                { id: 'issue_id', title: 'Issue ID' },
                                                { id: 'issue_created_at', title: 'Issue Created At' },
                                                { id: 'issue_updated_at', title: 'Issue Updated At' },
                                                { id: 'issue_closed_at', title: 'Issue Closed At' },
                                                { id: 'issue_updation_time_diff', title: 'Issue Updation Timedifference (dd:hh:mm:ss)' },
                                                { id: 'issue_label', title: 'Issue Label' },
                                                { id: 'issue_reaction', title: 'Issue Reaction' },
                                                { id: 'commenter_id', title: 'Commenter ID' },
                                                { id: 'comments_body', title: 'Comments Body' },
                                                { id: 'comments_created_at', title: 'Comments Created At' },
                                                { id: 'comments_updated_at', title: 'Comments Updated At' },
                                                { id: 'comments_time_diff', title: 'Comments Timedifference (dd:hh:mm:ss)' }
                                            ]
                                        });
                                        repName = repositories[i].rep_name;
                                        repId = repositories[i].rep_id;
                                        apiName = repositories[i].api_name;
                                        getCommentsByIssue(0, activity_data, function () {
                                            // console.log(activity_data)
                                            console.log("Pushed results of", i, "repository of " + csvData[a].API);
                                            if (i == repositories.length - 1) {
                                                console.log('file writing initiated');
                                                csvWriter
                                                    .writeRecords(results)
                                                    .then(() => console.log('The CSV file was written successfully'));
                                                onRepoDataFetched();
                                            }
                                            i++;
                                            setTimeout(getRepoDetailsByIndex.bind(this, i), 2000);
                                        });
                                    });

                                })
                                request.on('error', (e) => {
                                    console.error(e);
                                });
                                request.end();
                            }
                        }
                        getRepoDetailsByIndex(0);

                        //**---------------------------Comments code------------------------------ */

                        var getCommentsByIssue = function (y, activity_data, onSuccess) {
                            // console.log("inside comments_recursion", y);
                            if (!activity_data || !activity_data.length || activity_data.length == 0) {
                                onSuccess();
                                return;
                            }
                            if (y < activity_data.length) {
                                //console.log(activity_data.length);
                                comments_url = activity_data[y].comments_url;

                                // console.log(comments_url);
                                issueNumber_url = activity_data[y].url;
                                reactions_url = issueNumber_url +'/reactions';
                                let options = {
                                    headers: {
                                        'user-agent': 'node.js',
                                        'Accept': 'application/vnd.github.squirrel-girl-preview+json',
                                        "Authorization": auth
                                    }
                                };
                                https.get(reactions_url, options, (res) => {
                                    let data = "";
                                    res.on('data', (d) => {
                                        data += d;
                                    })
                                    res.on('end', () => {
                                        let reactions_info = JSON.parse(data);
                                        //console.log(reactions_info);
                                        //let reaction_value=[];
                                        let reaction_value = "";
                                        let reaction_type = "";
                                        if (reactions_info.length != 0) {
                                            for (r = 0; r < reactions_info.length; r++) {
                                                reaction_value = reactions_info[r].content;
                                            }

                                            if (reaction_value == "+1") {
                                                reaction_type = "Liked";
                                            }
                                            else if (reaction_value == "-1") {
                                                reaction_type = "Disliked"
                                            }
                                            else {
                                                reaction_type = reaction_value;
                                            }
                                        }
                                        https.get(comments_url, options, (res) => {
                                            let data = "";
                                            res.on('data', (d) => {
                                                data += d;
                                            });
                                            res.on('end', () => {
                                                // console.log(data);
                                                let comments_info = JSON.parse(data);
                                                let label_value = [];
                                                //let index= a-1;
                                                for (l = 0; l < activity_data[y].labels.length; l++) {
                                                    label_value[0] = activity_data[y].labels[l].name;
                                                }
                                                //console.log(label_value);
                                                // console.log(comments_info);

                                                //**Time difference code */

                                                var issueUpdationTime = activity_data[y].updated_at;
                                                var issueCreatedTime = activity_data[y].created_at;
                                                var issueTime = moment(issueUpdationTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ").diff(moment(issueCreatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ"));
                                                var iT = moment.duration(issueTime);
                                                var issueUpdationTimeDiff = iT.format("dd:hh:mm:ss");
                                                //console.log(issueUpdationTimeDiff);

                                                //**Time difference code ends here */

                                                //**code block removal */
                                                var issueBody = activity_data[y].body;
                                                if (issueBody != null) {
                                                    //console.log(issueBody);
                                                    var issueWithoutCode = issueBody.replace(/(`[^*]*`)|(```[^*]*```)|(''[^*]*'')|(<kml[^*]*kml>)/g, '');
                                                }
                                                else {
                                                    issueWithoutCode = "";
                                                }
                                                //console.log(stringWithoutCodeblock);
                                                // console.log(reaction_value);
                                                // console.log(reaction_type);
                                                //**code block removal code ends here */
                                                if (comments_info.length == 0) {
                                                    var resultWithoutComments = {
                                                        api_id: apiNames[a].ID,
                                                        rep_id: repId,
                                                        api_name: apiName,
                                                        rep_name: repName,
                                                        issue_title: activity_data[y].title,
                                                        issue_body: issueWithoutCode,
                                                        issue_user_id: activity_data[y].user.id,
                                                        issue_id: activity_data[y].id,
                                                        issue_created_at: activity_data[y].created_at,
                                                        issue_updated_at: activity_data[y].updated_at,
                                                        issue_closed_at: activity_data[y].closed_at ? activity_data[z].closed_at : "Not yet closed",
                                                        issue_updation_time_diff: issueUpdationTimeDiff,
                                                        issue_label: label_value,
                                                        issue_reaction: reaction_type
                                                    }
                                                    results.push(resultWithoutComments);
                                                    //console.log(results)
                                                }
                                                else {
                                                    for (c = 0; c < comments_info.length; c++) {
                                                        //**Time difference code */

                                                        var commentUpdatedTime = comments_info[c].updated_at;
                                                        var commentCreatedTime = comments_info[c].created_at;
                                                        var commentTime = moment(commentUpdatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ").diff(moment(commentCreatedTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ"));
                                                        var cT = moment.duration(commentTime);
                                                        var commentUpdationTimeDiff = cT.format("dd:hh:mm:ss");
                                                        //console.log(commentUpdationTimeDiff);

                                                        //**Time difference code ends here */
                                                        //**code block removal */
                                                        var commentBody = comments_info[c].body;
                                                        if (commentBody != null) {
                                                            //console.log(issueBody);
                                                            var commentWithoutCode = commentBody.replace(/(`[^*]*`)|(```[^*]*```)|(''[^*]*'')|(<kml[^*]*kml>)/g, '');
                                                        }
                                                        else {
                                                            commentWithoutCode = "";
                                                        }
                                                        //**code block removal code ends here */
                                                        var resultWithComments = {
                                                            api_id: apiNames[a].ID,
                                                            rep_id: repId,
                                                            api_name: apiName,
                                                            rep_name: repName,
                                                            issue_title: activity_data[y].title,
                                                            issue_body: issueWithoutCode,
                                                            issue_user_id: activity_data[y].user.id,
                                                            issue_id: activity_data[y].id,
                                                            issue_created_at: activity_data[y].created_at,
                                                            issue_updated_at: activity_data[y].updated_at,
                                                            issue_closed_at: activity_data[y].closed_at ? activity_data[z].closed_at : "Not yet closed",
                                                            issue_updation_time_diff: issueUpdationTimeDiff,
                                                            issue_label: label_value,
                                                            issue_reaction: reaction_type,
                                                            commenter_id: comments_info[c].user.id,
                                                            comments_body: commentWithoutCode,
                                                            comments_created_at: comments_info[c].created_at,
                                                            comments_updated_at: comments_info[c].updated_at,
                                                            comments_time_diff: commentUpdationTimeDiff
                                                        }
                                                        // console.log(comments_obj.comments_created_at);
                                                        results.push(resultWithComments);

                                                        //console.log(results);
                                                    }
                                                }
                                                if (y == (activity_data.length - 1)) {
                                                    onSuccess();
                                                    return;
                                                }
                                                y++;
                                                setTimeout(getCommentsByIssue.bind(this, y, activity_data, onSuccess), 2000);
                                            });

                                        }).on('error', (e) => {
                                            console.error(e);
                                        });
                                    })
                                })
                            }
                        }
                    }

                }
                getRepositoriesInfo(1);
            });
        });
        request.end();
    }
}






