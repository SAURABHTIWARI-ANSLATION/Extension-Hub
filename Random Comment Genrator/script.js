const weirdSynonyms = [
  "never give up", "the talent", "you really ate this up", "confidence is key",
  "love your hidden talent", "the confidence", "you’re intoxicating",
  "i bought you some flowers", "keep smiling", "imagining being that talented",
  "you made my day", "i bet all the boys want u", "trusted the process",
  "love yourself", "everyone should voice their opinion", "you go girl",
  "people always say follow your dreams", "ooo i see you", "i love seeing people smile",
  "you served", "i remember when i first met you", "practice makes perfect",
  "you did that", "you served", "i love your confidence",
  "everyone needs a creative outlet", "wow sis i'm taking notes",
  "i know talent when i see it", "freedom of speech is a right for everyone",
  "theres always room for improvement", "not everyone is perfect",
  "i'll never forget the first time i met you", "you popped off",
  "these comments are so mean", "sounds great", "you dropped this🔴",
  "awe you dropped this👑", "it's ok to post whatever you want",
  "this opened my eyes", "not everyone is perfect", "you killed that",
  "practice makes perfect", "the sky's the limit", "you're the only one i see",
  "you put the flaw", "as hannah montana said, nobody’s perfect",
  "words can not describe your talent", "life is beautiful",
  "you dropped your worth", "words can not describe your talent",
  "we need more inspirational people like you for the future generation",
  "you’re always on my mind", "they say chase your dreams",
  "look on the bright side", "life is beautiful!!", "Inhale and exhale",
  // New additions
  "main character energy", "pure magic", "obsessed with you", "iconic behavior",
  "you are the moment", "slay queen", "giving everything it needed to give",
  "history books will remember this", "my jaw dropped", "how does it feel to be god's favorite",
  "this is art", "talent winning today", "queen of everything", "absolutely stunning",
  "i'm speechless", "teaching us how it's done", "definition of perfection"
];

const flexSynonyms = [
  "✨🦋🧚", "🧚🏻✨💖", "🧚🏻✨😝", "🌟💞🌱", "✨🌸👑", "🧚🏼‍♀️✨",
  "🥰🧚‍♀️🤩", "😌🌈👑", "⭐️🌈🦋", "🧚‍♀️❤️✨💅", "💓💫💐",
  "⭐️💐🧚‍♀️", "💖🌟🌹", "✨💕😍", "✨💓🧚😝", "⭐️💐🧚‍♀️",
  " ✨🧚🏻🌈", "🧚‍♀️💓✨", "😌🌷🌿", "😍✨💓", "😌💕☕️",
  "💅🤩🧚‍♀️✨", "💖🌈🌸🦋", "✨💞🧚🏼‍♀️", "🤩💫💕", "💋💗💫",
  // New additions
  "🌸✨🎀", "🧚‍♀️🍄✨", "💿✨🪐", "👼🏹☁️", "🧜‍♀️🫧🐚",
  "🦋🔮🌙", "🌈🧸🍭", "🦄🌸🍬", "🩰🎀🦢", "💫⭐️🌙"
];

const butSynonyms = [
  "except maybe this time you should", "is invisible", "now spit it out",
  "now throw the key away", "maybe keep it hidden", "somebody take it away right now",
  "good thing i'm not an alcoholic", "they’re dead just like your love life",
  "yellow is my favorite color", "yea keep imagining", "worse",
  "away from them", "now i have trust issues", "cuz we don’t",
  "imma just put you on mute doe", "don't come back",
  "your dreams should have a restraining order against you", "wish i didn’t tho",
  "just not yours", "but i didn’t order take it back",
  "wish I could erase my memory", "so practice something else",
  "never do it again", "however i will not be eating",
  "but i have no idea where its coming from", "stick a fork in yours",
  "so i know what to NOT do in the future", "and im still looking",
  "but not you", "your room is empty", "and you just proved that",
  "i'll keep trying tho", "now find the cork and put it back on",
  "you should listen to them", "but i wish i couldn’t hear",
  "put it back on your nose🤡", "don't even dare pick it up",
  "but that doesn’t mean you should", "how do i close them",
  "and you just proved that", "like literally ruined it",
  "you clearly did not practice", "stay on the ground tho",
  "the rest are tens", "in flawless", "and you proved that",
  "but numbers can, 2/10", "get one", "keep walking",
  "but numbers can, 2/10", "but keep it in the past",
  "get out of it", "this one might be a nightmare",
  "i hope it blinds you", "get one", "and stop after that",
  // New additions
  "but keep it in the drafts", "but who asked", "please seek help",
  "but i accept your apology", "maybe next lifetime", "but turn the camera off",
  "sadly", "unfortunately", "but why though", "my lawyer will be in touch",
  "but i have a headache now", "im calling the police", "return to sender",
  "but not in a good way", "keep it a secret", "don't quit your day job"
];

const okaySynonyms = [
  "✨🦋🧚", "🧚🏻✨💖", "🧚🏻✨😝", "🌟💞🌱", "✨🌸👑", "🧚🏼‍♀️✨",
  "🥰🧚‍♀️🤩", "😌🌈👑", "⭐️🌈🦋", "🧚‍♀️❤️✨💅", "💓💫💐",
  "⭐️💐🧚‍♀️", "💖🌟🌹", "✨💕😍", "✨💓🧚😝", "⭐️💐🧚‍♀️",
  " ✨🧚🏻🌈", "🧚‍♀️💓✨", "😌🌷🌿", "😍✨💓", "😌💕☕️",
  "💅🤩🧚‍♀️✨", "💖🌈🌸🦋", "✨💞🧚🏼‍♀️", "😇💞💋", "✨🦋🧚‍♀️",
  // New additions
  "🌸✨🎀", "🧚‍♀️🍄✨", "💿✨🪐", "👼🏹☁️", "🧜‍♀️🫧🐚",
  "🦋🔮🌙", "🌈🧸🍭", "🦄🌸🍬", "🩰🎀🦢", "💫⭐️🌙"
];

const regenerateBtn = document.getElementById("regenerate-button");
const copyBtn = document.getElementById("copy-button");
const commentContainer = document.getElementById("comment-container");

const weird = document.getElementById("weird");
const flex = document.getElementById("flex");
const but = document.getElementById("but");
const okay = document.getElementById("okay");

function getRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateVariation() {
  weird.innerText = getRandom(weirdSynonyms);
  flex.innerText = getRandom(flexSynonyms);
  but.innerText = getRandom(butSynonyms);
  okay.innerText = getRandom(okaySynonyms);

  // Trigger animation
  commentContainer.classList.remove("animate");
  void commentContainer.offsetWidth; // trigger reflow
  commentContainer.classList.add("animate");
}

function copyToClipboard() {
  const text = commentContainer.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = "Copied!";
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 1500);
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
}

regenerateBtn.addEventListener("click", generateVariation);
copyBtn.addEventListener("click", copyToClipboard);

// Initial generation on load
document.addEventListener('DOMContentLoaded', () => {
  // Optional: generate a fresh one or just leave the default HTML placeholders if preferred.
  // Providing a fresh one usually feels better.
  generateVariation();
});
