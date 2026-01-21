const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRLeQeFdWLt6yUX0daihRFirATwDLOS01O8G7U2NMlHVPdfAXEpD1Btp4VzmhxccXghSXawTgo9PUPS/pub?gid=0&single=true&output=csv";

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

async function loadPosts(category) {
    const listEl = document.getElementById("thread-list");
    const popup = document.getElementById("popup");
    const popupContent = document.getElementById("popupContent");
    
    // 요소가 없으면 실행 중단
    if (!listEl || !popup || !popupContent) {
        console.error("필수 HTML 요소(thread-list, popup 등)를 찾을 수 없습니다.");
        return;
    }

    try {
        // 캐시 방지를 위해 시간값 추가
        const res = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        if (!res.ok) throw new Error("데이터를 불러오는데 실패했습니다.");
        
        const text = await res.text();
        const rows = parseCSV(text);
        
        // 데이터가 헤더(1줄)밖에 없으면 중단
        if (rows.length <= 1) {
            listEl.innerHTML = "<p style='padding:20px;'>등록된 글이 없습니다.</p>";
            return;
        }

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
                    
                    // 이미지 태그 변환
                    let formattedContent = content.replace(/\[img:(.*?)\]/g, (match, url) => {
                        return `<img src="${url.trim()}" style="width:100%; border-radius:4px; margin: 15px 0; display:block;" onerror="this.style.display='none'">`;
                    });

                    // 유튜브 처리
                    if (mediaUrl && (mediaUrl.includes("youtube.com") || mediaUrl.includes("youtu.be"))) {
                        let videoId = "";
                        if (mediaUrl.includes("v=")) videoId = mediaUrl.split("v=")[1].split("&")[0];
                        else if (mediaUrl.includes("youtu.be/")) videoId = mediaUrl.split("youtu.be/")[1].split("?")[0];
                        if (videoId) {
                            youtubeEmbedHtml = `<div style="margin-top:20px; aspect-ratio: 16/9; border-radius:8px; overflow:hidden;"><iframe src="https://www.youtube.com/embed/${videoId}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe></div>`;
                        }
                    }

                    // 구글 문서 처리
                    if (docUrl && docUrl.includes("docs.google.com/document")) {
                        let embedUrl = docUrl + (docUrl.includes("?") ? "&" : "?") + "embedded=true";
                        docEmbedHtml = `<div class="embed-container" style="margin-top:20px;"><iframe src="${embedUrl}" style="width:100%; height:800px; border:none; display:block; background: transparent;"></iframe></div>`;
                    }

                    // posts.js 내의 popupContent.innerHTML 부분 수정
popupContent.innerHTML = `
    <h2>${title}</h2>
    <p style="color:#999; font-size:13px;">${date}</p>
    <div class="popup-body" style="white-space:pre-wrap; margin-top:20px; font-size:15px; line-height:1.8;">${formattedContent}</div>
    ${youtubeEmbedHtml}
    ${docEmbedHtml}
    <div style="height: 100px; width: 100%;"></div> 
`;
                    popup.classList.remove("hidden");
                    popup.scrollTop = 0;
                };
                listEl.appendChild(div);
            }
        }
    } catch (err) { 
        console.error("에러 발생:", err); 
        listEl.innerHTML = "<p style='padding:20px;'>데이터를 불러오는 중 오류가 발생했습니다.</p>";
    }
}

// 팝업 닫기 이벤트
document.addEventListener("click", (e) => {
    const popup = document.getElementById("popup");
    const popupContent = document.getElementById("popupContent");
    if (!popup) return;
    
    if (e.target.id === "popupClose") {
        popup.classList.add("hidden");
    }
    // 팝업 배경을 클릭했을 때만 닫기
    if (e.target === popup) {
        popup.classList.add("hidden");
    }
});
