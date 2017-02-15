var helpers = require("../helpers");
var template = "index.ejs";
var S3Form = require("../s3post").S3Form;
var Policy = require("../s3post").Policy;
var POLICY_FILE = "policy.json";
var AWS = require("aws-sdk");
var configFilePath = "config.json";
exports.action = function(request, callback) {

	var policyData = helpers.readJSONFile(POLICY_FILE);
	var policy = new Policy(policyData);
	var s3Form = new S3Form(policy);
	var awsConfig  = new AWS.EC2MetadataCredentials();

	AWS.config.loadFromPath(configFilePath);
	awsConfig = helpers.readJSONFile(configFilePath);								


	helpers.getCurrentDomain(function(ip){
		console.log("Detected current domain: "+ip);
		var fields = s3Form.generateS3FormFields(ip.trim());
		callback(null, {template: template, params:{fields:s3Form.addS3CredientalsFields(fields, awsConfig, ip.trim()) ,
		bucket:"adud-dir1"
		}});
	});


}
