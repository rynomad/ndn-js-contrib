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

var debug = require("./debug.js").binaryIndexOf

function compareArrays(query, comparator, i){
  if (!(i >= 0))
    i = -1

  if (i >= 0 || (query.length == comparator.length)){
    i++
    if (comparator[i] > query[i]){
      return 1;
    } else if (comparator[i] < query[i]) {
      return -1;
    } else if (query[i] == comparator[i]){
      if (i < query.length - 1)
        return compareArrays(query, comparator, i);
      else
        return 0;
    }
  } else if (comparator.length > query.length){
    return 1;
  } else if (comparator.length < query.length){
    return -1;
  }

}


var binaryIndexOfPrefix = function(array, searchElement, prop) {
	'use strict';
  if (array.length == 0){
    return -1;}

	var minIndex = 0;
	var maxIndex = array.length - 1;
	var currentIndex;
	var currentElement;
	var resultIndex;
  var res;

  searchElement = (prop == "prefix") ?
    searchElement.getValue().buffer
  : (prop == "nonce") ?
    searchElement.nonce
  : (prop == "faceID") ?
    searchElement.faceID
  : searchElement

	while (minIndex <= maxIndex) {
		resultIndex = currentIndex = (minIndex + maxIndex) / 2 | 0;
    currentElement = (prop == "prefix") ? array[currentIndex].prefix.get(-1).getValue().buffer : (prop == "nonce") ? array[currentIndex].nonce : (prop == "faceID") ? array[currentIndex].faceID : array[currentIndex]

    res = (typeof searchElement !== "number") ? compareArrays(searchElement, currentElement) : (function(){
      if (searchElement > currentElement)
        return -1;
      if (searchElement < currentElement)
        return 1;
      else
        return 0
    })()


		if (res == 1) {
			maxIndex = currentIndex - 1;
		}
		else if (res == -1) {
      minIndex = currentIndex + 1;
		}
		else {
			return currentIndex;
		}
	}
  return ~(maxIndex + 1);
}

module.exports = binaryIndexOfPrefix
