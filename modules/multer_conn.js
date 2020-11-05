const multer = require('multer');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const {v4:uuidv4} = require('uuid'); // uuidv4 난수 생성

const makeFolder = () => {
	let result = {err: null}; // #2
	let folder = path.join(__dirname, '../uploads', moment().format('YYMMDD')); // #3
	result.folder = folder; // #4 result = {err: null, folder: folder};

	// fs.existsSync() : filesystem;노드에 있는 폴더의 존재 유무 확인
	// fs.mkdir() : 폴더 생성
	if(!fs.existsSync(folder)){ // #5 폴더가 존재하지 않는다면
		fs.mkdir(folder, (err) => { // #6
			if(err) result.err = err; // #7 폴더 생성 실패시
			return result; // #7 폴더 생성 성공시
		})
	}
	else return result; // #5 폴더가 존재한다면
};

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const result = makeFolder(); // #1
		result.err ? cb(err) : cb(null, result.folder); // #8
	},
	filename: function (req, file, cb) {
		let ext = path.extname(file.originalname); // 확장자 추출 ex) aa.jpg에서 jpg 추출
		let saveName = moment().format('YYMMDD') + '-' + uuidv4() + ext; // ex) 201105-(난수).jpg
		cb(null, saveName);
	}
})
const upload = multer({storage: storage})

module.exports = {upload};