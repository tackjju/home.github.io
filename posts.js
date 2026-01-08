const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRLeQeFdWLt6yUX0daihRFirATwDLOS01O8G7U2NMlHVPdfAXEpD1Btp4VzmhxccXghSXawTgo9PUPS/pub?gid=0&single=true&output=csv";

// CSV의 따옴표와 복잡한 링크를 완벽하게 보존하는 파서
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

    try {
        const res = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const text = await res.text();
        const rows = parseCSV(text);

        listEl.innerHTML = ""; 

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            
            // 시트의 칸 순서: [0]제목, [1]날짜, [2]카테고리, [3]내용, [4]문서링크(E), [5]영상링크(F)
            const title = row[0] || "";
            const date = row[1] || "";
            const cat = row[2] ? row[2].trim().toLowerCase() : "";
            const content = row[3] || "";
            const docUrl = row[4] ? row[4].trim() : "";
            const mediaUrl = row[5] ? row[5].trim() : ""; // 여기가 사용자님이 말씀하신 F열!

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
                    let btnsHtml = "";
                    
                    // 문서 버튼 (E열)
                    if (docUrl.startsWith("http")) {
                        btnsHtml += `<a href="${docUrl}" target="_blank" class="nav-btn" style="display:block; margin-top:10px; background:#f0f0f0; text-align:center; padding:12px; text-decoration:none; color:black; border-radius:5px;">📄 문서 보기</a>`;
                    }
                    
                    // 유튜브 버튼 (F열) - 조건문을 더 널널하게 잡았습니다.
                    if (mediaUrl && (mediaUrl.includes("youtube.com") || mediaUrl.includes("youtu.be") || mediaUrl.includes("http"))) {
                        btnsHtml += `<a href="${mediaUrl}" target="_blank" class="nav-btn" style="display:block; margin-top:10px; background:#FF0000; color:white; text-align:center; padding:12px; text-decoration:none; font-weight:bold; border-radius:5px;">▶ 유튜브 영상 보기</a>`;
                    }

                    popupContent.innerHTML = `
                        <h2>${title}</h2>
                        <p style="color:#999; font-size:13px;">${date}</p>
                        <div class="popup-body" style="white-space:pre-wrap; margin-top:20px; line-height:1.6;">${content}</div>
                        <div style="margin-top:25px; border-top:1px solid #eee; padding-top:15px;">${btnsHtml}</div>
                    `;
                    popup.classList.remove("hidden");
                };
                listEl.appendChild(div);
            }
        }
    } catch (err) { console.error(err); }
}

document.addEventListener("click", (e) => {
    if (e.target.id === "popupClose") document.getElementById("popup").classList.add("hidden");
});
