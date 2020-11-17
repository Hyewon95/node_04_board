// let pagers = pager(2, 90, {listCnt: 5, pagerCnt: 5});
// page(현재 페이지) totalRecord(총 리스트 수) listCnt(한 페이지 당 최대 리스트 수) pagerCnt(보여질 최대 페이저 수)
// let pagers = pager(2, 90); 필수로 받아야 할 값

const pager = (page, totalRecord, obj) => { // 옵션은 obj로 받음
	page = Number(page);
	totalRecord = Number(totalRecord);
	let {listCnt=5, pagerCnt=3} = obj || {};
	let totalPage = Math.ceil(totalRecord / listCnt);
	let startIdx = (page - 1) * listCnt;
	let startPage = Math.floor((page - 1) / pagerCnt) * pagerCnt + 1;
	let endPage = startPage + pagerCnt - 1 > totalPage ? totalPage : startPage + pagerCnt - 1;
	let nextPage = page + 1 > totalPage ? 0 : page + 1; // 0 이면 disabled
	let prevPage = page - 1;
	return {page, totalRecord, listCnt, pagerCnt, totalPage, startIdx, startPage, endPage, nextPage, prevPage};
}

module.exports = pager;