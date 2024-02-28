class JournalCollectionServer
{
	constructor()
	{
		this.dataBlock = null;
		this.selection = [-1, -1, -1];
		this.selection_level = 0;
		this.is_loaded = false;
	}

	is_collection_selected() { return this.selection[0] > -1; }
	is_group_selected() { return this.is_collection_selected() && this.selection[1] > -1; }
	is_image_selected() { return this.is_group_selected() && this.selection[2] > -1; }

	selected_collection() { return this.dataBlock.collections[this.selection[0]]; }
	selected_group() { return this.selected_collection().groups[this.selection[1]]; }
	selected_image() { return this.selected_group().groups[this.selection[2]]; }

	selected_collection_size() { return this.selected_collection().groups.length; }
	selected_group_size() { return this.selected_group().images.length; }

	get_level_data(level)
	{
		switch (level)
		{
			case 0: return this.dataBlock.collections;
			case 1: return this.selected_collection().groups;
			case 2: return this.selected_group().images;
		}
	}

	id_collection() { return this.selection[0]; }
	id_group() { return this.selection[1]; }
	id_image() { return this.selection[2]; }

	set_id_collection(id) { this.selection[0] = id; }
	set_id_group(id) { this.selection[1] = id; }
	set_id_image(id) { this.selection[2] = id; }

	select_id(id)
	{
		if (this.try_select(0, id)) return;
		if (this.try_select(1, id)) return;
		this.try_select(2, id);
	}

	try_select(id)
	{
		if (this.selection[this.selection_level] > -1) return false;
		this.selection[this.selection_level] = id;
		this.selection_level = Math.min(this.selection_level + 1, 2);
		return true;
	}

	deselect_one_level()
	{
		if (this.try_deselect(2)) return true;
		if (this.try_deselect(1)) return true;
		if (this.try_deselect(0)) return true;
		return false;
	}

	try_deselect(level)
	{
		if (this.selection[level] < 0) return false;
		this.selection_level = Math.max(this.selection_level - 1, 0);
		this.selection[level] = -1;
		return true;
	}

	wrap_selection(level)
	{
		if (this.selection[level] < 0) return;
		var psel = this.selection;
		switch (level)
		{
			case 0: this.selection[0] = wrap_id(this.selection[0], this.get_level_data(0).length); break;
			case 1: this.selection[1] = wrap_id(this.selection[1], this.get_level_data(1).length); break;
			case 2: this.selection[2] = wrap_id(this.selection[2], this.get_level_data(2).length); break;
		}
		if (psel != this.selection) save_gallery_selection();
	}

	finish_loading(x)
	{
		this.dataBlock = JSON.parse(x);
		this.is_loaded = true;
	}

	load()
	{
		fetch("/collections/journal_collection_list.json")
			.then(x => x.text())
			.then(x => this.finish_loading(x));
	}
}

class ViewData
{
	screen_size_x;
	screen_size_y;
	screen_center_x;
	screen_center_y;

	screen_aspect;
	screen_aspect_square;
	screen_aspect_vertical;
	screen_aspect_horizontal;

	bubble_pos_0;
	bubble_pos_1;
	bubble_pos_2;

	static saturate(x) { return Math.min(Math.max(x, 0.0), 1.0); }
	static lerp(x, y, t) { return x + (y - x) * t; }
	static lerpclamped(x, y, t) { return x + (y - x) * this.saturate(t); }

