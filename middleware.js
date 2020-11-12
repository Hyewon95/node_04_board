/* node_modules */
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const createError = require('http-errors');

/* initialize */
app.listen(process.env.PORT, () => {console.log(`http://127.0.0.1:${process.env.PORT}`);});
/* 
// 일반적인 미들웨어 작성시
const first = (req, res, next) => {
	console.log('FIRST');
	req.test = 'first';
	next();
}
 */
// 변수를 받아 미들웨어 작성시
const third = (value) => { // #2 value값으로 'THIRD' 대입
	return (req, res, nest) => { // #3 middleware 실행하여 return
		console.log(value);
		next();
	}
}

app.get('/', third('THIRD'), (req, res, next) => { // #1 third('THIRD') 실행 / #4 middleware 실행
	console.log('SECOND');
	res.send('<h1>HELLO</h1>');
});

/* 
// '/'로 요청이 들어오면 다음 3개의 미들웨어가 연속되어 실행된다.
app.get('/', (req, res, next) => {
	console.log('FIRST');
	req.test = 'first';
	next();
}, (req, res, next) => {
	console.log('SECOND');
	req.test2 = 'second';
	next();
}, (req, res, next) => {
	console.log('THIRD');
	console.log(req.test);
	console.log(req.test2);
	res.send('<h1>HELLO</h1>');
});
 */