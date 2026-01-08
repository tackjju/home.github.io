const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRLeQeFdWLt6yUX0daihRFirATwDLOS01O8G7U2NMlHVPdfAXEpD1Btp4VzmhxccXghSXawTgo9PUPS/pub?gid=0&single=true&output=csv";

// CSV 파서
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
    let btnsHtml = "";
    
    // E열(docUrl)에 구글 문서 주소가 있을 경우
    if (docUrl.includes("docs.google.com/document")) {
        // 이미 /pub이 포함된 링크라면 그대로 사용하고, 아니면 /pub을 붙여줍니다.
        let embedUrl = docUrl;
        if (!embedUrl.includes("/pub")) {
            embedUrl = embedUrl.split('/edit')[0] + "/pub";
        }
        
        // iframe용 파라미터(embedded=true)를 추가합니다.
        embedUrl += (embedUrl.includes("?") ? "&" : "?") + "embedded=true";

        docEmbedHtml = `
            <div style="margin-top:20px; border:1px solid #ddd; border-radius:8px; overflow:hidden; background: #fff;">
                <iframe src="${embedUrl}" style="width:100%; height:600px; border:none;"></iframe>
            </div>`;
    }
                    // 팝업 화면 그리기
                    popupContent.innerHTML = `
                        <h2>${title}</h2>
                        <p style="color:#999; font-size:13px;">${date}</p>
                        
                        <div class="popup-body" style="white-space:pre-wrap; margin-top:20px; line-height:1.6; font-size:14px;">${content}</div>
                        
                        ${docEmbedHtml}
                        
                        <div style="margin-top:25px; border-top:1px solid #eee; padding-top:15px;">
                            ${btnsHtml}
                        </div>
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
