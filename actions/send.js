var helpers = require("../helpers");
var template = "send.ejs";
var AWS = require("aws-sdk");
var configFilePath = "config.json";
var prefix = "";

var appConfig = {
	"QueueUrl" : "https://sqs.eu-central-1.amazonaws.com/744805968048/adud_queue"
}
//commit
var Queue = require("queuemanager");

exports.action = function(request, callback) {

	AWS.config.loadFromPath(configFilePath);
	var keys = request.query.keys;
	keys = Array.isArray(keys)?keys:[keys];
	keys.forEach(function(key){
		var queue = new Queue(new AWS.SQS(), appConfig.QueueUrl);
		queue.sendMessage(key, function(err, data){
			var dynamodb = new AWS.DynamoDB.DocumentClient();
			
			var dbParams = {
				TableName:"adud_table",
				Item:{
					"adud":"Artur",
					"value": key,
 					"Replace": false
				}
//				ItemName: "Wyslano do kolejki" /* required */
			};
			//simpledb.putAttributes(dbParams, function(err, data) {
			dynamodb.put(dbParams, function(err, datass) {
				if (err)
					callback(null, {template: template, params:{send:true, log:false, keys:keys, prefix:prefix}});
				else     
					callback(null, {template: template, params:{send:true, log:true, keys:keys, prefix:prefix}});
			});

		});
	});

}
