const books = [
  {
    title: "The Art of War",
    author: "Sun Tzu",
    link: "https://sites.ualberta.ca/~enoch/Readings/The_Art_Of_War.pdf",
  },
  {
    title: "Think and Grow Rich",
    author: "Napoleon Hill",
    link: "https://sims.sairam.edu.in/wp-content/uploads/sites/7/2024/03/THINK-AND-GROW-RICH.pdf",
  },
  {
    title: "Richest Man in Babylon",
    author: "George S. Clason",
    link: "https://icrrd.com/public/media/16-05-2021-070111The-Richest-Man-in-Babylon.pdf",
  },
  {
    title: "As a Man Thinketh",
    author: "James Allen",
    link: "https://wahiduddin.net/thinketh/as_a_man_thinketh.pdf",
  },
  {
    title: "The Power of Your Subconscious Mind",
    author: "Joseph Murphy",
    link: "https://cdn.bookey.app/files/pdf/book/en/the-power-of-your-subconscious-mind.pdf",
  },
  {
    title: "How to Win Friends and Influence People",
    author: "Dale Carnegie",
    link: "https://dn720004.ca.archive.org/0/items/english-collections-1/How%20To%20Win%20Friends%20And%20Influence%20People%20-%20Carnegie%2C%20Dale.pdf",
  },
  {
    title: "The Science of Getting Rich",
    author: "Wallace D. Wattles",
    link: "https://www.thesecret.tv/wp-content/uploads/2015/04/The-Science-of-Getting-Rich.pdf",
  },
  {
    title: "Man’s Search for Meaning",
    author: "Viktor E. Frankl",
    link: "https://antilogicalism.com/wp-content/uploads/2017/07/mans-search-for-meaning.pdf",
  },
  {
    title: "The Prince",
    author: "Niccolò Machiavelli",
    link: "https://apeiron.iulm.it/retrieve/handle/10808/4129/46589/Machiavelli%2C%20The%20Prince.pdf",
  },
  {
    title: "Meditations",
    author: "Marcus Aurelius",
    link: "https://www.maximusveritas.com/wp-content/uploads/2017/09/Marcus-Aurelius-Meditations.pdf",
  },
  {
    title: "Bhagavad Gita",
    author: "Vyasa (translated)",
    link: "https://ignca.gov.in/Asi_data/279.pdf",
  },
  {
    title: "Upanishads (Selected)",
    author: "Ancient Indian Sages",
    link: "https://estudantedavedanta.net/The-Upanishads-Translated-by-Swami-Paramananda.pdf",
  },
  {
    title: "Arthashastra",
    author: "Kautilya (Chanakya)",
    link: "https://apps.dtic.mil/sti/pdfs/AD1019423.pdf",
  },
  {
    title: "Ramayana",
    author: "Valmiki",
    link: "https://ebooks.tirumala.org/downloads/valmiki_ramayanam.pdf",
  },
  {
    title: "Mahabharata",
    author: "Vyasa",
    link: "https://dn720005.ca.archive.org/0/items/mahabharata-by-gita-press-in-hindi-and-sanskrit/Mahabharata%20Volume%201.pdf",
  },
  {
    title: "Gitanjali",
    author: "Rabindranath Tagore",
    link: "https://crpf.gov.in/writereaddata/images/pdf/Gitanjali.pdf",
  },
  {
    title: "Complete Works of Swami Vivekananda",
    author: "Swami Vivekananda",
    link: "https://www.vedanta-pitt.org/wp-content/uploads/2020/05/Complete_Works_of_Swami_Vivekananda_all_volumes.pdf",
  },
  {
    title: "Hind Swaraj",
    author: "Mahatma Gandhi",
    link: "https://www.mkgandhi.org/ebks/hind_swaraj.pdf",
  },
  {
    title: "My Experiments with Truth",
    author: "Mahatma Gandhi",
    link: "https://downloads.freemdict.com/%E8%AF%8D%E5%85%B8pdf/Gandhi-Experiments%20with%20Truth.pdf",
  },
  {
    title: "The Hidden Hindu – Part 1",
    author: "Akshat Gupta",
    link: "https://files.addictbooks.com/wp-content/uploads/2023/05/The-Hidden-Hindu.pdf0",
  },
  {
    title: "The Hidden Hindu – Part 2",
    author: "Akshat Gupta",
    link: "https://pubhtml5.com/vgusw/ypsd/The_Hidden_Hindu_2_(Akshat_Gupta)/2",
  },
  {
    title: "The Hidden Hindu – Part 3",
    author: "Akshat Gupta",
    link: "https://cdn.bookey.app/files/pdf/book/en/the-hidden-hindu-3.pdf",
  },
];

const bookList = document.getElementById("book-list");
const searchInput = document.getElementById("search");

let favorites = [];

chrome.storage.local.get(["favorites"], (res) => {
  favorites = res.favorites || [];
  renderBooks();
});

function renderBooks(filter = "") {
  bookList.innerHTML = "";

  const filteredBooks = books.filter((book) =>
    `${book.title} ${book.author}`.toLowerCase().includes(filter.toLowerCase()),
  );

  if (filteredBooks.length === 0) {
    bookList.innerHTML = `<p style="text-align:center;font-size:13px;">No books found</p>`;
    return;
  }

  filteredBooks.forEach((book) => {
    const div = document.createElement("div");
    div.className = "book";

    const isFav = favorites.includes(book.title);

    div.innerHTML = `
      <h3>${book.title}</h3>
      <p>by ${book.author}</p>
      <div style="display:flex;gap:6px;">
        <button class="read-btn">Read</button>
        <button class="fav-btn">${isFav ? "❤️" : "🤍"}</button>
      </div>
    `;

    div.querySelector(".read-btn").addEventListener("click", () => {
      openBook(book.link);
    });

    div.querySelector(".fav-btn").addEventListener("click", () => {
      toggleFavorite(book.title);
    });

    bookList.appendChild(div);
  });
}

function openBook(url) {
  chrome.tabs.create({
    url:
      chrome.runtime.getURL("reader.html") + "?file=" + encodeURIComponent(url),
  });
}

function toggleFavorite(title) {
  if (favorites.includes(title)) {
    favorites = favorites.filter((t) => t !== title);
  } else {
    favorites.push(title);
  }

  chrome.storage.local.set({ favorites }, () => {
    renderBooks(searchInput.value);
  });
}

searchInput.addEventListener("input", (e) => {
  renderBooks(e.target.value);
});
