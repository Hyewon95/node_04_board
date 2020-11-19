// crypt : 단방향 암호화
// cipher : 양방향 암복호화
// session : 서버가 가지는 전역변수
// cookie : 클라이언트가 가지는 전역변수
// CORS(Cross Origin Resource Share) : 통신규칙
// proxy - forward proxy
// proxy - reverse proxy

const crypto = require('crypto');
const bcrypt = require('bcrypt');

let password = 'abcd1234';
let salt = 'adsffadsfasdfsdf!@$#%^*&';
let hash = crypto.createHash('sha512').update(password+salt).digest('base64'); // password를 'sha512'방식으로 암호화 & 표현방식은 'base64'
hash = crypto.createHash('sha512').update(hash).digest('base64');
hash = crypto.createHash('sha512').update(hash).digest('base64');
hash = crypto.createHash('sha512').update(hash).digest('base64');
hash = crypto.createHash('sha512').update(hash).digest('base64');
// 로그인시, 사용자가 넣은 패스워드를 sha512방식으로 암호화하여 비교
// 해커들은 인기있는 패스워드 sha512 방식으로 암호화한 테이블을 가지고 있어 해킹당할 위험이 있으므로, 이를 방어할 salt를 선언함과 동시에 여러번 돌린다.
// 로그인시, 입력된 값을 서버로 평문으로 보내다가 하이젯 해킹을 당하지 못하도록 하기위해 https 서버 구현(인증서?)
// 최소 256bit이상 암복호화 가능
console.log(hash);

const cipher = crypto.createCipher('aes-256-cbc', salt); // 인증서 + 키(≒salt)
let result = cipher.update('아버지를 아버지라 ...', 'utf-8', 'base64');
result += cipher.final('base64');
console.log(result);

let decipher = crypto.createDecipher('aes-256-cbc', salt);
let result2 = decipher.update(result, 'base64', 'utf-8');
result2 += decipher.final('utf-8');
console.log(result2);

// 웹이 만들어지기 전에는 클라이언트가 로그인을 하게되면 항상 서버에 접속이 유지됨.
// 즉, exit로 빠져나가기 전에는 해당 서버는 계속 나를 인식하고 있음.
// 이전에는 소수의 인원이 서버를 점령하고 있어 이를 해결하기 위해 www(World Wide Web)과 http 통신규약 생성됨.
// CGI > ASP(deprecated > ASPX) / PHP / JSP > NODE

// 사용자의 정보를 server에 남기게 되면 비동기라 session에 정보를 15분간 가지고 있는데 사용자 수가 늘어나게되면 overflow되어 서버가 터짐
// 반면 cookie에 남기게 되면 서버가 제대로 작동을 못함
// 즉, 이를 해결하기 위해 새로운 데이터베이스(대표적으로 mongo, redis)에 무작위로 저장

// bcrypt는 async/await/promises 지원
async function bcryptTest(){
	let bcryptHash = await bcrypt.hash(password+salt, 8); // "password+salt"를 8번정도 암호화하여 결과를 보여줌.
	let bcryptHash2 = await bcrypt.hash(password+salt, 8);
	let bcryptCompare = await bcrypt.compare(password+salt, bcryptHash); // 둘의 결과를 비교하여 일치하면 true, 불일치하면 false
	console.log(bcryptHash, bcryptHash2, bcryptCompare); // bcryptHash와 bcryptHash2의 결과값은 다름.
}

bcryptTest();