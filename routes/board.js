const express = require('express');
const moment = require('moment');
const path = require('path');
const fs = require('fs-extra');
const createError = require('http-errors');
const router = express.Router();
const {pool, sqlGen} = require('../modules/mysql_conn');
const {alert, uploadFolder, imgFolder, extGen} = require('../modules/util');
const {upload, imgExt} = require('../modules/multer_conn');

router.get(['/', '/list'], async (req, res, next) => { // 127.0.0.1:3000/board 혹은 127.0.0.1:3000/board/list
	let connect, rs, pug;
	pug = {title: '게시판 리스트', js: 'board', css: 'board'};
	try{
		let temp = sqlGen('board', {mode: 'S', desc: 'ORDER BY id DESC'}); // 보통 다음과 같이 table명을 첫번째 인자로 빼줌
		connect = await pool.getConnection();
		rs = await connect.query(temp.sql); // 쿼리문에 ?가 포함되지 않으므로 values는 제외
		connect.release();
		pug.lists = rs[0];
		pug.lists.forEach((v) => {
			v.wdate = moment(v.wdate).format('YYYY-MM-DD');
		});
		res.render('./board/list.pug', pug);
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage || e));
	}
});

router.get('/write', (req, res, next) => {
	const pug = {title: '게시글 작성', js: 'board', css: 'board'};
	res.render('./board/write.pug', pug);
});

router.post('/save', upload.single('upfile'), async (req, res, next) => { // 주의) get 방식이 아니라 post 방식으로 받음
	let connect, rs;
	try{
		// 파일 형식이 허용되든 아니든 upload 시켰다면, req에 allowUpload가 존재
		if(req.allow === false){
			res.send(alert(`${req.ext}은(는) 업로드 할 수 없습니다.`, '/board'));
		}
		else{
			let temp = sqlGen('board', {
				mode: 'I',
				field: ['title', 'content', 'writer'],
				data: req.body,
				file: req.file
			});
		
			connect = await pool.getConnection();
			console.log(connect);
			rs = await connect.query(temp.sql, temp.values);
			connect.release();
			res.redirect('/board');
		}
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage || e));
	}	
});

router.get('/view/:id', async (req, res) => {
	let connect, rs, pug;
	try{
		pug = {title: '게시판 보기', js: 'board', css: 'board'};
		let temp = sqlGen('board', {
			mode: 'S',
			id: req.params.id // :id은 params로 받아 id의 값으로 넣어준다.
		});
		connect = await pool.getConnection();
		rs = await connect.query(temp.sql);
		connect.release();
		pug.list = rs[0][0];
		pug.list.wdate = moment(pug.list.wdate).format('YYYY-MM-DD HH:mm:ss');
		if(pug.list.savefile){
			if(imgExt.includes(extGen(pug.list.savefile))){ // 이미지라면
				pug.list.imgSrc = imgFolder(pug.list.savefile);
			}
		}
		res.render('./board/view.pug', pug);
		// res.json(rs);
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage || e));
	}
});

router.get('/delete/:id', async (req, res, next) => {
	let connect, rs, temp;
	try{
		connect = await pool.getConnection();
		temp = sqlGen('board', {
			mode: 'S',
			id: req.params.id,
			field: ['savefile']
		});
		rs = await connect.query(temp.sql);
		if(rs[0][0].savefile) await fs.remove(uploadFolder(rs[0][0].savefile));

		temp = sqlGen('board', {
			mode: 'D',
			id: req.params.id
		});
		rs = await connect.query(temp.sql);
		connect.release();
		res.send(alert('삭제되었습니다.', '/board'));
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage || e));
	}
});

router.get('/update/:id', async (req, res, next) => {
	let connect, rs, pug, temp;
	try{
		pug = {title: '게시판 수정', js: 'board', css: 'board'};
		temp = sqlGen('board', {
			mode: 'S',
			id: req.params.id
		});
		connect = await pool.getConnection();
		rs = await connect.query(temp.sql);
		connect.release();
		pug.list = rs[0][0];
		res.render('./board/write.pug', pug);
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage || e));
	}
});

router.post('/saveUpdate', upload.single('upfile'), async (req, res, next) => {
	let connect, rs, temp;
	try{
		if(req.allow === false){ // undefined가 들어올 수 도 있으니
			res.send(alert(`${req.ext}은(는) 업로드 할 수 없습니다.`, '/board'));
		}
		else{
			connect = await pool.getConnection();
			if(req.file){
				temp = sqlGen('board', {
					mode: 'S',
					id: req.body.id,
					field: ['savefile']
				});
				rs = await connect.query(temp.sql);
				if(rs[0][0].savefile) await fs.remove(uploadFolder(rs[0][0].savefile));
			}
	
			temp = sqlGen('board', {
				mode: 'U',
				id: req.body.id,
				field: ['title', 'writer', 'content'],
				data: req.body,
				file: req.file
			});
			rs = await connect.query(temp.sql, temp.values);
			connect.release();
			res.send(alert('수정되었습니다.', '/board'));
		}
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage || e));
	}
});

router.get('/download', (req, res, next) => {
/* 
	let saveFile = req.query.file;
	let realFile = req.query.name;
 */
	let {file : saveFile, name : realFile} = req.query; // 위에 선언한 내용을 구조분해할당으로 받기
	res.download(uploadFolder(saveFile), realFile);
});

router.get('/fileRemove/:id', async (req, res, next) => {
	let connect, rs, temp;
	try{
		connect = await pool.getConnection();
		temp = sqlGen('board', {
			mode: 'S',
			id: req.params.id,
			field: ['savefile']
		});
		rs = await connect.query(temp.sql);

		if(rs[0][0].savefile) await fs.remove(uploadFolder(rs[0][0].savefile));
		temp = sqlGen('board', {
			mode: 'U',
			id: req.params.id,
			field: ['realfile', 'savefile'],
			data: {realfile: null, savefile: null}
		});
		rs = await connect.query(temp.sql, temp.values);
		connect.release();
		res.json({code: 200});
	}
	catch(e){
		if(connect) connect.release();
		// next(createError(500, e.sqlMessage || e)); Ajax 통신시, 페이지가 이동하면 안됨.
		res.json({code: 500, err: e});
	}
});

module.exports = router;