	onwindowresize()
	{
		this.screen_size_x = window.innerWidth;
		this.screen_size_y = window.innerHeight;
		this.screen_center_x = this.screen_size_x / 2.0;
		this.screen_center_y = this.screen_size_y / 2.0;

		this.screen_aspect = this.screen_size_x / this.screen_size_y;
		this.screen_aspect_vertical = saturate((1.0 - this.screen_aspect) * 10.0);
		this.screen_aspect_horizontal = saturate(Math.max(0.0, this.screen_aspect - 1.0) * 10.0);
		this.screen_aspect_square = 1.0 - saturate(Math.abs(this.screen_aspect - 1.0) * 4.0);
		var spacing_aspect = lerp(this.screen_aspect, 1.0 - this.screen_aspect, this.screen_aspect_vertical);
		var bubble_spacing = 0.7 + 0.05 * Math.min(Math.max(spacing_aspect, -1.0, 1.0));
		/*
		e_lbl_debug.innerHTML = `<br>asp:${this.screen_aspect}`;
		e_lbl_debug.innerHTML += `<br>inv:${(1.0 / this.screen_aspect)}`;
		e_lbl_debug.innerHTML += `<br>ver:${this.screen_aspect_vertical}`;
		e_lbl_debug.innerHTML += `<br>hor:${this.screen_aspect_horizontal}`;
		e_lbl_debug.innerHTML += `<br>sqr:${this.screen_aspect_square}`;
		e_lbl_debug.innerHTML += `<br>spc:${bubble_spacing}`;
		*/

		vertical_layout = this.screen_aspect < 1.0;
		document.documentElement.style.setProperty('--view-ratio', this.screen_aspect);
		document.documentElement.style.setProperty('--page-border-width', vertical_layout ? "1rem" : "2rem");
		document.documentElement.style.setProperty('--footer-font-size', vertical_layout ? "0.7rem" : "0.9rem");
		document.documentElement.style.setProperty('--font-size-body', vertical_layout ? "0.9rem" : "1.25rem");
		document.documentElement.style.setProperty('--font-size-pagination', vertical_layout ? "1.2rem" : "1.8rem");
		document.documentElement.style.setProperty('--font-size-collection-title', vertical_layout ? "1.5rem" : "2.5rem");

		bubble_width_base = lerp(60, 60, this.screen_aspect_square);
		if (bubble_spare && bubble_spare.e_root) bubble_spare.set_width(bubble_width_base);
		if (bubble_curr && bubble_curr.e_root) bubble_curr.set_width(bubble_width_base);
		if (bubble_prev && bubble_prev.e_root) bubble_prev.set_width(bubble_width_base);
		if (bubble_next && bubble_next.e_root) bubble_next.set_width(bubble_width_base);

		var bubble_axis_size = vertical_layout ? this.screen_size_y * 0.6 : this.screen_size_x;
		var bubble_axis_size_inv = vertical_layout ? this.screen_size_x : this.screen_size_y * 0.6;
		const default_pos_0 = 25.0;
		const default_pos_1 = 50.0;
		const default_pos_2 = 75.0;

		this.bubble_pos_1 = default_pos_1;//50%, middle of screen, 'this.screen_center_[axis]'

		var bubble_pos_1_px = this.bubble_pos_1 * bubble_axis_size * 0.01;
		var default_pos_0_px = default_pos_0 * bubble_axis_size * 0.01;
		var default_pos_2_px = default_pos_2 * bubble_axis_size * 0.01;

		var bubble_width_actual = bubble_width_base * 0.01;
		var bubble_offset_0_px = Math.abs(default_pos_0_px - bubble_pos_1_px) * bubble_spacing;
		var bubble_offset_2_px = Math.abs(default_pos_2_px - bubble_pos_1_px) * bubble_spacing;
		var ideal_pos_0_px = bubble_pos_1_px - Math.max(bubble_width_actual, bubble_offset_0_px);
		var ideal_pos_2_px = bubble_pos_1_px + Math.max(bubble_width_actual, bubble_offset_2_px);

		this.bubble_pos_0 = (ideal_pos_0_px / bubble_axis_size) * 100.0;
		this.bubble_pos_2 = (ideal_pos_2_px / bubble_axis_size) * 100.0;
		bx_0 = this.bubble_pos_0;
		bx_2 = this.bubble_pos_2;
	}
}

class GalleryBubble
{
	id;
	title = "null bubble";
	desc = "no data";
	imgsrc = str_default_img_src;

	e_root;
	e_img;
	e_title;
	e_body;
	e_banner;
	e_banner_corner;
	e_more_icon;
	e_info_icon;

	info_desc = null;
	is_own_desc = false;

	constructor(id, title, imgsrc, is_main_bubble)
	{
		this.id = id;
		this.title = title;
		this.imgsrc = imgsrc;
		this.is_main_bubble = is_main_bubble;
		this.create();
	}

