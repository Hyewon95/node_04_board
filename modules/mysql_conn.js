// mysql 접근을 위한 권한
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_DATABASE,
	port: process.env.DB_PORT,
	waitForConnections: true,
	connectionLimit: 10
});

const sqlGen = async (table, obj) => {
	let {mode=null, field=[], data={}, file=null, id=null, desc=null} = obj;
	let sql=null, values=[], connect=null, rs=null;
	let temp = Object.entries(data).filter(v => field.includes(v[0]));
	console.log(temp);
	// includes ≒ indexOf
	// entries : object를 꿰어 'key: value' 배열형식

	switch(mode){
		case 'I':
			sql = `INSERT INTO ${table} SET `;
			break;
		case 'U':
			sql = `UPDATE ${table} SET `;
			break;
		case 'D':
			sql = `DELETE FROM ${table} WHERE id=${id} `; // 마지막 ' '추가 이유 : sql = sql.substr(0, sql.length - 1);
			break;
		case 'S':
			sql = `SELECT ${field.length == 0 ? '*' : field.toString()} FROM ${table} `;
			if(id) sql += `WHERE id=${id} `; // 마지막 ' '추가 이유 : sql = sql.substr(0, sql.length - 1);
			if(desc) sql += `${desc} `;
			break;
	}

	for(let v of temp){
		sql += `${v[0]}=?,`;
		values.push(v[1]);
	}

	if(file){ // file 정보를 보내주는냐 아니냐
		sql += `savefile=?,realfile=?,`;
		values.push(file.filename);
		values.push(file.originalname);
	}

	sql = sql.substr(0, sql.length - 1); // 마지막 ',' 제거
	if(mode == 'I', mode == 'U') sql += ` WHERE id=${id}`;
	connect = await pool.getConnection();
	rs = await connect.query(sql, values);
	connect.release();
	return rs;
}

module.exports = {mysql, pool, sqlGen};