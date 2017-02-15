var helpers = require("../helpers");
var template = "list.ejs";
var AWS = require("aws-sdk");
var configFilePath = "config.json";
var prefix = "";

var removeRoot = function(arr){
	var newArr = [];
	arr.forEach(function(el){
		if(el.Key !== prefix+"/")
			newArr.push(el);
	});

	return newArr;
}

exports.action = function(request, callback) {

	AWS.config.loadFromPath(configFilePath);
	var params = {
		Bucket: 'adud-dir1',
		Prefix: prefix
	};
	var s3 = new AWS.S3();
	s3.listObjects(params, function(err, data) {
		if(request.query.key)
			var uploaded = request.query.key;
		callback(null, {template: template, params:{elements:removeRoot(data.Contents), uploaded: uploaded, prefix:prefix}});
	});

}
