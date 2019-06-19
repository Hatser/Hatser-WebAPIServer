//https://sourcegraph.com/github.com/Acidic9/steam/-/blob/conversion.go#L43:2
let BigNumber = require('bignumber.js');

exports.SteamID64Identifier = new BigNumber('76561197960265728');
/*************************************************
******************* STEAM ID v2 ******************
**************************************************/

// SteamID2ToSteamID3 converts a given SteamID2 to a SteamID3.
// eg. STEAM_0:0:30203135 -> [U:1:60406270]
//
// An empty SteamID3 is returned if the process was unsuccessful.
exports.SteamID2ToSteamID3 = function (steamId) {
	return this.SteamID32ToSteamID3(this.SteamID2ToSteamID32(steamId));
};

// SteamID2ToSteamID16 converts a given SteamID2 to a SteamID16.
// eg. STEAM_0:0:30203135 -> 30203135, 0(odd)
//
// An empty SteamID2 is returned if the process was unsuccessful.
exports.SteamID2ToSteamID16 = function (steamId) {
	let idParts, steam16, odd;
	try {
		if (!steamId) {
			throw new ReferenceError('SteamID2 argument required');
		} 
		else if (typeof steamId !== 'string') {
			throw new TypeError('SteamID2 must be a string');
		}
		else {
			idParts = steamId.split(':'); // STEAM_0:0:30203135 => STEAM_0 , 0, 30203135
			steam16 = idParts[2];
			odd = parseInt(idParts[1]);
		}

		if (!steam16) {
			throw new Error('Invalid SteamID2');
		}

		return {'steam16':steam16, 'odd':odd};
	}
	catch (e) {
		return false;
	//	throw e;
	}
};

// SteamID2ToSteamID32 converts a given SteamID2 to a SteamID32.
// eg. STEAM_0:0:30203135 -> 60406270
//
// 0 is returned if the process was unsuccessful.
exports.SteamID2ToSteamID32 = function (steamId) {
	let result = this.SteamID2ToSteamID16(steamId);
	return this.SteamID16ToSteamID32(result.steam16, result.odd);
};

// SteamID2ToSteamID64 converts a given SteamID2 to a SteamID64.
// eg. STEAM_0:0:30203135 -> 76561198020671998
//
// 0 is returned if the process was unsuccessful.
exports.SteamID2ToSteamID64 = function (steamId) {
	return this.SteamID32ToSteamID64(this.SteamID2ToSteamID32(steamId));
};

/*************************************************
******************* STEAM ID v3 ******************
**************************************************/

// SteamID3ToSteamID2 converts a given SteamID3 to a SteamID2.
// eg. [U:1:60406270] -> STEAM_0:0:30203135
//
// An empty SteamID is returned if the process was unsuccessful.
exports.SteamID3ToSteamID2 = function (steamId) {
	var result = this.SteamID32ToSteamID16(this.SteamID3ToSteamID32(steamId));
	return this.SteamID16ToSteamID2(result.steam16, result.odd);
};

exports.SteamID3ToSteamID16 = function (steamId) {
	return this.SteamID32ToSteamID16(this.SteamID3ToSteamID32(steamId));
};


// SteamID3ToSteamID32 converts a given SteamID3 to a SteamID32.
// eg. [U:1:60406270] -> 60406270
//
// 0 is returned if the process was unsuccessful.
exports.SteamID3ToSteamID32 = function (steamId) {
	let idParts, steam32;
	try {
		if (!steamId) {
			throw new ReferenceError('SteamID3 argument required');
		} 
		else if (typeof steamId !== 'string') {
			throw new TypeError('SteamID3 must be a string');
		}
		else {
			idParts = steamId.split(':'); // [U:1:60406270] => [U , 1, 60406270]
			steam32 = idParts[2].replace(']', '');
			steam32 = parseInt(steam32, 10);
		}

		if (!steam32) {
			throw new Error('Invalid SteamID3');
		}

		return steam32;
	}
	catch (e) {
		return false;
	//	throw e;
	}
};

