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
                    let youtubeEmbedHtml = "";
                    let btnsHtml = "";
                    
                    // 1. 구글 문서 임베드 (E열)
                    // 1. 구글 문서 임베드 로직 (E열)
if (docUrl && docUrl.includes("docs.google.com/document")) {
    let embedUrl = docUrl + (docUrl.includes("?") ? "&" : "?") + "embedded=true";
    docEmbedHtml = `
        <div class="embed-container">
            <iframe src="${embedUrl}" style="width:100%; height:700px; border:none; display:block;"></iframe>
        </div>
        <p style="text-align:center; margin-top:10px;">
            <a href="${docUrl}" target="_blank" style="font-size:12px; color:#888; text-decoration:none;">↗ 새 창에서 문서 전체 보기</a>
        </p>`;
}

                    // 2. 유튜브 임베드 (F열)
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

                    popupContent.innerHTML = `
                        <h2>${title}</h2>
                        <p style="color:#999; font-size:13px;">${date}</p>
                        <div class="popup-body" style="white-space:pre-wrap; margin-top:20px; font-size:14px;">${content}</div>
                        ${youtubeEmbedHtml}
                        ${docEmbedHtml}
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
