/* node_modules */
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const {upload} = require('./modules/multer_conn');

// var : gabage collection 대상(한 번 쓰고 버릴 아이들)
// const : gabage collection 대상이 아님

/* modules */
/* const {pool} = require('./modules/mysql_conn'); */ // 객체로 exports하였으므로 그 중 pool만 받으려면, 비구조할당으로 받아옴
const logger = require('./modules/morgan_conn');
const boardRouter = require('./routes/board');
const galleryRouter = require('./routes/gallery');

/* initialize */
app.listen(process.env.PORT, () => {console.log(`http://127.0.0.1:${process.env.PORT}`);});

/* initialize */
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, './views'));
app.locals.pretty = true; // 클라이언트가 받아보는 html 문서 형식 구조 정리

/* middleware */
// app.use(logger, express.json(), express.urlencoded({extended: false})); // 아래 세 줄을 이와 같이 줄여쓸 수 있음
app.use(logger);
app.use((req, res, next) => {
	express.json()(req, res, next)
})
// app.use(express.json()); // 위 표현과 같음;모든 요청으로 json 형태로 바꿔줌
app.use(express.urlencoded({extended: false})); // express 모듈을 씀

/* routers */
app.use('/', express.static(path.join(__dirname, './public')));
app.use('/storage', express.static(path.join(__dirname, './uploads')));
app.use('/board', boardRouter);
app.use('/gallery', galleryRouter);
/* 
app.get('/err', (req, res, next) => { // 서버 내부 에러
	const err = new Error();
	next(err);
});
 */

app.get('/test/upload', (req, res, next) => {
	res.render('test/upload');
});

// upfile은 upload라는 미들웨어의 single 메서드로 처리
app.post('/test/save', upload.single('upfile'), (req, res, next) => {
	// const {title, upfile} = req.body;
	// res.redirect('/board');]
	res.json(req.file);
});

/* error(예외처리;맞는 라우터를 찾지 못하여 respond를 해주지 못 한 경우) */
app.use((req, res, next) => {
	const err = new Error();
	err.code = 404;
	err.msg = '요청하신 페이지를 찾을 수 없습니다.';
	next(err); // 해당 에러를 처리해 달라고 아래 미들웨어로 보냄
});

app.use((err, req, res, next) => {
	console.log(err);
	const code = err.code || 500;
	const msg = err.msg || '서버 내부 오류입니다. 관리자에게 문의하세요.';
	res.render('./error.pug', {code, msg});
});