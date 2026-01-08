const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhHOlbANC2OQsXqBTGywuHN3Q0HuhNPHD1E5H4kkvu7MpKBpUu0YwwgoexQ5pc65myoYXyXUfcrOvJ/pub?output=csv";

function loadPosts(category) {
  const listEl = document.getElementById("thread-list");
  const popup = document.getElementById("popup");
  const popupContent = document.getElementById("popupContent");
  const popupClose = document.getElementById("popupClose");

  fetch(SHEET_URL)
    .then(res => res.text())
    .then(text => {
      const rows = text.trim().split("\n").slice(1);

      const posts = rows.map(row => {
        const cols = row.split(",");
        return {
          title: cols[0],
          date: cols[1],
          content: cols.slice(2, cols.length - 1).join(","),
          category: cols[cols.length - 1]
        };
      });

      const filtered = posts.filter(p => p.category === category);

      listEl.innerHTML = "";

      filtered.forEach(p => {
        const div = document.createElement("div");
        div.className = "thread";
        div.innerHTML = `
          <div class="thread-title">${p.title}</div>
          <div class="thread-preview">${p.content}</div>
        `;

        div.onclick = () => {
          popupContent.innerHTML = `
            <h2>${p.title}</h2>
            <p class="popup-date">${p.date}</p>
            <div class="popup-body">${p.content.replace(/\n/g, "<br>")}</div>
          `;
          popup.classList.remove("hidden");
        };

        listEl.appendChild(div);
      });
    });

  popupClose.onclick = () => {
    popup.classList.add("hidden");
  };
}