// SteamID3ToSteamID64 converts a given SteamID3 to a SteamID64.
// eg. [U:1:60406270] -> 76561198020671998
//
// 0 is returned if the process was unsuccessful.
exports.SteamID3ToSteamID64 = function (steamId) {
	return this.SteamID32ToSteamID64(this.SteamID3ToSteamID32(steamId));
};

/**************************************************
******************* STEAM ID 16b ******************
***************************************************/

// SteamID16ToSteamID2 converts a given SteamID16 to a SteamID2.
// eg. 30203135, 0(odd) -> STEAM_0:0:30203135
//
// An empty SteamID2 is returned if the process was unsuccessful.
exports.SteamID16ToSteamID2 = function (steamId, odd) {
	return 'STEAM_0:' + odd + ':' + steamId;
};

// SteamID16ToSteamID2 converts a given SteamID16 to a SteamID2.
// eg. 30203135, 0(odd) -> [U:1:60406270]
//
// An empty SteamID3 is returned if the process was unsuccessful.
exports.SteamID16ToSteamID3 = function (steamId, odd) {
	return this.SteamID32ToSteamID3(this.SteamID16ToSteamID32(steamId, odd));
};

// SteamID16ToSteamID32 converts a given SteamID16 to a SteamID32.
// eg. 86173181, 0(odd) -> 60406270
//
// An empty SteamID32 is returned if the process was unsuccessful.
exports.SteamID16ToSteamID32 = function (steamId, odd) {
	let steam32;
	try {
		if (!steamId || typeof odd === 'undefined') {
			throw new ReferenceError('SteamID16 and Odd argument required');
		}

		if (typeof steamId === 'string') {
			steamId = parseInt(steamId, 10);
		}
		if(typeof odd === 'string') {
			odd = parseInt(odd, 10);
		}

		steam32 = (steamId * 2) + odd;

		return steam32;
	}
	catch (e) {
		return false;
	//	throw e;
	}
};

// SteamID16ToSteamID32 converts a given SteamID16 to a SteamID32.
// eg. 86173181, 0(odd) -> 76561198020671998
//
// An empty SteamID64 is returned if the process was unsuccessful.
exports.SteamID16ToSteamID64 = function (steamId, odd) {
	return this.SteamID32ToSteamID64(this.SteamID16ToSteamID32(steamId, odd));
};

/**************************************************
******************* STEAM ID 32b ******************
***************************************************/

// SteamID32ToSteamID2 converts a given SteamID32 to a SteamID.
// eg. 60406270 -> STEAM_0:0:30203135
//
// An empty SteamID2 is returned if the process was unsuccessful.
exports.SteamID32ToSteamID2 = function (steamId) {
	var result = this.SteamID32ToSteamID16(steamId);
	return this.SteamID16ToSteamID2(result.steam16, result.odd);
};


// SteamID32ToSteamID3 converts a given SteamID32 to a SteamID3.
// eg. 60406270 -> [U:1:60406270]
//
// An empty SteamID3 is returned if the process was unsuccessful.
exports.SteamID32ToSteamID3 = function (steamId) {
	return '[U:1:' + steamId + ']';
};

// SteamID32ToSteamID16 converts a given SteamID64 to a SteamID3.
// eg. 60406270 -> 30203135, 0(odd)
//
// An empty SteamID16 is returned if the process was unsuccessful.
exports.SteamID32ToSteamID16 = function (steamId) {
	let steam16, steam32, odd=0;
	try {
		if (!steamId) {
			throw new ReferenceError('SteamID32 argument required');
		}
		else if (typeof steamId === 'string') {
			steam32 = parseInt(steamId, 10);
		} else {
			steam32 = steamId;
		}

		odd = steam32 % 2;
		steam16 = (steam32 - odd)/2;
		return {'steam16':steam16, 'odd':odd};
	}

	catch (e) {
		return false;
	//	throw e;
	}
};

