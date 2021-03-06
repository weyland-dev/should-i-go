/*globals module, Marka */
(function () {
	'use strict';

	require('./lib/marka.min.js');

	var FuzzySet	= require('./lib/fuzzyset.js'),
		$			= require('jquery');
		
	var monthNames		= ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		diacriticsTable	= require('./resources/diacritics.json'),
		diacriticsMap	= [];

	/**
	 * Replacing special characters
	 * @param  {String} str
	 * @return {String}
	 */
	function removeDiacritics(str) {
		// "what?" version ... http://jsperf.com/diacritics/12
		// Might be a slightly faster version with a newer revision. We're talking milliseconds though.
		return str.replace(/[^\u0000-\u007E]/g, function(a){
			return diacriticsMap[a] || a;
		});
	}

	/**
	 * Return a short litteral version of the month from the date provided
	 * @param  {Date} date
	 * @return {String}
	 */
	module.exports.getMonth = function (date) {
		// I started using ECMAScript 5.1's Intl implementation, but it's not implemented in Node, 
		// making unit tests impossible for this part, unless you have a custom build of node. 
		// So I went the old fashioned way. Hopefully Node will implement this someday!
		return monthNames[date.getMonth()];
	};

	/**
	 * Get event ID from URL provided
	 * @param  {string} url 
	 * @return {string | false}
	 */
	module.exports.getEventId = function (url) {
		var re = /[\D]*([\d]*)/g;
		return re.exec(url)[1] || false;
	};

	/**
	 * Only keep the first part of the first name if there is a space inside it
	 * @param  {String} name Name of the person
	 * @return {String}      First part of it | Full name
	 */
	module.exports.keepFirstName = function (name) {
		var re = /(\w*)\s?/ig;
		return re.exec(name)[1];
	};

	module.exports.computeRatio = function (maleTable, femaleTable, peopleLength) {
		var result = {};
		result.boyCount		= maleTable.length;
		result.girlCount	= femaleTable.length; 
		result.boyPercent	= Math.round(result.boyCount / (result.girlCount + result.boyCount) * 100);
		result.girlPercent	= Math.round(result.girlCount / (result.girlCount + result.boyCount) * 100);
		result.boyCount		= Math.round(result.boyPercent / 100 * peopleLength);
		result.girlCount	= Math.round(result.girlPercent / 100 * peopleLength);
		result.boyTable		= maleTable;
		result.girlTable	= femaleTable;

		return result;
	};

	/**
	 * Preparing the diacritics table
	 * @return {none}
	 */
	module.exports.prepareDiacritics = function () {
		for (var i=0; i < diacriticsTable.length; i++){
			var letters = diacriticsTable[i].letters.split("");
			for (var j=0; j < letters.length ; j++){
				diacriticsMap[letters[j]] = diacriticsTable[i].base;
			}
		}
	};

	module.exports.removeDiacritics = removeDiacritics;

	/**
	 * Looking for a match in the appropriate table (male or female)
	 * @param  {Int} i
	 * @param  {Array} correspondingTable
	 * @return {Boolean}
	 */
	module.exports.searchForCorrespondance = function (name, correspondingTable) {
		if (!correspondingTable) {
			return false;
		}
		for (var j=0, length = correspondingTable.length; j < length; j++) {
			if (name === removeDiacritics(correspondingTable[j].toUpperCase())) {
				return true;
			}
		}
		return false;
	};

	/**
	 * Name approximation with the levenhstein algorithm
	 * @param  {String} name                     Name of the person
	 * @param  {Array} correspondingMaleTable   Male name array
	 * @param  {Array} correspondingFemaleTable Female name array
	 * @return {String}                          Result
	 */
	module.exports.fuzzySearch = function (name, correspondingMaleTable, correspondingFemaleTable) {
		var maleFuzzy			= new FuzzySet(correspondingMaleTable),
			femaleFuzzy			= new FuzzySet(correspondingFemaleTable),
			femaleFuzzyResult	= femaleFuzzy.get(name)[0][0],
			maleFuzzyResult		= maleFuzzy.get(name)[0][0];

			console.log('results, ', maleFuzzyResult, femaleFuzzyResult);

		if (maleFuzzyResult > femaleFuzzyResult && maleFuzzyResult > 0) {
			return "male";
		} else if (femaleFuzzyResult > maleFuzzyResult && femaleFuzzyResult > 0) {
			return "female";
		} else {
			return false;
		}
	};

	/**
	 * Create a Marka icon
	 * @param  {String} hoverElmt    The element listening to the hover event
	 * @param  {object} initialState Attributes for the initial state of the icon
	 * @param  {object} hoverState   Attributes for the hover state
	 * @return {none}  
	 */
	module.exports.createMarkaButton = function (hoverElmt, initialState, hoverState) {
		var m = new Marka(hoverElmt + ' i');
		m.set(initialState.shape);
		m.rotate(initialState.orientation);
		m.color('#ffffff');
		$(hoverElmt).hover(
		function () {
			m.rotate(hoverState.orientation);
			m.set(hoverState.shape);
		},
		function () {
			m.set(initialState.shape);
			m.rotate(initialState.orientation);
		});
	};

})();