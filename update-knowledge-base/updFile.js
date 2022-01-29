'use strict';

let fs = require ('fs');
let https = require ('https');
const { ShareServiceClient } = require("@azure/storage-file-share");
const connStr = "con string windows.net";

const serviceClient  = ShareServiceClient.fromConnectionString(connStr);

const shareName = "peoplefilenames";
const fileName = "peoplefilelist.txt";

let host = 'westus.api.cognitive.microsoft.com';
let service = '/qnamaker/v4.0';
let method = '/knowledgebases/';

// Replace this with a valid subscription key.
let subscriptionKey = 'key here';

// Replace this with a valid knowledge base ID.
let kb = 'f98ec0fa-a708-xxxx-bb08-7e9638a8ac1b';

// Build your path URL.
var path = service + method + kb;
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on("data", (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on("error", reject);
    });
  }

async function main() {
    const fileClient = serviceClient
      .getShareClient(shareName)
      .rootDirectoryClient.getFileClient(fileName);
  
    // Get file content from position 0 to the end
    // In Node.js, get downloaded data by accessing downloadFileResponse.readableStreamBody
    const downloadFileResponse = await fileClient.download();
    var str  = (await streamToBuffer(downloadFileResponse.readableStreamBody)).toString();
    console.log(str);
    str = str.replace(/(\r\n|\n|\r)/gm, "");
    var fileArr = []
    var len = ((str.match(new RegExp("'", "g")) || []).length)/2;
    var ind1 = str.indexOf("'");
    var ind2 = str.indexOf( "'", (ind1 +1));
    console.log (str.substring ((ind1 +1), (ind2)))
    fileArr.push(str.substring ((ind1 +1), (ind2)))
    
    for (var i=0; i < (len-1); i++){
    
        ind1 = (ind2+2)
        ind2 = str.indexOf( "'", (ind1));
        fileArr.push(str.substring (ind1, (ind2))) 
    
    }
    console.log("Number of files read " + fileArr.length)
    
    return (fileArr)
  }
async function main2 (){
    var urlList = await main();
    console.log (urlList)
    let kb_model = {
        'add': {
          'qnaList': [],
          'urls': urlList,
          'files':[]
        }
      };
      
      
    // Convert the JSON object to a string..
      let content = JSON.stringify(kb_model);
    
    // Formats and indents JSON for display.
    let pretty_print = function(s) {
        return JSON.stringify(JSON.parse(s), null, 4);
    }
    
    // Call 'callback' after we have the entire response.
    let response_handler = function (callback, response) {
        let body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
        // Calls 'callback' with the status code, headers, and body of the response.
        callback ({ status : response.statusCode, headers : response.headers, body : body });
        });
        response.on('error', function(e) {
            console.log ('Error: ' + e.message);
        });
    };
    
    // HTTP response handler calls 'callback' after we have the entire response.
    let get_response_handler = function(callback) {
        // Return a function that takes an HTTP response and is closed over the specified callback.
        // This function signature is required by https.request, hence the need for the closure.
        return function(response) {
            response_handler(callback, response);
        }
    }
    
    // Calls 'callback' after we have the entire PATCH request response.
    let patch = function(path, content, callback) {
        let request_params = {
            method : 'PATCH',
            hostname : host,
            path : path,
            headers : {
                'Content-Type' : 'application/json',
                'Content-Length' : content.length,
                'Ocp-Apim-Subscription-Key' : subscriptionKey,
            }
        };
    
        // Pass the callback function to the response handler.
        let req = https.request(request_params, get_response_handler(callback));
        req.write(content);
        req.end ();
    }
    
    // Calls 'callback' after we have the response from the /knowledgebases PATCH method.
    let update_kb = function(path, req, callback) {
        console.log('Calling ' + host + path + '.');
        // Send the PATCH request.
        patch(path, req, function (response) {
            // Extract the data we want from the PATCH response and pass it to the callback function.
            console.log("here")
            callback({ operation : response.headers.location, response : response.body });
        });
    }
    
    // Calls 'callback' after we have the entire GET request response.
    let get = function(path, callback) {
        let request_params = {
            method : 'GET',
            hostname : host,
            path : path,
            headers : {
                'Ocp-Apim-Subscription-Key' : subscriptionKey,
            }
        };
    
        // Pass the callback function to the response handler.
        let req = https.request(request_params, get_response_handler(callback));
        req.end ();
    }
    
    // Calls 'callback' after we have the response from the GET request to check the status.
    let check_status = function(path, callback) {
        console.log('Calling ' + host + path + '.');
        // Send the GET request.
        get(path, function (response) {
            // Extract the data we want from the GET response and pass it to the callback function.
            callback({ wait : response.headers['retry-after'], response : response.body });
        });
    }
    
    // Sends the request to update the knowledge base.
    update_kb(path, content, function (result) {
    
        console.log(pretty_print(result.response));
    
        // Loop until the operation is complete.
        let loop = function() {
    
            // add operation ID to the path
            path = service + result.operation;
    
            // Check the status of the operation.
            check_status(path, function(status) {
    
                // Write out the status.
                console.log(pretty_print(status.response));
    
                // Convert the status into an object and get the value of the operationState field.
                var state = (JSON.parse(status.response)).operationState;
    
                // If the operation isn't complete, wait and query again.
                if (state == 'Running' || state == 'NotStarted') {
    
                    console.log('Waiting ' + status.wait + ' seconds...');
                    setTimeout(loop, status.wait * 1000);
                }
            });
        }
        // Begin the loop.
        loop();
    });
}
main2 ()

// **********************************************
// *** Update or verify the following values. ***
// **********************************************

// Represents the various elements used to create HTTP request URIs
// for QnA Maker operations.



// Dictionary that holds the knowledge base. Modify knowledge base here.
