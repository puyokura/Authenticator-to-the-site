export async function loadI18nMessages() {
  // For web context
  if (typeof chrome === "undefined" || typeof chrome.i18n === "undefined") {
    const locale = navigator.language.replace("-", "_");
    let messageUrl = `/_locales/${locale}/messages.json`;

    try {
      const response = await fetch(messageUrl);
      if (!response.ok) {
        // Fallback to English if the locale is not found
        messageUrl = "/_locales/en/messages.json";
      }
    } catch (error) {
      // Fallback to English on network error
      messageUrl = "/_locales/en/messages.json";
    }

    const response = await fetch(messageUrl);
    const messages = await response.json();
    const i18nData: { [key: string]: string } = {};
    for (const key of Object.keys(messages)) {
      i18nData[key] = messages[key].message;
    }
    return i18nData;
  }

  // For extension context
  return new Promise(
    (
      resolve: (value: { [key: string]: string }) => void,
      reject: (reason: Error) => void
    ) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.overrideMimeType("application/json");
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            const i18nMessage: I18nMessage = JSON.parse(xhr.responseText);
            const i18nData: { [key: string]: string } = {};
            for (const key of Object.keys(i18nMessage)) {
              i18nData[key] = chrome.i18n.getMessage(key);
            }
            return resolve(i18nData);
          }
          return;
        };
        xhr.open("GET", chrome.runtime.getURL("/_locales/en/messages.json"));
        xhr.send();
      } catch (error) {
        if (typeof error === "string" || error === undefined) {
          return reject(Error(error));
        } else if (error instanceof Error) {
          return reject(error);
        } else {
          return reject(Error(String(error)));
        }
      }
    }
  );
}