	create()
	{
		this.e_root = document.createElement("div");
		this.e_root.className = "gallery-bubble-root";
		this.e_root.title = this.title;
		this.e_root.style.position = "absolute";
		this.set_width(bubble_width_base);
		this.set_position("50%");

		this.e_img = null;
		if (this.imgsrc)
		{
			this.e_img = document.createElement("img");
			this.e_img.className = "gallery-bubble-image";
			this.e_img.src = this.imgsrc;
			this.e_root.appendChild(this.e_img);
		}

		this.e_banner = document.createElement("div");
		this.e_banner.className = "gallery-bubble-banner backdrop-obscure";
		this.e_root.appendChild(this.e_banner);

		this.e_banner_title = document.createElement("div");
		this.e_banner_title.className = "gallery-bubble-banner-title";
		this.e_banner_title.innerText = this.title;
		this.e_banner.appendChild(this.e_banner_title);

		this.e_banner_body = document.createElement("div");
		this.e_banner_body.className = "gallery-bubble-banner-body";
		this.e_banner_body.style.opacity = "0%";
		this.e_banner_body.innerText = get_bubble_label(this.id);
		this.e_banner.appendChild(this.e_banner_body);

		this.e_info_icon = document.createElement("img");
		this.e_info_icon.className = "gallery-bubble-banner-info";
		this.e_info_icon.src = "/images/icon-info.png";
		this.e_info_icon.title = "More Info ( I )";
		this.e_banner.appendChild(this.e_info_icon);

		this.e_more_icon = document.createElement("img");
		this.e_more_icon.className = "gallery-bubble-banner-more";
		this.e_more_icon.src = "/images/icon-more.png";
		this.e_more_icon.title = "See More ( Space )";
		this.e_banner.appendChild(this.e_more_icon);

		this.e_banner_corner = document.createElement("div");
		this.e_banner_corner.className = "gallery-bubble-banner-corner";
		this.e_banner_corner.innerText = "UNAVAILABLE";
		this.e_banner_corner.style.display = "none";
		this.e_banner_corner.title = "What does this mean?";
		this.e_root.appendChild(this.e_banner_corner);

		if (this.is_main_bubble)
		{
			this.e_banner.addEventListener("click", HideBubbleBannerMoreInfo);
			this.e_info_icon.addEventListener("click", OnBubbleBannerMoreInfo);
			this.e_banner_corner.addEventListener("click", onOutOfStockHelp);
		}
		else
		{
			this.e_banner.style.pointerEvents = "none";
			this.e_banner_title.style.pointerEvents = "none";
			this.e_banner_body.style.pointerEvents = "none";
			this.e_banner_corner.style.pointerEvents = "none";
			this.e_more_icon.style.pointerEvents = "none";
			this.e_info_icon.style.pointerEvents = "none";
		}
	}

	update_id(new_id)
	{
		this.id = new_id;

		UpdateBubbleImage(this.e_img, new_id);
		this.e_root.title = get_bubble_label(new_id);
		this.e_banner_title.innerText = this.e_root.title;
		this.refresh_info_desc();
		this.e_banner_body.innerHTML = "<div>" + this.info_desc + "</div>";
		refresh_bubble_corner_banner(this, new_id);

		this.e_info_icon.style.display = this.is_own_desc ? "block" : "none";
		this.e_more_icon.style.opacity = is_bubble_container(this.id) ? "100%" : "0%";
	}

	set_transform(scale, tilt = 0.0)
	{
		this.e_root.style.transform = "translate(-50%,-50%) scale(" + scale + "%) rotate3d(0,1,0," + tilt + "deg)";
	}

	set_width(w)
	{
		this.e_root.style.width = "min(" + w + "vw," + w + "vh)";
	}

	set_position(x, y = "50%")
	{
		if (vertical_layout) 
		{
			this.e_root.style.top = x;
			this.e_root.style.left = y;
		}
		else 
		{
			this.e_root.style.top = y;
			this.e_root.style.left = x;
		}
	}

	update_moreinfo_data()
	{
		if (collectionServer.selection[0] < 0)
		{
			this.e_banner_title.innerText = get_bubble_label(this.id);
		}
		else
		{
			this.e_banner_title.innerText = collectionServer.selected_collection().name + " / " + get_bubble_label(this.id);
		}
	}

	refresh_info_desc()
	{
		this.is_own_desc = false;
		this.info_desc = "!! NULL BUBBLE DESC !!";

		if (!collectionServer.is_collection_selected())
		{
			var c = collectionServer.dataBlock.collections[this.id];
			if (c.desc) 
			{
				this.is_own_desc = true;
				this.info_desc = c.desc;
				return;
			}
			return;
		}

		var c = collectionServer.selected_collection();
		if (!collectionServer.is_group_selected())
		{
			var g = c.groups[this.id];
			if (g.desc)
			{
				this.is_own_desc = true;
				this.info_desc = g.desc;
				return;
			}
			return;
		}

		var g = collectionServer.selected_group();
		var i = g.images[this.id];

		if (i.desc)
		{
			this.is_own_desc = true;
			this.info_desc = i.desc;
			return;
		}
		return;
	}