// SteamID32ToSteamID64 converts a given SteamID32 to a SteamID64.
// eg. 60406270 -> 76561198020671998
//
// An empty SteamID64 is returned if the process was unsuccessful.
exports.SteamID32ToSteamID64 = function (steamId) {
	let magic, steam64;
	try {
		if (!steamId) {
			throw new ReferenceError('SteamID32 argument required');
		}
		else if (typeof steamId === 'string') {
			steamId = parseInt(steamId, 10);
		}

		magic = this.SteamID64Identifier;
		if(String(steamId).length < 17) {
			steam64 = magic.plus(steamId).toPrecision(17);
		}
		else {
			throw new ReferenceError('Invalid SteamID32');
		}

		return steam64;
	}
	catch (e) {
		return false;
	//	throw e;
	}
};

/**************************************************
******************* STEAM ID 64b ******************
***************************************************/

// SteamID64ToSteamID2 converts a given SteamID64 to a SteamID.
// eg. 76561198020671998 -> STEAM_0:0:30203135
//
// An empty SteamID2 is returned if the process was unsuccessful.
exports.SteamID64ToSteamID2 = function (steamId) {
	let result = this.SteamID64ToSteamID16(steamId);
	return this.SteamID16ToSteamID2(result.steam16, result.odd);
};

// SteamID64ToSteamID3 converts a given SteamID64 to a SteamID3.
// eg. 76561198020671998 -> [U:1:60406270]
//
// An empty SteamID3 is returned if the process was unsuccessful.
exports.SteamID64ToSteamID3 = function (steamId) {
	return this.SteamID32ToSteamID3(this.SteamID64ToSteamID32(steamId));
};

// SteamID64ToSteamID16 converts a given SteamID64 to a SteamID.
// eg. 76561198020671998 -> STEAM_0:0:30203135
//
// An empty SteamID16 is returned if the process was unsuccessful.
exports.SteamID64ToSteamID16 = function (steamId) {
	return this.SteamID32ToSteamID16(this.SteamID64ToSteamID32(steamId));
};

// SteamID64ToSteamID3 converts a given SteamID64 to a SteamID3.
// eg. 76561198020671998 -> 60406270
//
// An empty SteamID3 is returned if the process was unsuccessful.
exports.SteamID64ToSteamID32 = function (steamId) {
	let magic, steam32, steam64= 0;
	try {
		if (!steamId) {
			throw new ReferenceError('SteamID64 argument required');
		}
		else if (typeof steamId !== 'string') {
			throw new TypeError('SteamID64 must be a string');
		}
		magic = this.SteamID64Identifier;
		steam64 = new BigNumber(steamId); // parse 76561198020671998

		if (!steam64) {
			throw new Error('Invalid SteamID64');
		} 
		else {
			steam32 = parseInt(steam64.minus(magic)); // 76561198020671998 - 76561197960265728(the magic number) = 60406270
		}
		return steam32;
	}
	catch (e) {
		return false;
	//	throw e;
	}
};

/*** */

exports.IsSteamId2 = function(Id) {
	var reId = /^STEAM_[0-5]:[01]:\d+$/;
	return Id.match(reId);
};
exports.IsSteamId3 = function(Id) {
	var reId = /^\[?U:1:[0-9]+\]?$/;
	return Id.match(reId);
};
exports.IsSteamId64 = function(Id) {
	var reId = /^[0-9]{17}$/;
	return Id.match(reId);
};
exports.IsSteamCommunityUrl = function(Id) {
	var reId = /(?:https?:\/\/)?steamcommunity\.com\/(?:profiles|id)\/[a-zA-Z0-9]+/;
	return Id.match(reId);
	/*
	Id.match(/\/id\/[a-zA-Z0-9]+/);
	'/id/panvertigo'.split('/')[2];
	 */
};