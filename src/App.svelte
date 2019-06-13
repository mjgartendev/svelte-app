<script>
import {onMount} from 'svelte';
	import Navbar from './Navbar.svelte';
	import Sidebar from './Sidebar.svelte';
	import Footer from './Footer.svelte';
	import routes from './Pages/routes';

	export let sidebarMini;
	export let sidebarShow;

	let pages = routes;
	let path = "home";
	$: activePage = pages.find(p => p.to == path) || pages[0];
	function handleLinkClick(e) {
		e.preventDefault();
		let to = new URL(e.path[1].href || e.target.href || location.pathname);
		path = to.pathname;
		history.pushState(to.toJSON(), to.pathname, to.pathname);
	}
</script>

<Navbar 
	items={[
		{name: "home", to: "."},
		{name: "docs", to: "docs"},
		{name: "blog", to: "blog"}
]}>
	<div>
		<span class="fas fa-bars" on:click={()=> sidebarShow = !sidebarShow}></span>
		{#if sidebarMini}
			<span on:click={() => sidebarMini = false} class="fas fa-angle-right"></span>
		{:else}
			<span on:click={() => sidebarMini = true} class="fas fa-angle-left"></span>
		{/if}
	</div>
	<span>Svelte Template</span>
</Navbar>	

<Sidebar on:click={handleLinkClick} 
	mini={sidebarMini}	
	show={sidebarShow} 
	active={path}
	links={pages}/>

<main id="main" class="flex-center round">
	<svelte:component this={activePage.component}></svelte:component>
</main>

<Footer></Footer>

<svelte:head>
	<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.8.2/css/all.min.css" rel="stylesheet">
</svelte:head>