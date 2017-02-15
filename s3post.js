var util = require("util");
var moment = require("moment");
var helpers = require("./helpers");

var ACCESS_KEY_FIELD_NAME = "AWSAccessKeyId";
var POLICY_FIELD_NAME = "policy";
var SIGNATURE_FIELD_NAME = "signature";

var Policy = function(policyData){
	this.policy = policyData;	
	this.policy.expiration = moment().add(policyData.expiration).toJSON();
}

Policy.prototype.generateEncodedPolicyDocument = function(ip){
	return helpers.encode(this.policy, 'base64', function(string){
		return string.split('$ip').join(ip);
	});		
}

Policy.prototype.getConditions = function(){
	return this.policy.conditions;
}

Policy.prototype.generateSignature = function(secretAccessKey, ip){
	return helpers.hmac("sha1", secretAccessKey, this.generateEncodedPolicyDocument(ip), 'base64');	
}

Policy.prototype.getConditionValueByKey = function(key){
	var condition = [];
	this.policy.conditions.forEach(function(elem) {		
		if(Object.keys(elem)[0] === key)
			condition = elem[Object.keys(elem)[0]];
	});
	return condition;
}

var S3Form = function(policy){	
	if(policy instanceof Policy)
		this.policy = policy;
	else{
		console.log("policy instanceof Policy");
		throw new Error("policy instanceof Policy");
	}
	
}

S3Form.prototype.generateS3FormFields = function(ip) {
	var conditions =this.policy.getConditions();
	var formFields = [];
	conditions.forEach(function(elem){
		if(Array.isArray(elem)){
			if(elem[1] === "$key")
				formFields.push(hiddenField("key", elem[2] + "${filename}"));			
		}else {

			var key = Object.keys(elem)[0];
			var value = elem[key];
			if(key === 'success_action_redirect') 
				formFields.push(hiddenField(key, value.replace("$ip",ip)));
			else if(key !== "bucket")
			 	formFields.push(hiddenField(key, value));
		}	
	});
	
	return formFields;	
}



S3Form.prototype.addS3CredientalsFields = function(fields, awsConfig, ip){	

	//fields.push(hiddenField(
		//ACCESS_KEY_FIELD_NAME, awsConfig.accessKeyId));

	//fields.push(hiddenField(
		//POLICY_FIELD_NAME, this.policy.generateEncodedPolicyDocument(ip)));
	//fields.push(hiddenField(
		//SIGNATURE_FIELD_NAME, this.policy.generateSignature(awsConfig.secretAccessKey, ip)));
	var CryptoJS = require("crypto-js");
	function getSignatureKey(key, dateStamp, regionName, serviceName) {
	   var kDate = CryptoJS.HmacSHA256(dateStamp, "AWS4" + key);
	   var kRegion = CryptoJS.HmacSHA256(regionName, kDate);
	   var kService = CryptoJS.HmacSHA256(serviceName, kRegion);
	   var kSigning = CryptoJS.HmacSHA256("aws4_request", kService);

	   return kSigning;
	}
	var date = "20170216"; // overwrite date
	var serviceName = "s3";
	var expiration = "2017-09-28T12:00:00.000Z";
	var bucket = "adud-dir1";
	var folder = "";
	
	var s3Policy2 = {"expiration": expiration,
	  "conditions": [
	   {"bucket": bucket},
	   ["starts-with", "$key", folder],
	//   {"key":"${filename}"},
	   {"acl": "private"},
//	   {"x-amz-server-side-encryption": "AES256"},
//	   ["starts-with", "$Content-Type", "image/"],
//	   {"x-amz-meta-uuid": "14365123651274"},
//	   ["starts-with", "$x-amz-meta-tag", ""],
	   {"x-amz-credential": awsConfig.accessKeyId + "/" + date + "/" + awsConfig.region + "/" + serviceName +"/aws4_request"},
	   {"x-amz-algorithm": "AWS4-HMAC-SHA256"},
	   {"x-amz-date": date + "T000000Z" }
	  ]
	};
	
	
	var base64Policy = new Buffer(JSON.stringify(s3Policy2), "utf-8").toString("base64");
	console.log('base64Policy:', base64Policy);

	var signatureKey = getSignatureKey(awsConfig.secretAccessKey, date, awsConfig.region, serviceName);
	var s3Signature = CryptoJS.HmacSHA256(base64Policy, signatureKey).toString(CryptoJS.enc.Hex);
	console.log('s3Signature:', s3Signature);
		
	//fields.push(hiddenField(
	//	"x-amz-meta-uuid", "aaa"));
	//fields.push(hiddenField(
	//	"x-amz-server-side-encryption", "AES256"));	
	//fields.push(hiddenField(
		//"X-Amz-Credential", awsConfig.accessKeyId + "/" + date + "/" + awsConfig.region + "/" + serviceName +"/aws4_request"));	
//	fields.push(hiddenField(
		//"X-Amz-Algorithm", "AWS4-HMAC-SHA256"));
	//fields.push(hiddenField(
	//	"X-Amz-Date", date + "T000000Z"));	
	fields.push(hiddenField(
		"policy", base64Policy));	
	fields.push(hiddenField(
		"X-Amz-Signature", s3Signature));			

	return fields;
}


var hiddenField = function(fieldName, value) {
	return {name: fieldName, value : value};
}





exports.Policy = Policy; // usage: policy = new Policy(policyData);
exports.S3Form = S3Form; // usage: s3Form = new S3Form(awsConfig, policy);


