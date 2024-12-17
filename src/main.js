import {createApp} from 'vue'

import "bootstrap"
import 'bootstrap/dist/css/bootstrap.min.css'
import "bootstrap-icons/font/bootstrap-icons.css";


import App from './App.vue'

window.__VUE_PROD_DEVTOOLS__ = false;
window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;

// 只有在Office.onReady的时候才会Mount
Office.onReady((info) => {
    const app = createApp(App);
    app.provide('office', info.host);
    app.mount('#app');
});