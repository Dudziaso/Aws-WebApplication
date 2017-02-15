var http = require('http');
var PORT = 80;
var helpers = require("./helpers");
var ACTIONS_CONFIG_FILE = "actions.json";
var ACTIONS_FOLDER = "./actions/";
var actionsCofig = helpers.readJSONFile(ACTIONS_CONFIG_FILE);

actionsCofig.forEach(function(elem){
	if(elem.action && elem.path){
		if(!elem.action.template){
			elem.action = require(ACTIONS_FOLDER + elem.action).action;
		}
	}else {
		console.log("unknown configuration: " + JSON.stringify(elem));
	}
});


var service = require("webs-weeia").http(actionsCofig);

service(PORT);


console.log("Server running on port: "+PORT);
