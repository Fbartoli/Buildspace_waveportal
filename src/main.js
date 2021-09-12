import Vue from "vue";
import App from "./App.vue";
import vuetify from "./vuetify"; // path to vuetify export

Vue.config.productionTip = false;

new Vue({
  vuetify,
  el: "#app",
  components: { App },
  template: "<App/>"
});
