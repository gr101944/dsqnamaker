'use strict';

let fs = require ('fs');
let https = require ('https');

const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const account = "storageaccountrajesa4ac";
const accountKey = "key here";


// Use StorageSharedKeyCredential with storage account and account key
// StorageSharedKeyCredential is only available in Node.js runtime, not in browsers
const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);

// const connStr = "DefaultEndpointsProtocol=https;AccountName=storageaccountrajesa4ac;AccountKey=L1orWrmyhOlqeFI0Eya2xQv/7+K7DcvbWIYy9+AqJGIVW79+/h06UIGalXQM2Sspkn6m4iBr92jKfcV5B7gmZA==;EndpointSuffix=core.windows.net";
// const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
const containerName = "itservices";

const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    sharedKeyCredential
  );

let host = 'westus.api.cognitive.microsoft.com';
let service = '/qnamaker/v4.0';
let method = '/knowledgebases/';

// Replace this with a valid subscription key.
let subscriptionKey = 'key here';

// Replace this with a valid knowledge base ID.
let kb = 'f98ec0fa-xx-xxx-bb08-7e9638a8ac1b';

// Build your path URL.
var path = service + method + kb;
async function main() {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    console.log("Listing all blobs using iter");
    let i = 1;
    let iter = containerClient.listBlobsFlat();
    var arr = []
    var count  = 0;
    for await (const blob of iter) {
        let position = blob.name.search(".html");
       
        if ((position != -1) && (count < 4)){
            arr.push("https://"+ account + ".blob.core.windows.net/" + containerName + "/" + blob.name)
            count++
        }
      
    }
    
    return arr
    console.log ("Number of files " + count)
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
