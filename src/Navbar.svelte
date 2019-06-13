<header id="top" class="bg-primary fg-light flex-row">
  <slot />
  <nav class="flex-row">
  {#each items as item}
    <a class="fg-light" href={item.to}>{item.name}</a>
  {/each}
  </nav>
</header>

<script>
  export let items;
</script>

<style>
  header {
    padding: 0 1rem; 
    font-weight: bold
  }
  a {
    padding: 1rem;
  }
  a:hover {
    background: var(--color-light);
    color: var(--color-primary);
  }
  :global(span) {
    padding: .5rem;
    font-size: 1.25rem;
    cursor: pointer;
  }
</style>