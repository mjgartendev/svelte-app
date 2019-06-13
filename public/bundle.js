
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_binding_callback(fn) {
        binding_callbacks.push(fn);
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    let outros;
    function group_outros() {
        outros = {
            remaining: 0,
            callbacks: []
        };
    }
    function check_outros() {
        if (!outros.remaining) {
            run_all(outros.callbacks);
        }
    }
    function on_outro(callback) {
        outros.callbacks.push(callback);
    }

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\Navbar.svelte generated by Svelte v3.5.1 */

    const file = "src\\Navbar.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	return child_ctx;
    }

    // (4:2) {#each items as item}
    function create_each_block(ctx) {
    	var a, t_value = ctx.item.name, t, a_href_value;

    	return {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			a.className = "fg-light svelte-1oxhpr3";
    			a.href = a_href_value = ctx.item.to;
    			add_location(a, file, 4, 4, 119);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.items) && t_value !== (t_value = ctx.item.name)) {
    				set_data(t, t_value);
    			}

    			if ((changed.items) && a_href_value !== (a_href_value = ctx.item.to)) {
    				a.href = a_href_value;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var header, t, nav, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	var each_value = ctx.items;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			header = element("header");

    			if (default_slot) default_slot.c();
    			t = space();
    			nav = element("nav");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			nav.className = "flex-row";
    			add_location(nav, file, 2, 2, 68);
    			header.id = "top";
    			header.className = "bg-primary fg-light flex-row svelte-1oxhpr3";
    			add_location(header, file, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(header_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, header, anchor);

    			if (default_slot) {
    				default_slot.m(header, null);
    			}

    			append(header, t);
    			append(header, nav);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(nav, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}

    			if (changed.items) {
    				each_value = ctx.items;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(nav, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (default_slot && default_slot.i) default_slot.i(local);
    			current = true;
    		},

    		o: function outro(local) {
    			if (default_slot && default_slot.o) default_slot.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(header);
    			}

    			if (default_slot) default_slot.d(detaching);

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { items } = $$props;

    	const writable_props = ['items'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('items' in $$props) $$invalidate('items', items = $$props.items);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { items, $$slots, $$scope };
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["items"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.items === undefined && !('items' in props)) {
    			console.warn("<Navbar> was created without expected prop 'items'");
    		}
    	}

    	get items() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Sidebar.svelte generated by Svelte v3.5.1 */

    const file$1 = "src\\Sidebar.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.link = list[i];
    	return child_ctx;
    }

    // (1:0) {#if show}
    function create_if_block(ctx) {
    	var aside;

    	var each_value = ctx.links;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			aside = element("aside");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			aside.id = "left";
    			aside.className = "flex-col bg-grey shadow svelte-1bhtahh";
    			toggle_class(aside, "mini", ctx.mini);
    			add_location(aside, file$1, 1, 0, 11);
    		},

    		m: function mount(target, anchor) {
    			insert(target, aside, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(aside, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.links || changed.active || changed.mini) {
    				each_value = ctx.links;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(aside, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.mini) {
    				toggle_class(aside, "mini", ctx.mini);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(aside);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (6:6) {#if !mini}
    function create_if_block_1(ctx) {
    	var t_value = ctx.link.name, t;

    	return {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.links) && t_value !== (t_value = ctx.link.name)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (3:2) {#each links as link}
    function create_each_block$1(ctx) {
    	var a, span, span_class_value, t0, t1, a_href_value, a_alt_value, dispose;

    	var if_block = (!ctx.mini) && create_if_block_1(ctx);

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	return {
    		c: function create() {
    			a = element("a");
    			span = element("span");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			span.className = span_class_value = "fas fa-" + ctx.link.icon + " svelte-1bhtahh";
    			add_location(span, file$1, 4, 6, 240);
    			a.className = "flex-row round svelte-1bhtahh";
    			a.href = a_href_value = ctx.link.to;
    			attr(a, "alt", a_alt_value = ctx.link.name);
    			toggle_class(a, "active", ctx.link == ctx.active);
    			add_location(a, file$1, 3, 4, 100);
    			dispose = listen(a, "click", prevent_default(click_handler));
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, span);
    			append(a, t0);
    			if (if_block) if_block.m(a, null);
    			append(a, t1);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.links) && span_class_value !== (span_class_value = "fas fa-" + ctx.link.icon + " svelte-1bhtahh")) {
    				span.className = span_class_value;
    			}

    			if (!ctx.mini) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(a, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((changed.links) && a_href_value !== (a_href_value = ctx.link.to)) {
    				a.href = a_href_value;
    			}

    			if ((changed.links) && a_alt_value !== (a_alt_value = ctx.link.name)) {
    				attr(a, "alt", a_alt_value);
    			}

    			if ((changed.links || changed.active)) {
    				toggle_class(a, "active", ctx.link == ctx.active);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}

    			if (if_block) if_block.d();
    			dispose();
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var if_block_anchor, dispose;

    	var if_block = (ctx.show) && create_if_block(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			dispose = listen(window, "popstate", ctx.handlePopstate);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.show) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}

    			dispose();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { mini = true, show = true, links, active } = $$props;
      function handlePopstate(e){
        $$invalidate('active', active = links.find(l => l.to == e.path[0].location.pathname));
      }

    	const writable_props = ['mini', 'show', 'links', 'active'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	function click_handler({ link }) {
    		const $$result = active = link;
    		$$invalidate('active', active);
    		return $$result;
    	}

    	$$self.$set = $$props => {
    		if ('mini' in $$props) $$invalidate('mini', mini = $$props.mini);
    		if ('show' in $$props) $$invalidate('show', show = $$props.show);
    		if ('links' in $$props) $$invalidate('links', links = $$props.links);
    		if ('active' in $$props) $$invalidate('active', active = $$props.active);
    	};

    	$$self.$$.update = ($$dirty = { active: 1 }) => {
    		if ($$dirty.active) { {
            self.history.pushState({}, active.name, active.to);
          } }
    	};

    	return {
    		mini,
    		show,
    		links,
    		active,
    		handlePopstate,
    		click_handler
    	};
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["mini", "show", "links", "active"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.links === undefined && !('links' in props)) {
    			console.warn("<Sidebar> was created without expected prop 'links'");
    		}
    		if (ctx.active === undefined && !('active' in props)) {
    			console.warn("<Sidebar> was created without expected prop 'active'");
    		}
    	}

    	get mini() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mini(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get links() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set links(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Footer.svelte generated by Svelte v3.5.1 */

    const file$2 = "src\\Footer.svelte";

    function create_fragment$2(ctx) {
    	var footer, t, a, span, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			footer = element("footer");

    			if (!default_slot) {
    				t = text("© 2019  mjgartendev \n    ");
    				a = element("a");
    				span = element("span");
    			}

    			if (default_slot) default_slot.c();
    			if (!default_slot) {
    				span.className = "fg-dark fab fa-github";
    				add_location(span, file$2, 4, 6, 193);
    				a.href = "https://www.github.com/mjgartendev/svelte-app";
    				a.target = "_blank";
    				a.rel = "noreferrer";
    				add_location(a, file$2, 3, 4, 97);
    			}

    			footer.id = "btm";
    			footer.className = "bg-grey fg-dark flex-center";
    			add_location(footer, file$2, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(footer_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, footer, anchor);

    			if (!default_slot) {
    				append(footer, t);
    				append(footer, a);
    				append(a, span);
    			}

    			else {
    				default_slot.m(footer, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (default_slot && default_slot.i) default_slot.i(local);
    			current = true;
    		},

    		o: function outro(local) {
    			if (default_slot && default_slot.o) default_slot.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(footer);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { $$slots, $$scope };
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    	}
    }

    /* src\Pages\Dashboard.svelte generated by Svelte v3.5.1 */

    const file$3 = "src\\Pages\\Dashboard.svelte";

    function create_fragment$3(ctx) {
    	var h2;

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Welcome to your Dashboard!";
    			add_location(h2, file$3, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    			}
    		}
    	};
    }

    class Dashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, []);
    	}
    }

    /* src\Pages\Markdown.svelte generated by Svelte v3.5.1 */

    const file$4 = "src\\Pages\\Markdown.svelte";

    function create_fragment$4(ctx) {
    	var h2;

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Markdown";
    			add_location(h2, file$4, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    			}
    		}
    	};
    }

    class Markdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$4, safe_not_equal, []);
    	}
    }

    /* src\Pages\Kanban.svelte generated by Svelte v3.5.1 */

    const file$5 = "src\\Pages\\Kanban.svelte";

    function create_fragment$5(ctx) {
    	var h2;

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Kanban";
    			add_location(h2, file$5, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    			}
    		}
    	};
    }

    class Kanban extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$5, safe_not_equal, []);
    	}
    }

    /* src\Pages\Files.svelte generated by Svelte v3.5.1 */

    const file$6 = "src\\Pages\\Files.svelte";

    function create_fragment$6(ctx) {
    	var h2;

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Files";
    			add_location(h2, file$6, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    			}
    		}
    	};
    }

    class Files extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$6, safe_not_equal, []);
    	}
    }

    /* src\Pages\Code.svelte generated by Svelte v3.5.1 */

    const file$7 = "src\\Pages\\Code.svelte";

    function create_fragment$7(ctx) {
    	var h2;

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Code";
    			add_location(h2, file$7, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    			}
    		}
    	};
    }

    class Code extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$7, safe_not_equal, []);
    	}
    }

    var routes = [
    	{ to: '/dashboard', name: "Dash",     icon: "tachometer-alt",  component: Dashboard },
    	{ to: '/kanban',    name: "Kanban",   icon: "columns",  			 component: Kanban },
    	{ to: '/markdown',  name: "Markdown", icon: "marker", 			   component: Markdown },
    	{ to: '/files',     name: "Files", 		icon: "folder", 			   component: Files },
    	{ to: '/code',      name: "Editor", 	icon: "code",  				   component: Code },
    ];

    /* src\App.svelte generated by Svelte v3.5.1 */

    const file$8 = "src\\App.svelte";

    // (24:2) {:else}
    function create_else_block(ctx) {
    	var span, dispose;

    	return {
    		c: function create() {
    			span = element("span");
    			span.className = "fas fa-angle-left";
    			add_location(span, file$8, 24, 3, 614);
    			dispose = listen(span, "click", ctx.click_handler_2);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}

    			dispose();
    		}
    	};
    }

    // (22:2) {#if sidebarMini}
    function create_if_block_1$1(ctx) {
    	var span, dispose;

    	return {
    		c: function create() {
    			span = element("span");
    			span.className = "fas fa-angle-right";
    			add_location(span, file$8, 22, 3, 523);
    			dispose = listen(span, "click", ctx.click_handler_1);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}

    			dispose();
    		}
    	};
    }

    // (14:0) <Navbar   items={[   {name: "home", to: "."},   {name: "docs", to: "docs"},   {name: "blog", to: "blog"} ]}>
    function create_default_slot(ctx) {
    	var div, span0, t0, t1, span1, dispose;

    	function select_block_type(ctx) {
    		if (ctx.sidebarMini) return create_if_block_1$1;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = space();
    			if_block.c();
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Svelte Template";
    			span0.className = "fas fa-bars";
    			add_location(span0, file$8, 20, 2, 423);
    			add_location(div, file$8, 19, 1, 415);
    			add_location(span1, file$8, 27, 1, 707);
    			dispose = listen(span0, "click", ctx.click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, span0);
    			append(div, t0);
    			if_block.m(div, null);
    			insert(target, t1, anchor);
    			insert(target, span1, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_block.d();

    			if (detaching) {
    				detach(t1);
    				detach(span1);
    			}

    			dispose();
    		}
    	};
    }

    // (38:1) {#if active.component}
    function create_if_block$1(ctx) {
    	var switch_instance_anchor, current;

    	var switch_value = ctx.active.component;

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	return {
    		c: function create() {
    			if (switch_instance) switch_instance.$$.fragment.c();
    			switch_instance_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (switch_value !== (switch_value = ctx.active.component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;
    					on_outro(() => {
    						old_component.$destroy();
    					});
    					old_component.$$.fragment.o(1);
    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());

    					switch_instance.$$.fragment.c();
    					switch_instance.$$.fragment.i(1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) switch_instance.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			if (switch_instance) switch_instance.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(switch_instance_anchor);
    			}

    			if (switch_instance) switch_instance.$destroy(detaching);
    		}
    	};
    }

    function create_fragment$8(ctx) {
    	var t0, updating_active, t1, main, t2, t3, link, current;

    	var navbar = new Navbar({
    		props: {
    		items: [
    		{name: "home", to: "."},
    		{name: "docs", to: "docs"},
    		{name: "blog", to: "blog"}
    ],
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	function sidebar_active_binding(value) {
    		ctx.sidebar_active_binding.call(null, value);
    		updating_active = true;
    		add_flush_callback(() => updating_active = false);
    	}

    	let sidebar_props = {
    		mini: ctx.sidebarMini,
    		show: ctx.sidebarShow,
    		links: ctx.pages
    	};
    	if (ctx.active !== void 0) {
    		sidebar_props.active = ctx.active;
    	}
    	var sidebar = new Sidebar({ props: sidebar_props, $$inline: true });

    	add_binding_callback(() => bind(sidebar, 'active', sidebar_active_binding));

    	var if_block = (ctx.active.component) && create_if_block$1(ctx);

    	var footer = new Footer({ $$inline: true });

    	return {
    		c: function create() {
    			navbar.$$.fragment.c();
    			t0 = space();
    			sidebar.$$.fragment.c();
    			t1 = space();
    			main = element("main");
    			if (if_block) if_block.c();
    			t2 = space();
    			footer.$$.fragment.c();
    			t3 = space();
    			link = element("link");
    			main.id = "main";
    			main.className = "flex-center round";
    			add_location(main, file$8, 36, 0, 830);
    			link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.8.2/css/all.min.css";
    			link.rel = "stylesheet";
    			add_location(link, file$8, 45, 1, 1011);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(sidebar, target, anchor);
    			insert(target, t1, anchor);
    			insert(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			insert(target, t2, anchor);
    			mount_component(footer, target, anchor);
    			insert(target, t3, anchor);
    			append(document.head, link);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var navbar_changes = {};
    			if (changed.$$scope || changed.sidebarMini) navbar_changes.$$scope = { changed, ctx };
    			navbar.$set(navbar_changes);

    			var sidebar_changes = {};
    			if (changed.sidebarMini) sidebar_changes.mini = ctx.sidebarMini;
    			if (changed.sidebarShow) sidebar_changes.show = ctx.sidebarShow;
    			if (changed.pages) sidebar_changes.links = ctx.pages;
    			if (!updating_active && changed.active) {
    				sidebar_changes.active = ctx.active;
    			}
    			sidebar.$set(sidebar_changes);

    			if (ctx.active.component) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					if_block.i(1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.i(1);
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				group_outros();
    				on_outro(() => {
    					if_block.d(1);
    					if_block = null;
    				});

    				if_block.o(1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			navbar.$$.fragment.i(local);

    			sidebar.$$.fragment.i(local);

    			if (if_block) if_block.i();

    			footer.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			navbar.$$.fragment.o(local);
    			sidebar.$$.fragment.o(local);
    			if (if_block) if_block.o();
    			footer.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			navbar.$destroy(detaching);

    			if (detaching) {
    				detach(t0);
    			}

    			sidebar.$destroy(detaching);

    			if (detaching) {
    				detach(t1);
    				detach(main);
    			}

    			if (if_block) if_block.d();

    			if (detaching) {
    				detach(t2);
    			}

    			footer.$destroy(detaching);

    			if (detaching) {
    				detach(t3);
    			}

    			detach(link);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	

    	let { sidebarMini, sidebarShow } = $$props;
    	let pages = routes;
    	let active = pages[0];

    	const writable_props = ['sidebarMini', 'sidebarShow'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function click_handler() {
    		const $$result = sidebarShow = !sidebarShow;
    		$$invalidate('sidebarShow', sidebarShow);
    		return $$result;
    	}

    	function click_handler_1() {
    		const $$result = sidebarMini = false;
    		$$invalidate('sidebarMini', sidebarMini);
    		return $$result;
    	}

    	function click_handler_2() {
    		const $$result = sidebarMini = true;
    		$$invalidate('sidebarMini', sidebarMini);
    		return $$result;
    	}

    	function sidebar_active_binding(value) {
    		active = value;
    		$$invalidate('active', active);
    	}

    	$$self.$set = $$props => {
    		if ('sidebarMini' in $$props) $$invalidate('sidebarMini', sidebarMini = $$props.sidebarMini);
    		if ('sidebarShow' in $$props) $$invalidate('sidebarShow', sidebarShow = $$props.sidebarShow);
    	};

    	return {
    		sidebarMini,
    		sidebarShow,
    		pages,
    		active,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		sidebar_active_binding
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$8, safe_not_equal, ["sidebarMini", "sidebarShow"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.sidebarMini === undefined && !('sidebarMini' in props)) {
    			console.warn("<App> was created without expected prop 'sidebarMini'");
    		}
    		if (ctx.sidebarShow === undefined && !('sidebarShow' in props)) {
    			console.warn("<App> was created without expected prop 'sidebarShow'");
    		}
    	}

    	get sidebarMini() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sidebarMini(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sidebarShow() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sidebarShow(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.getElementById('root'),
    	props: {
    		sidebarShow: true,
    		sidebarMini: true,
    	}
    });

    window.app = app;

    return app;

}());
//# sourceMappingURL=bundle.js.map
