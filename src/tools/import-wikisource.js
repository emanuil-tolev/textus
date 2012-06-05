var fs = require('fs');
var args = require('optimist').usage('Usage: $0 --title TITLE [--file-only]').alias('t', 'title').alias('f',
		'file-only').describe('t', 'The title of a work in the English WikiSource wiki.').describe('f',
		'If defined the import will simply write the file and not access the data store').demand([ 't' ]).argv;
var importer = require('../js/import/wikisource.js')(args);
var ds = require('../js/datastore/dataStore-elastic.js')(args);

var title = args.title;

var createDummyAnnotations = function(string, count, spanlength) {
	annotations = [];
	for ( var i = 0; i < count; i++) {
		var startPos = Math.floor(Math.random() * ((string.length - 1) - spanlength));
		var endPos = startPos + Math.floor(Math.random() * spanlength) + 1;
		var rCol = function() {
			return Math.floor(Math.random() * 256);
		};
		annotations.push({
			start : startPos,
			end : endPos,
			id : "annotation" + i,
			colour : "rgba(" + rCol() + "," + rCol() + "," + rCol() + ",0.2)"
		});
	}
	return annotations;
};

/**
 * Called when a text has been read in and parsed
 */
var textProcessingCompleted = function(text, typography) {
	var data = {
		text : [ {
			text : text,
			sequence : 0
		} ],
		typography : typography,
		semantics : createDummyAnnotations(text, 10000, 20),
		structure : [ {
			type : "textus:document",
			start : 0,
			depth : 0,
			description : "Imported from WikiSource-en with title '" + title + "'",
			name : title
		} ]
	};
	if (!args.f) {
		ds.importData(data, function(err, textId) {
			if (err) {
				console.log("Import to data store failed : " + err);
			} else {
				console.log("Imported '" + title + "' to data store, assigned text ID '" + textId + "'.");
			}
		});
	}
	var fileName = title.toLowerCase().replace(" ", "_", "gi") + ".json";
	fs.writeFile(fileName, (JSON.stringify(data, null, " ")), function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log("Written " + fileName);
		}
	});
};

importer.import(textProcessingCompleted, title.replace(" ", "_", "gi"));
