/**
 * Modified from https://gist.github.com/Wolfy87/5734530
 *
 *
 * Performs a binary search on the host array. This method can either be
 * injected into Array.prototype or called with a specified scope like this:
 * binaryIndexOf.call(someArray, searchElement);
 *
 * @param {*} searchElement The item to search for within the array.
 * @return {Number} The index of the element which defaults to -1 when not found.
 */

function compareArrays(query, comparator, i){
  i = i || 0

  if ((query[i] == undefined) && (comparator[i] == undefined)){
    return 0
  } else if ((query[i] < comparator[i]) || (query[i] == undefined)){
    return -1;
  } else if ((query[i] > comparator[i]) || (comparator[i] == undefined)) {
    return 1;
  } else {
    return compareArrays(query, comparator, ++i)
  }
}

function compareNumber

var binaryIndexOfPrefix = function(array, searchElement, prop) {
	'use strict';

	var minIndex = 0;
	var maxIndex = array.length - 1;
	var currentIndex;
	var currentElement;
	var resultIndex;
  var res;
  var subIndex = 0;

  searchElement = (prop == "prefix") ? searchElement.getValue() : (prop == "nonce") ? searchElement.nonce : (prop == "faceID") ? searchElement.faceID : searchElement

	while (minIndex <= maxIndex) {
		resultIndex = currentIndex = (minIndex + maxIndex) / 2 | 0;
    currentElement = (prop == "prefix") ? array[currentIndex].prefix.get(-1).getValue() : (prop == "nonce") ? array[currentIndex].nonce : (prop == "faceID") ? array[currentIndex].faceID : array[currentIndex]

    res = (typeof searchElement !== "number") ? compareArrays(searchElement, currentElement) : (function(){
      if (searchElement > currentElement)
        return 1;
      if (searchElement < currentElement)
        return -1;
      else
        return 0
    })()


		if (res == -1) {
			minIndex = currentIndex + 1;
		}
		else if (res == 1) {
			maxIndex = currentIndex - 1;
		}
		else {
			return currentIndex;
		}
	}

	return ~maxIndex;
}

module.exports = binaryIndexOfPrefix
