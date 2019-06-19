module.exports = function(app){
	const { t } = require('localizify');

	app.locals.timeSinceAgo = function(date) {
		return t('web.time.ago', {time: timeSince(date)});
	};

	app.locals.timeUntilAfter = function(date) {
		return t('web.time.later', {time: timeUntil(date)});
	};

	function timeSince(date, reversed = false) {
		var seconds;
		if(!reversed)
			seconds = Math.floor((new Date() - date) / 1000);
		else
			seconds = Math.floor((date - new Date()) / 1000);

		var interval = Math.floor(seconds / 31536000);
		// 2년 후부터 년단위로 표시한다.
		if (interval > 1) {
			return t('web.time.years', {value: interval});
		}
		interval = Math.floor(seconds / 2592000);
		// 2개월 후부터 월단위로 표시한다.
		if (interval > 1) {
			return t('web.time.months', {value: interval});
		}
		interval = Math.floor(seconds / 86400);
		// 2일 후부터 일단위로 표시한다.
		if (interval > 1) {
			return t('web.time.days', {value: interval});
		}
		interval = Math.floor(seconds / 3600);
		// 2시간 후부터 시간단위로 표시한다.
		if (interval > 1) {
			return t('web.time.hours', {value: interval});
		}
		interval = Math.floor(seconds / 60);
		// 2분 후부터 분단위로 표시한다.
		if (interval > 1) {
			return t('web.time.minutes', {value: interval});
		}
		return t('web.time.seconds', {value: Math.floor(seconds)});
	}

	function timeUntil(date) {
		timeSince(date, true);
	}
};