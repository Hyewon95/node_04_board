const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const bcrypt = require('bcrypt');
const { sqlGen } = require('../modules/mysql_conn');
const { alert } = require('../modules/util');

router.get('/join', (req, res, next) => {
	const pug = {title: '회원 가입', js: 'user_fr', css: 'user_fr'};
	res.render('user/join', pug);
});

router.get('/idchk/:userid', async (req, res, next) => {
	try{
		let rs = await sqlGen('users', 'S', {
			field: ['userid'],
			where: ['userid', req.params.userid]
		});
		// rs[0] => [] 혹은 rs[0] => [{userid: 'gpdhd408}]
		if(rs[0].length > 0) res.json({code: 200, isUsed: false});
		else res.json({code: 200, isUsed: true});
	}
	catch(e){
		res.json({code: 500, err: e.sqlMessage || e});
		// next(createError(500, e.sqlMessage || e)); // 에러를 보내면 app.js로 가서 html 문서로 받아오므로 위와 같이 선언해야 됨
	}
});

router.post('/save', async (req, res, next) => {
	req.body.userpw = await bcrypt.hash(req.body.userpw + process.env.BCRYPT_SALT, Number(process.env.BCRYPT_ROUND));
	try{
		let rs = await sqlGen('users', 'I', {
			field: ['userid', 'userpw', 'username'],
			data: req.body
		});
		if(rs[0].affectedRows == 1){
			res.send(alert('회원가입이 완료되었습니다. 로그인 해주세요.', '/user/login'));
		}
		else res.send(alert('회원가입에 실패하였습니다. 다시 로그인 해주세요.', '/user/join'));
	}
	catch(e){
		next(createError(500, e.sqlMessage || e));
	}
})

router.get('/login', (req, res, next) => {
	const pug = {title: '회원 로그인', js: 'user_fr', css: 'user_fr'};
	res.render('user/login', pug);
});

router.post('/logon', async (req, res, next) => {
	try{
		let rs = await sqlGen('users', 'S', {
			where: ['userid', req.body.userid]
		});
		if(rs[0].length > 0){
			// 데이터베이스의 회원정보와 입력된 회원정보의 일치여부 확인
			let compare = await bcrypt.compare(req.body.userpw + process.env.BCRYPT_SALT, rs[0][0].userpw);
			if(compare){ // 회원정보가 일치한다면
				// 브라우저를 닫기 전까지는 session정보를 받아올 수 있음.(단, 기본값 15분임.)
				req.session.user = {
					userid: req.body.userid,
					username: req.body.username,
				}
				res.send(alert('로그인되었습니다..', '/board'));
			}
			else{ // 회원정보가 일치하지 않는다면
				res.send(alert('정보가 올바르지 않습니다.', '/user/login'));
			}
		}
		else{
			res.send(alert('정보가 올바르지 않습니다.', '/user/login'));
		}
	}
	catch(e){
		next(createError(500, e.sqlMessage || e));
	}
});

router.get('/logout', (req, res, next) => {
	if(req.session) req.session.destroy(); // 세션정보 삭제
	res.redirect('/board');
});

module.exports = router;