	set_banner_expansion_phase(t)
	{
		if (t > 0.5)
		{
			this.e_more_icon.style.display = "none";
			this.e_info_icon.style.display = "none";
			this.update_moreinfo_data();
		}
		else
		{
			this.e_more_icon.style.display = "block";
			this.e_info_icon.style.display = "block";
			this.e_banner_title.innerText = get_bubble_label(this.id);
		}

		t = ease_in_out(t);
		var w = lerp(60, 100, t);
		var h = lerp(15, 100, t);

		this.e_img.style.filter = "blur(" + lerp(0, 0.125, t) + "em)";

		this.e_banner.style.top = lerp(70, 50, t) + "%";
		this.e_banner_title.style.top = ((1.0 - t) * 35 + 15) + "%";
		this.e_banner_body.style.opacity = (t * 100) + "%";

		if (t > 0.5) 
		{
			this.e_banner.style.pointerEvents = "fill";
			this.e_banner.style.cursor = "help";
		}
		else
		{
			this.e_banner.style.pointerEvents = "none";
		}
		this.e_banner.style.width = w + "%";
		this.e_banner.style.height = h + "%";

		this.e_banner_corner.style.opacity = ((1.0 - t) * 100) + "%";
	}
}

class AnimJob
{
	static global_speed = 1;

	t = 0.0;
	speed = 1.0;
	interruptible = false;
	easing = true;
	deltaTimeLast = 0.01;
	updateFx = (x) => { };
	afterFx = () => { };

	constructor(updateFx, speed)
	{
		this.t = 0.0;
		this.updateFx = updateFx;
		this.afterFx = () => { };
		this.speed = speed;
		this.interruptible = false;
		this.easing = true;
		this.animationRequestId = -1;
	}

	is_running() { if (this.animationRequestId > 0) return true; else false; }

	start()
	{
		if (this.is_running())
		{
			if (!this.interruptible) return;
			this.finish();
		}
		this.t = 0.0;
		this.init_properties();
		this.get_new_anim_frame();
	}

	init_properties()
	{
		if (this.updateFx) this.updateFx(0.0);
	}

	animationRequestId = -1;
	initial_ts = -1;
	prev_ts = 0.0;
	update_properties(ts)
	{
		if (this.initial_ts < 0) 
		{
			this.initial_ts = ts;
			this.prev_ts = this.initial_ts;
		}

		var dt = (ts - this.prev_ts) * 0.001;
		this.deltaTimeLast = dt;
		this.prev_ts = ts;

		this.t += dt * this.speed * AnimJob.global_speed;
		if (this.t >= 1.0)
		{
			this.t = 1.0;
			this.initial_ts = -1;
			this.finish();
			return;
		}

		if (this.updateFx) 
		{
			if (this.easing) this.updateFx(ease_in_out(this.t));
			else this.updateFx(this.t);
		}

		this.get_new_anim_frame();
	}

	get_new_anim_frame()
	{
		this.animationRequestId = requestAnimationFrame(this.update_properties.bind(this));
	}

	finish()
	{
		this.animationRequestId = -1;
		//clearInterval(this.interval);
		//this.interval = null;
		if (this.updateFx) this.updateFx(1.0);
		if (this.afterFx) this.afterFx();
	}
}

const always_true = () => true;
class InputManager
{
	scroll_deadzone = 20;

	touch_start_pos_x;
	touch_start_pos_y;
	touch_end_pos_x;
	touch_end_pos_y;

	gamepad_connected_count = 0;
	is_gamepad_connected = false;

	is_input_enabled = false;
	static is_input_paused = false;
	enable_input_check = always_true;

	constructor()
	{
		this.scroll_deadzone = 20;
		this.touch_start_pos_x = 0;
		this.touch_start_pos_y = 0;
		this.touch_end_pos_x = 0;
		this.touch_end_pos_y = 0;
		this.gamepad_connected_count = 0;
		this.is_gamepad_connected = false;
		this.enable_input_check = always_true;
	}

	RegisterInputHandlers()
	{
		window.addEventListener("resize", view.onwindowresize);
		window.addEventListener("wheel", this.onwheel.bind(this));
		window.addEventListener("touchstart", this.onTouchStart.bind(this));
		window.addEventListener("touchend", this.onTouchEnd.bind(this));
		window.addEventListener("keydown", this.onKeyPress.bind(this));
		window.addEventListener("gamepadconnected", this.on_gamepad_added.bind(this));
		window.addEventListener("gamepaddisconnected", this.on_gamepad_removed.bind(this));

		setInterval(this.step_check_gamepad_input.bind(this), 100);
	}

