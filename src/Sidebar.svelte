{#if show}
<aside id="left" class:mini class="flex-col bg-grey shadow">
  {#each links as link}
    <a on:click|preventDefault={() => active = link} class:active={link == active} class="flex-row round" href={link.to} alt={link.name}>
      <span class="fas fa-{link.icon}"></span>
      {#if !mini}
        {link.name}
      {/if}
    </a>
  {/each}
</aside>
{/if}
<svelte:window on:load={handleLoad} on:popstate|preventDefault={handlePopstate}/>
<script>
  export let mini = true;
  export let show = true;
  export let links;
  export let active;
  $: {
    console.log(active)
    self.history.pushState({}, active.name, active.to)
  }
  function handleLoad(e){
    active = links.find(l => l.to == e.path[0].location.pathname)
  }
  function handlePopstate(e){
    active = links.find(l => l.to == e.state)
  }
</script>

<style>
  aside {
    border: 1px solid var(--color-grey); 
    padding: 4px;
  }
  a {
    font-weight: bold;
    color: var(--color-dark);
    padding: .75rem .75rem;
    justify-content: flex-start;
  }
  a:hover {
    background: var(--color-light);
  }
  .active {
    color: var(--color-primary);
  }
  .mini {
    max-width: 100px;
  }
  span {
    color: var(--dark); 
    padding: .75rem;
  }
</style>