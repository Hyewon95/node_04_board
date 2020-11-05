const express = require('express');
const moment = require('moment');
const router = express.Router();
const {pool} = require('../modules/mysql_conn');
const {alert} = require('../modules/util');

router.get(['/', '/list'], async (req, res, next) => { // 127.0.0.1:3000/board 혹은 127.0.0.1:3000/board/list
	const pug = {title: '게시판 리스트', js: 'board', css: 'board'};
	try{
		const sql = 'SELECT * FROM board ORDER BY id DESC'
		const connect = await pool.getConnection();
		const rs = await connect.query(sql); // 쿼리문에 ?가 포함되지 않으므로 values는 제외
		connect.release();
		pug.lists = rs[0];
		pug.lists.forEach((v) => {
			v.wdate = moment(v.wdate).format('YYYY-MM-DD');
		});
		res.render('./board/list.pug', pug);
	}
	catch(err){
		next(err);
	}
});

router.get('/write', (req, res, next) => {
	const pug = {title: '게시글 작성', js: 'board', css: 'board'};
	res.render('./board/write.pug', pug);
});

router.post('/save', async (req, res, next) => { // 주의) get 방식이 아니라 post 방식으로 받음
	const {title, content, writer} = req.body;
	var values = [title, content, writer];
	var sql = 'INSERT INTO board SET title=?, content=?, writer=?';
	try{
		const connect = await pool.getConnection();
		console.log(connect);
		const rs = await connect.query(sql, values);
		connect.release();
		res.redirect('/board');
	}
	catch(err){
		next(err);
	}	
});

router.get('/view/:id', async (req, res) => {
	try{
		const pug = {title: '게시판 보기', js: 'board', css: 'board'};
		const sql = 'SELECT * FROM board WHERE id=?';
		const values = [req.params.id]; // :id은 params로 받아 id의 값으로 넣어준다.
		const connect = await pool.getConnection();
		const rs = await connect.query(sql, values);
		connect.release();
		pug.list = rs[0][0];
		pug.list.wdate = moment(pug.list.wdate).format('YYYY-MM-DD HH:mm:ss');
		res.render('./board/view.pug', pug);
		// res.json(rs);
	}
	catch(err){
		next(err);
	}
});

router.get('/delete/:id', async (req, res, next) => {
	try{
		const sql = 'DELETE FROM board WHERE id=?';
		const values = [req.params.id];
		const connect = await pool.getConnection();
		const rs = await connect.query(sql, values);
		connect.release();
		res.send(alert('삭제되었습니다.', '/board'));
	}
	catch(err){
		next(err);
	}
});

router.get('/update/:id', async (req, res, next) => {
	try{
		const pug = {title: '게시판 수정', js: 'board', css: 'board'};
		const sql = 'SELECT * FROM board WHERE id=?';
		const values = [req.params.id];
		const connect = await pool.getConnection();
		const rs = await connect.query(sql, values);
		connect.release();
		pug.list = rs[0][0];
		res.render('./board/write.pug', pug);
	}
	catch(err){
		next(err);
	}
});

router.post('/saveUpdate', async (req, res, next) => {
	const {id, title, writer, content} = req.body;
	try{
		const sql = 'UPDATE board SET title=?, writer=?, content=? WHERE id=?';
		const values = [title, writer, content, id];
		const connect = await pool.getConnection();
		const rs = await connect.query(sql, values);
		connect.release();
		if(rs[0].affectedRows == 1) res.send(alert('수정되었습니다.', '/board'));
		else res.send(alert('수정에 실패하였습니다.', '/board'));
	}
	catch(err){
		next(err);
	}
});

module.exports = router;
