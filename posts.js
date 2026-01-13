const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRLeQeFdWLt6yUX0daihRFirATwDLOS01O8G7U2NMlHVPdfAXEpD1Btp4VzmhxccXghSXawTgo9PUPS/pub?gid=0&single=true&output=csv";

// CSV 파싱 함수
function parseCSV(text) {
    const result = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuotes) {
            if (char === '"' && text[i+1] === '"') { field += '"'; i++; }
            else if (char === '"') inQuotes = false;
            else field += char;
        } else {
            if (char === '"') inQuotes = true;
            else if (char === ',') { row.push(field); field = ""; }
            else if (char === '\r' || char === '\n') {
                if (field || row.length > 0) { row.push(field); result.push(row); field = ""; row = []; }
                if (char === '\r' && text[i+1] === '\n') i++;
            } else field += char;
        }
    }
    if (field || row.length > 0) { row.push(field); result.push(row); }
    return result;
}

// 포스트 로드 함수
async function loadPosts(category) {
    const listEl = document.getElementById("thread-list");
    const popup = document.getElementById("popup");
    const popupContent = document.getElementById("popupContent");

    if (!listEl) return;

    try {
        const res = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const text = await res.text();
        const rows = parseCSV(text);

        // [최신순 정렬] 첫 줄(헤더) 제외하고 데이터만 뒤집기
        const dataRows = rows.slice(1).reverse();

        listEl.innerHTML = ""; 

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const title = row[0] || "";
            const date = row[1] || "";
            const cat = row[2] ? row[2].trim().toLowerCase() : "";
            const content = row[3] || "";
            const docUrl = row[4] ? row[4].trim() : "";
            const mediaUrl = row[5] ? row[5].trim() : "";

            if (cat === category.toLowerCase()) {
                const div = document.createElement("div");
                div.className = "thread";
                div.innerHTML = `
                    <div class="thread-header">
                        <span class="thread-title">${title}</span>
                        <span style="float:right; font-size:12px; color:#888;">${date}</span>
                    </div>
                    <div class="thread-preview">${content.substring(0, 50)}...</div>
                `;

                div.onclick = () => {
                    let docEmbedHtml = "";
                    let youtubeEmbedHtml = "";
                    
                    // 1. 구글 문서 임베드 로직 (테두리 및 중복 스타일 제거)
                    if (docUrl && docUrl.includes("docs.google.com/document")) {
                        let embedUrl = docUrl + (docUrl.includes("?") ? "&" : "?") + "embedded=true";
                        docEmbedHtml = `
                            <div class="embed-container">
                                <iframe src="${embedUrl}" style="width:100%; height:800px; border:none; display:block; background: transparent;"></iframe>
                            </div>
                            <p style="text-align:center; margin-top:15px;">
                                <a href="${docUrl}" target="_blank" style="font-size:12px; color:#888; text-decoration:none;">↗ 새 창에서 문서 전체 보기</a>
                            </p>`;
                    }

                    // 2. 유튜브 임베드 로직
                    if (mediaUrl && (mediaUrl.includes("youtube.com") || mediaUrl.includes("youtu.be"))) {
                        let videoId = "";
                        if (mediaUrl.includes("v=")) {
                            videoId = mediaUrl.split("v=")[1].split("&")[0];
                        } else if (mediaUrl.includes("youtu.be/")) {
                            videoId = mediaUrl.split("youtu.be/")[1].split("?")[0];
                        }
                        
                        if (videoId) {
                            youtubeEmbedHtml = `
                                <div style="margin-top:20px; aspect-ratio: 16/9; border-radius:8px; overflow:hidden;">
                                    <iframe src="https://www.youtube.com/embed/${videoId}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>
                                </div>`;
                        }
                    }

                    // 팝업 내용 구성
                    popupContent.innerHTML = `
                        <h2>${title}</h2>
                        <p style="color:#999; font-size:13px;">${date}</p>
                        <div class="popup-body" style="white-space:pre-wrap; margin-top:20px; font-size:15px; line-height:1.8;">${content}</div>
                        ${youtubeEmbedHtml}
                        ${docEmbedHtml}
                    `;
                    popup.classList.remove("hidden");
                    popup.scrollTop = 0; // 팝업 열 때 스크롤 맨 위로
                };
                listEl.appendChild(div);
            }
        }
    } catch (err) { 
        console.error("데이터 로드 에러:", err); 
    }
}


// 팝업 닫기 이벤트 (X 버튼 클릭 OR 팝업 바깥 영역 클릭 시)
document.addEventListener("click", (e) => {
    const popup = document.getElementById("popup");
    
    // 1. X 버튼을 눌렀을 때
    if (e.target.id === "popupClose") {
        popup.classList.add("hidden");
    }
    
    // 2. 팝업 바깥(빈 화면)을 눌렀을 때 닫기
    // 클릭된 대상이 popup 자체(검은 배경 역할을 하는 컨테이너)라면 닫습니다.
    if (e.target === popup) {
        popup.classList.add("hidden");
    }
});
