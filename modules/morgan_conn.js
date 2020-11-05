const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const path = require('path');

// 내가 전달받은 파일을 access.log에 매일 전달
const logStream = rfs.createStream('access.log', {
	interval: '1d',
	path: path.join(__dirname, '../logs')
});

// 미들웨어
const logger = morgan('combined', {stream: logStream});

module.exports = logger;