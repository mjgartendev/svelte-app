import App from './App.svelte';

const app = new App({
	target: document.getElementById('root'),
	props: {
		sidebarShow: true,
		sidebarMini: true,
	}
});

window.app = app;
export default app;