	Pause()
	{
		InputManager.is_input_paused = true;
		this.is_input_enabled = false;
	}

	Resume()
	{
		InputManager.is_input_paused = false;
		this.is_input_enabled = this.enable_input_check();
	}

	on_gamepad_added(e)
	{
		this.gamepad_connected_count++;
		this.is_gamepad_connected = true;
	}

	on_gamepad_removed(e)
	{
		this.gamepad_connected_count--;
		this.is_gamepad_connected = this.gamepad_connected_count > 0;
	}

	/* input map - based on xbox one controller
	axes:
	-----
	0 - stick l horizontal
	1 - stick l vertical
	2 - stick r horizontal
	3 - stick r vertical

	buttons:
	--------
	 0 - button south
	 1 - button east
	 2 - button west
	 3 - button north
	 4 - bumper l
	 5 - bumper r
	 6 - trigger l
	 7 - trigger r
	 8 - back
	 9 - start
	10 - stick press l
	11 - stick press r
	12 - dpad u
	13 - dpad d
	14 - dpad l
	15 - dpad r
	*/
	step_check_gamepad_input()
	{
		if (InputManager.is_input_paused) return;

		this.is_input_enabled = this.enable_input_check();
		if (!this.is_input_enabled) return;

		var all_gamepads = navigator.getGamepads();
		if (all_gamepads.length < 1) return;

		var main_gamepad = all_gamepads[0];
		if (!main_gamepad) return;

		for (var bi = 0; bi < main_gamepad.buttons.length; bi++)
			this.check_gamepad_button(bi, main_gamepad.buttons[bi]);
		//for (var ai = 0; ai < main_gamepad.axes.length; ai++) check_gamepad_axis(ai, main_gamepad.axes[ai]);
	}

	check_gamepad_button(bi, btn)
	{
		if (!btn.pressed) return;
		switch (bi)
		{
			case 0: try_bubbles_select(); break;
			case 1: try_bubbles_back(); break;
			case 3: OnBubbleBannerMoreInfo(); break;

			case 12: navigate_u(); break;
			case 13: navigate_d(); break;
			case 14: navigate_l(); break;
			case 15: navigate_r(); break;
		}
	}

	onTouchStart(e)
	{
		this.touch_start_pos_x = e.changedTouches[0].pageX;
		this.touch_start_pos_y = e.changedTouches[0].pageY;
	}

	onTouchEnd(e)
	{
		this.touch_end_pos_x = e.changedTouches[0].pageX;
		this.touch_end_pos_y = e.changedTouches[0].pageY;
		var delta_x = this.touch_start_pos_x - this.touch_end_pos_x;
		var delta_y = this.touch_start_pos_y - this.touch_end_pos_y;
		this.onAnyScroll(delta_x, delta_y);
	}

	onKeyPress(e)
	{
		if (!this.is_input_enabled) return;

		switch (e.code)
		{
			case "Backspace": try_bubbles_back(); break;
			case "Escape": try_bubbles_back(); break;
			case "Enter": try_bubbles_select(); break;
			case "Space": try_bubbles_select(); break;
			case "ArrowRight": navigate_r(); break;
			case "ArrowLeft": navigate_l(); break;
			case "ArrowUp": navigate_u(); break;
			case "ArrowDown": navigate_d(); break;
			case "KeyI": OnBubbleBannerMoreInfo(); break;
		}
	}

	onwheel(wheelEvent)
	{
		this.onAnyScroll(wheelEvent.deltaX, wheelEvent.deltaY);
	}

	onAnyScroll(delta_x, delta_y)
	{
		if (!this.is_input_enabled) return;

		if (page_current != "journals") return;
		var max_delta = Math.max(Math.abs(delta_x), Math.abs(delta_y));
		if (max_delta < this.scroll_deadzone) return;

		if (Math.abs(delta_y) > Math.abs(delta_x)) delta_x = 0.0;
		else delta_y = 0.0;

		if (is_preview_bubble_showing)
		{
			hide_preview_bubble();
			return;
		}

		if (delta_x > this.scroll_deadzone) OnBubblesNext();
		else if (delta_x < -this.scroll_deadzone) OnBubblesPrev();
		else if (delta_y > this.scroll_deadzone) OnBubblesNext();
		else if (delta_y < -this.scroll_deadzone) OnBubblesPrev();
	}
}