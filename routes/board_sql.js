const express = require('express');
const moment = require('moment');
const path = require('path');
const fs = require('fs-extra');
const createError = require('http-errors');
const router = express.Router();
const {pool} = require('../modules/mysql_conn');
const {alert, uploadFolder} = require('../modules/util');
const {upload, imgExt} = require('../modules/multer_conn');

router.get(['/', '/list'], async (req, res, next) => { // 127.0.0.1:3000/board 혹은 127.0.0.1:3000/board/list
	let connect, rs, sql, values, pug;
	pug = {title: '게시판 리스트', js: 'board', css: 'board'};
	try{
		sql = 'SELECT * FROM board ORDER BY id DESC'
		connect = await pool.getConnection();
		rs = await connect.query(sql); // 쿼리문에 ?가 포함되지 않으므로 values는 제외
		connect.release();
		pug.lists = rs[0];
		pug.lists.forEach((v) => {
			v.wdate = moment(v.wdate).format('YYYY-MM-DD');
		});
		res.render('./board/list.pug', pug);
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}
});

router.get('/write', (req, res, next) => {
	const pug = {title: '게시글 작성', js: 'board', css: 'board'};
	res.render('./board/write.pug', pug);
});

router.post('/save', upload.single('upfile'), async (req, res, next) => { // 주의) get 방식이 아니라 post 방식으로 받음
	let connect, rs, sql, values, pug;
	let {title, content, writer} = req.body;
	try{
		values = [title, content, writer];
		sql = 'INSERT INTO board SET title=?, content=?, writer=?';

		// 파일 형식이 허용되든 아니든 upload 시켰다면, req에 allowUpload가 존재
		if(req.allowUpload){ 
			if(req.allowUpload.allow){ // allowUpload: {allow: true, ext: jpg};파일이 허용되는 형식이라면
				values.push(req.file.filename);
				values.push(req.file.originalname);
				sql += ', savefile=?, realfile=?';
			}
			else{ // allowUpload: {allow: false, ext: jpg};파일이 허용되는 형식이 아니라면
				res.send(alert(`${req.allowUpload.ext}은(는) 업로드 할 수 없습니다.`, '/board'));
			}
		}
	
		connect = await pool.getConnection();
		console.log(connect);
		rs = await connect.query(sql, values);
		connect.release();
		res.redirect('/board');
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}	
});

router.get('/view/:id', async (req, res) => {
	let connect, rs, sql, values, pug;
	try{
		pug = {title: '게시판 보기', js: 'board', css: 'board'};
		sql = 'SELECT * FROM board WHERE id=?';
		values = [req.params.id]; // :id은 params로 받아 id의 값으로 넣어준다.
		connect = await pool.getConnection();
		rs = await connect.query(sql, values);
		connect.release();
		pug.list = rs[0][0];
		pug.list.wdate = moment(pug.list.wdate).format('YYYY-MM-DD HH:mm:ss');
		if(pug.list.savefile){
			var ext = path.extname(pug.list.savefile).toLowerCase().replace(".", "");
			if(imgExt.indexOf(ext) > -1){ // 이미지라면
				pug.list.imgSrc = `/storage/${pug.list.savefile.substr(0, 6)}/${pug.list.savefile}`;
			}
		}
		res.render('./board/view.pug', pug);
		// res.json(rs);
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}
});

router.get('/delete/:id', async (req, res, next) => {
	let connect, rs, sql, values, pug;
	try{
		sql = 'DELETE FROM board WHERE id=?';
		values = [req.params.id];
		connect = await pool.getConnection();
		rs = await connect.query(sql, values);
		connect.release();
		res.send(alert('삭제되었습니다.', '/board'));
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}
});

router.get('/update/:id', async (req, res, next) => {
	let connect, rs, sql, values, pug;
	try{
		pug = {title: '게시판 수정', js: 'board', css: 'board'};
		sql = 'SELECT * FROM board WHERE id=?';
		values = [req.params.id];
		connect = await pool.getConnection();
		rs = await connect.query(sql, values);
		connect.release();
		pug.list = rs[0][0];
		res.render('./board/write.pug', pug);
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}
});

router.post('/saveUpdate', upload.single('upfile'), async (req, res, next) => {
	let connect, rs, sql, sqlRoot, values, pug;
	let {id, title, writer, content} = req.body;
	try{
		sqlRoot = 'UPDATE board SET title=?, writer=?, content=?';
		values = [title, writer, content];
		if(req.allowUpload){ 
			if(req.allowUpload.allow){ // allowUpload: {allow: true, ext: jpg};파일이 허용되는 형식이라면
				sql = 'SELECT savefile FROM board WHERE id='+id;
				connect = await pool.getConnection();
				rs = await connect.query(sql);
				if(rs[0][0].savefile) fs.removeSync(uploadFolder(rs[0][0].savefile));
				sqlRoot += ', savefile=?, realfile=?';
				values.push(req.file.filename);
				values.push(req.file.originalname);
			}
			else{ // allowUpload: {allow: false, ext: jpg};파일이 허용되는 형식이 아니라면
				res.send(alert(`${req.allowUpload.ext}은(는) 업로드 할 수 없습니다.`, '/board'));
			}
		}
		sqlRoot += 'WHERE id='+id;

		connect = await pool.getConnection();
		rs = await connect.query(sqlRoot, values);
		connect.release();
		if(rs[0].affectedRows == 1) res.send(alert('수정되었습니다.', '/board'));
		else res.send(alert('수정에 실패하였습니다.', '/board'));
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
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
	let connect, rs, sql, values, list, pug;
	try{
		sql = 'SELECT * FROM board WHERE id='+req.params.id;
		connect = await pool.getConnection();
		rs = await connect.query(sql);
		connect.release();
		list = rs[0][0];
		if(list.savefile){
			try{
				fs.removeSync(uploadFolder(list.savefile));
				sql = 'UPDATE board SET savefile=NULL, realfile=NULL WHERE id='+id;
				// connect, rs, connect.release() : 한 세트로 볼 것
				connect = await pool.getConnection();
				rs = await connect.query(sql);
				connect.release();
				res.json({code: 200});
			}
			catch(e){
				res.json({code: 500, err: e});
			}
		}
	}
	catch(e){
		if(connect) connect.release();
		next(createError(500, e.sqlMessage));
	}
});

module.exports = router;