const express = require('express');
const router = express.Router();
const {pool} = require('../modules/mysql_conn');

router.get(['/', '/list'], (req, res, next) => { // 127.0.0.1:3000/board 혹은 127.0.0.1:3000/board/list
	const pug = {title: '게시판 리스트', js: 'board', css: 'board'};
	res.render('./board/list.pug', pug);
});

router.get('/write', (req, res, next) => {
	const pug = {title: '게시글 작성', js: 'board', css: 'board'};
	res.render('./board/write.pug', pug);
});

router.post('/save', async (req, res, next) => { // 주의) get 방식이 아니라 post 방식으로 받음
	const {title, content, writer} = req.body;
	var values = [title, content, writer];
	var sql = 'INSERT INTO board SET title=?, writer=?, content=?';
	try {
		const connect = await pool.getConnection();
		console.log(connect);
		const rs = await connect.query(sql, values);
		connect.release();
		res.json(rs[0]);
	}
	catch(err) {
		next(err);
	}	
});

module.exports = router;