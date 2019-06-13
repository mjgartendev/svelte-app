import Dashboard from './Dashboard.svelte';
import Markdown from './Markdown.svelte';
import Kanban from './Kanban.svelte';
import Files from './Files.svelte';
import Code from './Code.svelte';

export default [
	{ to: '/dashboard', name: "Dash",     icon: "tachometer-alt",  component: Dashboard },
	{ to: '/kanban',    name: "Kanban",   icon: "columns",  			 component: Kanban },
	{ to: '/markdown',  name: "Markdown", icon: "marker", 			   component: Markdown },
	{ to: '/files',     name: "Files", 		icon: "folder", 			   component: Files },
	{ to: '/code',      name: "Editor", 	icon: "code",  				   component: Code },
];