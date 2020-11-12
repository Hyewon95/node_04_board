const multer = require('multer');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const {v4: uuidv4} = require('uuid'); // uuidv4 난수 생성
const allowExt = ['jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'ppt', 'pptx', 'pdf'];
const imgExt = ['jpg', 'jpeg', 'png', 'gif'];

const makeFolder = /* async */ () => {
	const result = {err: null}; // #2
	const folder = path.join(__dirname, '../uploads', moment().format('YYMMDD')); // #3
	result.folder = folder; // #4 result = {err: null, folder: folder};
/* 
	// async await
	if(!fs.existsSync(folder)) {
		const err = await fsp.mkdir(folder);
		if(err) result.err = err;
		return result;
	}
	else return result;
 */
/* 
	// callback *** 문제 발생
	// fs.existsSync() : filesystem;노드에 있는 폴더의 존재 유무 확인
	// fs.mkdir() : 폴더 생성
	if(!fs.existsSync(folder)){ // #5 폴더가 존재하지 않는다면
		fs.mkdir(folder, (err) => { // #6
			if(err) result.err = err; // #7 폴더 생성 실패시(오류 발생)
			return result; // #7 폴더 생성 성공시
		})
	}
	else return result; // #5 폴더가 존재한다면
 */

	if(!fs.existsSync(folder)) fs.mkdirSync(folder);
	return result;
	
}
/* 
// async await
var storage = multer.diskStorage({
	destination: async (req, file, cb) => {
		const result = await makeFolder();
		result.err ? cb(err) : cb(null, result.folder);
	},
	filename: (req, file, cb) => {
		let ext = path.extname(file.originalname);
		let saveName = moment().format('YYMMDD') + '-' + uuidv4() + ext;
		cb(null, saveName);
	}
})
 */
const fileFilter = (req, file, cb) => {
	const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
	if(allowExt.indexOf(ext) > -1){ // 인덱스가 존재한다면
		req.allowUpload = {allow: true, ext};
		cb(null, true);	
	}
	else{
		req.allowUpload = {allow: false, ext};
		cb(null, false);
	}
}

var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const result = makeFolder(); // #1
		result.err ? cb(err) : cb(null, result.folder); // #8
	},
	filename: (req, file, cb) => {
		let ext = path.extname(file.originalname); // 확장자 추출 ex) aa.jpg에서 .jpg 추출
		let saveName = moment().format('YYMMDD') + '-' + uuidv4() + ext; // ex) 201105-(난수).jpg
		cb(null, saveName);
	}
})

const upload = multer({storage, fileFilter, limits: {fileSize: 20480000}});
// storage에 저장해줘, fileFilter를 거쳐줘, limits 다음과 같이 제한해줘.

module.exports = {upload, allowExt, imgExt};