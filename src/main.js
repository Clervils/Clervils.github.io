import { blogPosts, creations } from "./content.generated.js";

const lists = {
  blog: {
    items: blogPosts,
    selector: '[data-content-list="blog"]',
    empty: "No writing has been published yet.",
    card: renderPostCard,
  },
  creations: {
    items: creations,
    selector: '[data-content-list="creations"]',
    empty: "No creations have been published yet.",
    card: renderCreationCard,
  },
};

for (const list of Object.values(lists)) {
  const target = document.querySelector(list.selector);
  if (!target) continue;

  if (!list.items.length) {
    target.innerHTML = `<p class="empty-state">${list.empty}</p>`;
    continue;
  }

  target.innerHTML = list.items.map(list.card).join("");
}

function renderPostCard(post) {
  return `
    <article class="post-card">
      <div>
        <span>${post.category}</span>
        <h3>${post.title}</h3>
        <p>${post.summary}</p>
        <a class="card-link" href="${post.url}">Read essay</a>
      </div>
      <time datetime="${post.date}">${post.date}</time>
    </article>
  `;
}

function renderCreationCard(item) {
  return `
    <article class="creation-card">
      <span>${item.category}</span>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <details class="markdown-detail">
        <summary>Open</summary>
        <div class="markdown-body">${item.html}</div>
      </details>
    </article>
  `;
}
