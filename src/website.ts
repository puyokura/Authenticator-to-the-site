// Vue
import Vue from "vue";
import Vuex from "vuex";
import { Vue2Dragula } from "vue2-dragula";

// Components
import Website from "./components/Website.vue";
import CommonComponents from "./components/common/index";

// Other
import { loadI18nMessages } from "./store/i18n";
import { Style } from "./store/Style";
import { Accounts } from "./store/Accounts";
import { Backup } from "./store/Backup";
import { CurrentView } from "./store/CurrentView";
import { Menu } from "./store/Menu";
import { Notification } from "./store/Notification";
import { Qr } from "./store/Qr";
import { Advisor } from "./store/Advisor";
import { UserSettings } from "./models/settings";

async function init() {
  await UserSettings.updateItems();

  // Add globals
  Vue.prototype.i18n = await loadI18nMessages();

  // Load modules
  Vue.use(Vuex);
  Vue.use(Vue2Dragula);

  // Load common components globally
  for (const component of CommonComponents) {
    Vue.component(component.name, component.component);
  }

  // State
  const store = new Vuex.Store({
    modules: {
      accounts: await new Accounts().getModule(),
      advisor: await new Advisor().getModule(),
      backup: await new Backup().getModule(),
      currentView: new CurrentView().getModule(),
      menu: await new Menu().getModule(),
      notification: new Notification().getModule(),
      qr: new Qr().getModule(),
      style: new Style().getModule(),
    },
  });

  // Render
  const instance = new Vue({
    render: (h) => h(Website),
    store,
    mounted() {
      // Update time based entries' codes
      this.$store.commit("accounts/updateCodes");
      setInterval(() => {
        this.$store.commit("accounts/updateCodes");
      }, 1000);
    },
  }).$mount("#app");

  // Prompt for password if needed
  if (instance.$store.state.accounts.shouldShowPassphrase) {
    // If we have cached password, use that
    if (instance.$store.state.accounts.defaultEncryption) {
      instance.$store.commit("currentView/changeView", "LoadingPage");
      await instance.$store.dispatch("accounts/updateEntries");
    } else {
      instance.$store.commit("style/showInfo", true);
      instance.$store.commit("currentView/changeView", "EnterPasswordPage");
    }
  } else {
    // Set init complete if no encryption is present, otherwise this will be set in updateEntries.
    instance.$store.commit("accounts/initComplete");
  }

  // Set document title
  try {
    document.title = instance.i18n.extName;
  } catch (e) {
    console.error(e);
  }
}

init();
