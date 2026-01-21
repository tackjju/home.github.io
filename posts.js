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
    if (!listEl) return;

    try {
        const res = await fetch(`${SHEET_URL}&t=${Date.now()}`);
        const text = await res.text();
        const rows = parseCSV(text);
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
                    
                    // 1. 본문 내 [img:주소]를 찾아서 <img> 태그로 변환
                    // 정규표현식을 사용하여 [img:URL] 형식을 모두 이미지 태그로 바꿉니다.
                    let formattedContent = content.replace(/\[img:(.*?)\]/g, (match, url) => {
                        return `<img src="${url.trim()}" style="width:100%; border-radius:4px; margin: 15px 0; display:block;">`;
                    });

                    // 2. 유튜브 처리
                    if (mediaUrl && (mediaUrl.includes("youtube.com") || mediaUrl.includes("youtu.be"))) {
                        let videoId = "";
                        if (mediaUrl.includes("v=")) videoId = mediaUrl.split("v=")[1].split("&")[0];
                        else if (mediaUrl.includes("youtu.be/")) videoId = mediaUrl.split("youtu.be/")[1].split("?")[0];
                        if (videoId) {
                            youtubeEmbedHtml = `<div style="margin-top:20px; aspect-ratio: 16/9; border-radius:8px; overflow:hidden;"><iframe src="https://www.youtube.com/embed/${videoId}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe></div>`;
                        }
                    }

                    // 3. 구글 문서 처리
                    if (docUrl && docUrl.includes("docs.google.com/document")) {
                        let embedUrl = docUrl + (docUrl.includes("?") ? "&" : "?") + "embedded=true";
                        docEmbedHtml = `<div class="embed-container"><iframe src="${embedUrl}" style="width:100%; height:800px; border:none; display:block; background: transparent;"></iframe></div>`;
                    }
