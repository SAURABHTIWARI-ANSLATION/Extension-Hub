/* -------------------------------------------------
   QuickFill Pro – Background (Service Worker)
   PART 1: Sample Default Profile (Dynamic Fields)
-------------------------------------------------- */

// On install / update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await createSampleProfile();
    chrome.runtime.openOptionsPage();
  }

  await recreateContextMenus();
});

/* -------------------------------------------------
   CONTEXT MENUS
-------------------------------------------------- */

async function recreateContextMenus() {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: "quickfill-root",
    title: "QuickFill Pro",
    contexts: ["editable"]
  });

  chrome.contextMenus.create({
    id: "fill-default",
    parentId: "quickfill-root",
    title: "Fill with default profile",
    contexts: ["editable"]
  });

  chrome.contextMenus.create({
    id: "manage-profiles",
    parentId: "quickfill-root",
    title: "Manage profiles…",
    contexts: ["editable"]
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === "fill-default") {
    await injectAutofill(tab.id);
  }

  if (info.menuItemId === "manage-profiles") {
    chrome.runtime.openOptionsPage();
  }
});

/* -------------------------------------------------
   KEYBOARD SHORTCUT
-------------------------------------------------- */

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "fill-form") return;

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (tab?.id) {
    await injectAutofill(tab.id);
  }
});

/* -------------------------------------------------
   AUTOFILL INJECTION
-------------------------------------------------- */

async function injectAutofill(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  } catch (err) {
    console.error("QuickFill Pro inject error:", err);
  }
}

/* -------------------------------------------------
   SAMPLE DEFAULT PROFILE (IMPORTANT)
-------------------------------------------------- */

async function createSampleProfile() {
  const sampleProfile = {
    name: "Sample Profile",
    isDefault: true,
    fields: [
      {
        label: "First Name",
        value: "John",
        keywords: "first, firstname, your-name"
      },
      {
        label: "Last Name",
        value: "Doe",
        keywords: "last, lastname, your-last"
      },
      {
        label: "Email",
        value: "john@example.com",
        keywords: "email, e-mail, mail"
      },
      {
        label: "Country",
        value: "Australia",
        keywords: "country"
      }
    ]
  };

  await chrome.storage.local.set({
    profiles: [sampleProfile],
    selectedProfileIndex: 0,
    fillCount: 0
  });
}
