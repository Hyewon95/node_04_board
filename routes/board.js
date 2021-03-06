const express = require('express');
const moment = require('moment');
const path = require('path');
const fs = require('fs-extra');
const createError = require('http-errors');
const router = express.Router();
const {pool, sqlGen} = require('../modules/mysql_conn');
const {alert, uploadFolder, imgFolder, extGen} = require('../modules/util');
const {upload, imgExt} = require('../modules/multer_conn');
const pager = require('../modules/pager_conn');

/* check! */
router.get(['/', '/list', '/list/:page'], async (req, res, next) => { // 127.0.0.1:3000/board 혹은 127.0.0.1:3000/board/list
	let page = req.params.page || 1, totalRecord=null;
	let connect, rs, pug;
	pug = {
		title: '게시판 리스트',
		js: 'board',
		css: 'board',
		...pagers,
		user: req.session ? req.session.user : {}
	};
	try{ // check
		rs = await sqlGen('board', 'S', {
			field: ['count(id)']
		});
		// rs[0][0].count(id); 오류발생
		let pagers = pager(page, rs[0][0]['count(id)'], {pagerCnt: 5, listCnt: 10}); // totalRecord = rs[0][0]['count(id)']
		pug = {...pug, ...pagers}; // check!
		rs = await sqlGen('board', 'S', { // 보통 다음과 같이 table명을 첫번째 인자로 빼줌
			order: ['id', 'DESC'],
			limit: [pagers.startIdx, pagers.listCnt]
		});
		/* 
		let temp = sqlGen('board', {mode: 'S', desc: 'ORDER BY id DESC'});
		connect = await pool.getConnection();
		rs = await connect.query(temp.sql); // 쿼리문에 ?가 포함되지 않으므로 values는 제외
		connect.release();
		*/
		pug.pagers = pagers;
		pug.lists = rs[0];
		pug.lists.forEach((v) => {
			v.wdate = moment(v.wdate).format('YYYY-MM-DD');
		});
		res.render('./board/list.pug', pug);
	}
	catch(e){
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
			rs = await sqlGen('board', 'I', {
				field: ['title', 'content', 'writer'],
				data: req.body,
				file: req.file
			});
			res.redirect('/board');
		}
	}
	catch(e){
		next(createError(500, e.sqlMessage || e));
	}	
});

router.get('/view/:id', async (req, res) => {
	let connect, rs, pug;
	try{
		pug = {title: '게시판 보기', js: 'board', css: 'board'};
		rs = await sqlGen('board', 'S', {
			where: ['id', req.params.id] // :id은 params로 받아 id의 값으로 넣어준다.
		});
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
		next(createError(500, e.sqlMessage || e));
	}
});

router.get('/delete/:id', async (req, res, next) => {
	let connect, rs;
	try{
		rs = await sqlGen('board', 'S', {
			where: ['id', req.params.id],
			field: ['savefile']
		});
		if(rs[0][0].savefile) await fs.remove(uploadFolder(rs[0][0].savefile));

		rs = await sqlGen('board', 'D', {
			where: ['id', req.params.id]
		});
		res.send(alert('삭제되었습니다.', '/board'));
	}
	catch(e){
		next(createError(500, e.sqlMessage || e));
	}
});

router.get('/update/:id', async (req, res, next) => {
	let connect, rs, pug;
	try{
		pug = {title: '게시판 수정', js: 'board', css: 'board'};
		rs = await sqlGen('board', 'S', {
			where: ['id', req.params.id]
		});
		pug.list = rs[0][0];
		res.render('./board/write.pug', pug);
	}
	catch(e){
		next(createError(500, e.sqlMessage || e));
	}
});

router.post('/saveUpdate', upload.single('upfile'), async (req, res, next) => {
	let connect, rs;
	try{
		if(req.allow === false){ // undefined가 들어올 수 도 있으니
			res.send(alert(`${req.ext}은(는) 업로드 할 수 없습니다.`, '/board'));
		}
		else{
			if(req.file){
				rs = await sqlGen('board', 'S', {
					where: ['id', req.body.id],
					field: ['savefile']
				});
				if(rs[0][0].savefile) await fs.remove(uploadFolder(rs[0][0].savefile));
			}
	
			rs = await sqlGen('board', 'U', {
				where: ['id', req.body.id],
				field: ['title', 'writer', 'content'],
				data: req.body,
				file: req.file
			});
			res.send(alert('수정되었습니다.', '/board'));
		}
	}
	catch(e){
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
	let connect, rs;
	try{
		rs = await sqlGen('board', 'S', {
			where: ['id', req.params.id],
			field: ['savefile']
		});

		if(rs[0][0].savefile) await fs.remove(uploadFolder(rs[0][0].savefile));
		rs = await sqlGen('board', 'U', {
			where: ['id', req.params.id],
			field: ['realfile', 'savefile'],
			data: {realfile: null, savefile: null}
		});
		res.json({code: 200});
	}
	catch(e){
		// next(createError(500, e.sqlMessage || e)); Ajax 통신시, 페이지가 이동하면 안됨.
		res.json({code: 500, err: e});
	}
});

module.exports = router;