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

	constructor(id, title, imgsrc, clickable_banner)
	{
		this.id = id;
		this.title = title;
		this.imgsrc = imgsrc;
		this.clickable_banner = clickable_banner;
		this.create();
	}

	create()
	{
		var idoff = id_offset_wrapped(this.id, bubble_view_id, bubble_count_max);
		this.e_root = document.createElement("div");
		this.e_root.className = "gallery-bubble-root";
		this.e_root.title = this.title;
		this.e_root.style.position = "absolute";
		var minbsize = "min(" + bubble_width_base + "vw," + bubble_width_base + "vh)";
		this.e_root.style.width = minbsize;
		set_bubble_pos(this.e_root, "50%");

		this.e_img = null;
		if (this.imgsrc)
		{
			this.e_img = document.createElement("img");
			this.e_img.className = "gallery-bubble-image";
			this.e_img.src = this.imgsrc;
			this.e_root.appendChild(this.e_img);
		}

		this.e_banner = document.createElement("div");
		this.e_banner.className = "gallery-bubble-banner";
		this.e_banner.addEventListener("click", HideBubbleBannerMoreInfo);
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

		var b_banner_info = document.createElement("img");
		b_banner_info.className = "gallery-bubble-banner-info";
		b_banner_info.src = "/images/icon-info.png";
		b_banner_info.title = "More Info";
		b_banner_info.addEventListener("click", OnBubbleBannerMoreInfo);
		this.e_banner.appendChild(b_banner_info);

		this.e_more_icon = document.createElement("img");
		this.e_more_icon.className = "gallery-bubble-banner-more";
		this.e_more_icon.src = "/images/icon-more.png";
		this.e_more_icon.title = "See More";
		this.e_banner.appendChild(this.e_more_icon);

		this.e_banner_corner = document.createElement("div");
		this.e_banner_corner.className = "gallery-bubble-banner-corner";
		this.e_banner_corner.innerText = "! OUT OF STOCK !";
		this.e_banner_corner.style.display = "none";
		this.e_banner_corner.title = "What does this mean?";
		this.e_banner_corner.addEventListener("click", onOutOfStockHelp);
		this.e_root.appendChild(this.e_banner_corner);

		if (!this.clickable_banner)
		{
			this.e_banner.style.pointerEvents = "none";
			this.e_banner_title.style.pointerEvents = "none";
			this.e_banner_body.style.pointerEvents = "none";
			b_banner_info.style.pointerEvents = "none";
			this.e_banner_corner.style.pointerEvents = "none";
			this.e_more_icon.style.pointerEvents = "none";
		}
	}

	update_id(new_id)
	{
		this.id = new_id;
		//update labels and img src

		if (is_bubble_container(this.id))
			this.e_more_icon.style.opacity = "100%";
		else
			this.e_more_icon.style.opacity = "0%";
	}
}

class AnimJob
{
	t = 0.0;
	speed = 1.0;
	interval = null;
	interruptible = false;
	updateFx = (x) => { };
	afterFx = () => { };

	constructor(updateFx, speed)
	{
		this.t = 0.0;
		this.interval = null;
		this.updateFx = updateFx;
		this.afterFx = () => { };
		this.speed = speed;
		this.interruptible = false;
	}

	is_running() { if (this.interval) return true; else false; }

	start()
	{
		if (this.interval)
		{
			if (!this.interruptible) return;
			this.finish();
		}
		this.t = 0.0;
		if (this.updateFx) this.updateFx(0);
		this.interval = setInterval(this.update_properties.bind(this), 20);
	}

	update_properties()
	{
		this.t += 0.02 * this.speed;
		if (this.t >= 1.0)
		{
			this.t = 1.0;
			this.finish();
			return;
		}
		if (this.updateFx) this.updateFx(ease_in_out(this.t));
	}

	finish()
	{
		clearInterval(this.interval);
		if (this.updateFx) this.updateFx(1);
		if (this.afterFx) this.afterFx();
		this.interval = null;
	}
}




var vertical_layout = true;
var page_current;

var e_content_body;
var e_body_background;
var e_page_container;
var e_coll_cntnr;
var e_lbl_debug;
var e_intro_container;

var e_link_about;
var e_link_journals;
var e_link_faq;
var e_link_links;

var e_infobanner;
var e_infobanner_lbl;
var e_infobanner_lbl2;
var e_splash_title;

var e_preview_container;
var e_preview_body;
var e_preview_title;
var e_preview_subtitle;
var e_preview_img;
var e_preview_img_prev;
var e_preview_img_next;

var e_nav_preview_prev;
var e_nav_preview_next;

var collections_dir;
var collectionsList;
var collections_loaded = false;
var id_collections_load;

var current_collection_id = -1;
var current_group_id = -1;

var e_debug_slider;


function when_body_load()
{
	document.body.addEventListener("keydown", onKeyPress);

	e_content_body = document.getElementById("page-content-body");
	e_page_container = document.getElementById("page-container");
	e_body_background = document.getElementById("body-background");

	e_lbl_debug = document.createElement("div");
	e_lbl_debug.class = "debug-label";
	document.body.appendChild(e_lbl_debug);

	e_intro_container = document.getElementById("intro");

	e_link_about = document.getElementById("titlelink-about");
	e_link_journals = document.getElementById("titlelink-journals");
	e_link_faq = document.getElementById("titlelink-faq");
	e_link_links = document.getElementById("titlelink-links");

	e_preview_container = document.getElementById("preview-container");
	e_preview_body = document.getElementById("preview-body");
	e_preview_img_prev = document.getElementById("preview-image-prev");
	e_preview_img = document.getElementById("preview-image");
	e_preview_img_next = document.getElementById("preview-image-next");
	e_preview_title = document.getElementById("preview-title");
	e_preview_subtitle = document.getElementById("preview-subtitle");

	e_nav_preview_prev = document.getElementById("preview-prev");
	e_nav_preview_next = document.getElementById("preview-next");
	hide_preview_nav();

	page_fade_val = 1.0;
	if (localStorage)
	{
		var last_page = localStorage.getItem("page");
		if (last_page == null)
		{
			page_current = "welcome";
			set_page(page_current);
		}
		else
		{
			page_current = last_page;
			set_page(last_page);
		}
	}

	collections_loaded = false;
	fetch("/collections/list.json")
		.then(x => x.text())
		.then(x => parse_collections(x));

	onwindowresize();

	addEventListener("resize", onwindowresize);
	addEventListener("wheel", onwheel);
	addEventListener("touchstart", onTouchStart);
	addEventListener("touchend", onTouchEnd);
	//addEventListener("mousemove", onMouseMove);
}


var screen_size_x;
var screen_size_y;
var screen_center_x;
var screen_center_y;
var screen_aspect;


function onwindowresize()
{
	screen_size_x = e_preview_container.offsetWidth;
	screen_size_y = e_preview_container.offsetHeight;
	screen_center_x = screen_size_x / 2.0;
	screen_center_y = screen_size_y / 2.0;

	screen_aspect = screen_size_x / screen_size_y;
	document.documentElement.style.setProperty('--view-ratio', screen_aspect);

	vertical_layout = screen_aspect < 1.0;

	if (preview_image_id >= 0) update_preview_positions();
}



var touch_start_pos_x;
var touch_start_pos_y;
var touch_end_pos_x;
var touch_end_pos_y;

function onTouchStart(e)
{
	touch_start_pos_x = e.changedTouches[0].pageX;
	touch_start_pos_y = e.changedTouches[0].pageY;
}

function onTouchEnd(e)
{
	touch_end_pos_x = e.changedTouches[0].pageX;
	touch_end_pos_y = e.changedTouches[0].pageY;
	var delta_x = touch_start_pos_x - touch_end_pos_x;
	var delta_y = touch_start_pos_y - touch_end_pos_y;
	onAnyScroll(delta_x, delta_y);
}

function onKeyPress(e)
{
	if (!can_bubbles_move) return;
	if (interval_bubble_shift) return;
	if (interval_bubbles_visibility) return;
	if (page_current != "journals") return;
	switch (e.code)
	{
		case "Enter": select_bubble(); break;
		case "Space": select_bubble(); break;
		case "ArrowRight": NextBubble(); break;
		case "ArrowLeft": PrevBubble(); break;
		case "ArrowUp": if (is_preview_bubble_showing) hide_preview_bubble(); else select_bubble(); break;
		case "ArrowDown":
			if (is_preview_bubble_showing) hide_preview_bubble();
			else OnBubblesBack();
			break;
		case "KeyI": OnBubbleBannerMoreInfo(); break;
	}
}

var interval_page_scroll;
var pageContainerScrollPos = 0;
function onPageContainerScrolled()
{
	if (interval_page_scroll == null) interval_page_scroll = setInterval(frame_scroll_page, 15);
}

function frame_scroll_page()
{
	var delta = e_page_container.scrollTop - pageContainerScrollPos;
	if (Math.abs(delta) > 0.05)
	{
		pageContainerScrollPos += delta * 0.1;
		e_body_background.style.objectPosition = "0px -" + pageContainerScrollPos * 0.1 + "px";
	}
	else
	{
		e_body_background.style.objectPosition = "0px -" + e_page_container.scrollTop * 0.1 + "px";
		if (interval_page_scroll != null) clearInterval(interval_page_scroll);
	}
}

function onwheel(wheelEvent)
{
	onAnyScroll(wheelEvent.deltaX, wheelEvent.deltaY);
}

function onAnyScroll(delta_x, delta_y)
{
	if (page_current != "journals") return;
	if (Math.abs(delta_y) > Math.abs(delta_x)) delta_x = 0.0;
	else delta_y = 0.0;

	if (is_preview_bubble_showing)
	{
		hide_preview_bubble();
		return;
	}
	else
	{
		if (delta_x > 0) NextBubble();
		else if (delta_x < 0) PrevBubble();
		else if (delta_y > 0) NextBubble();
		else if (delta_y < 0) PrevBubble();
	}

	/*
	if (preview_image_id >= 0)
	{
		var coll = collectionsList.collections[preview_collection_id];
		var grp = coll.groups[preview_group_id];
		if (grp.images.length > 1)
		{
			if (delta_x > 0) begin_preview_anim(-1);
			else if (delta_x < 0) begin_preview_anim(1);
			else if (delta_y > 0) begin_preview_anim(1);
			else if (delta_y < 0) begin_preview_anim(-1);
		}
	}
	else
	{
		
	}
	*/
}



function set_page_instant(page_name)
{
	page_current = page_name;
	update_page_title_link(page_name);
	update_page_content(page_name);
	localStorage.setItem("page", page_name);
}

function set_page(page_name)
{
	page_current = page_name;
	update_page_title_link(page_name);
	page_fade_start(page_name);
	localStorage.setItem("page", page_name);
}

function reset_page_title_links()
{
	e_link_about.className = "title-link";
	e_link_journals.className = "title-link";
	e_link_faq.className = "title-link";
	e_link_links.className = "title-link";
}

function update_page_title_link(page_name)
{
	reset_page_title_links();
	if (page_name == "about") e_link_about.className = "title-link title-link-current";
	else if (page_name == "journals") e_link_journals.className = "title-link title-link-current";
	else if (page_name == "links") e_link_links.className = "title-link title-link-current";
	else if (page_name == "faq") e_link_faq.className = "title-link title-link-current";
}

function update_page_content(page_name)
{
	fetch("/" + page_name + ".html")
		.then(x => x.text())
		.then(
			x =>
			{
				e_content_body.innerHTML = x;
				if (page_name === "journals")
				{
					//populate_collection_options();
					create_bubbles();
				}
			}
		);
}










//new ui start

function calculateDistance(e, mx, my)
{
	var cx = e.offsetLeft + e.offsetWidth / 2;
	var cy = e.offsetTop + e.offsetHeight / 2;
	var xo = cx - mx;
	var yo = cy - my;
	return Math.sqrt(xo * xo + yo * yo);
}

var bubble_view_id = 0;
var bubble_view_id_coll = 0;
var bubble_view_id_group = 0;
var bubble_view_id_image = 0;
var bubble_count_max;

var e_bubbles_back;

var bubbleid0;
var bubbleid1;
var bubbleid2;

var bubble_spare;
var bubble_prev;
var bubble_curr;
var bubble_next;

var t_bubble_shift;
var interval_bubble_shift;

var t_anim_bubbles_appear;
var t_anim_bubbles_disappear;
var interval_bubbles_visibility;

var b_posy_base = 50;
var b_posy_raised = 48;
var bubble_width_base = 64;

var bx_l = 0;
var bx_0 = 20;
var bx_1 = 50;
var bx_2 = 80;
var bx_r = 100;

var bs_s = 0;
var bs_m = 70;
var bs_b = 100;

var ba_z = -30;
var ba_h = 50;
var ba_f = 100;

var bprev_posx_base = 20;
var bprev_posx_target = 0;
var bcurr_posx_base = 50;
var bcurr_posx_target = 20;
var bnext_posx_base = 80;
var bnext_posx_target = 50;

var bprev_scale_base = 80;
var bprev_scale_target = 100;
var bcurr_scale_base = 100;
var bcurr_scale_target = 80;
var bnext_scale_base = 80;
var bnext_scale_target = 80;

var bprev_alpha_base = 50;
var bprev_alpha_target = 100;
var bcurr_alpha_base = 100;
var bcurr_alpha_target = 50;
var bnext_alpha_base = 50;
var bnext_alpha_target = 50;

var bspare_posx_base = 0;
var bspare_posx_target = 20;
var bspare_scale_base = bs_s;
var bspare_scale_target = bs_m;
var bspare_alpha_base = 0;
var bspare_alpha_target = 50;

var anim_speed_bubble_shift = 0.09;
var anim_speed_bubble_visibility = 0.09;

function create_bubbles()
{
	e_coll_cntnr = document.getElementById("collection-container");

	e_coll_cntnr.style.overflow = "hidden";

	collection_choice_list = document.createElement("div");
	collection_choice_list.id = "collection-choices";
	collection_choice_list.className = "gallery-bubble-container";
	e_coll_cntnr.appendChild(collection_choice_list);

	e_splash_title = document.createElement("div");
	e_splash_title.id = "splash-title";
	e_splash_title.className = "splash-title";
	e_splash_title.innerText = "";
	e_coll_cntnr.appendChild(e_splash_title);

	e_infobanner = document.createElement("div");
	e_infobanner.id = "infobanner";
	e_infobanner.className = "infobanner";
	e_infobanner_lbl = document.createElement("div");
	e_infobanner_lbl.id = "infobanner-text";
	e_infobanner_lbl.className = "infobanner-text";
	e_infobanner_lbl.innerText = "COLLECTIONS";
	e_infobanner_lbl2 = document.createElement("div");
	e_infobanner_lbl2.id = "infobanner-subtext";
	e_infobanner_lbl2.className = "infobanner-subtext";
	e_infobanner_lbl2.innerText = "( OUT OF STOCK )";
	e_infobanner.appendChild(e_infobanner_lbl);
	e_infobanner.appendChild(e_infobanner_lbl2);
	e_coll_cntnr.appendChild(e_infobanner);

	e_bubbles_back = document.createElement("div");
	e_bubbles_back.id = "bubbles-back";
	e_bubbles_back.className = "bubbles-back";
	e_bubbles_back.innerText = "BACK";
	e_bubbles_back.addEventListener("click", OnBubblesBack);

	update_bubble_ids();

	bubble_prev = create_bubble_from_id(bubbleid0, false);
	bubble_curr = create_bubble_from_id(bubbleid1, true);
	bubble_next = create_bubble_from_id(bubbleid2, false);

	bubble_prev.e_root.style.zIndex = 15;
	bubble_curr.e_root.style.zIndex = 25;
	bubble_next.e_root.style.zIndex = 15;

	bubble_spare = create_bubble_from_id(bubbleid1, false);
	bubble_spare.e_root.style.pointerEvents = "none";
	bubble_spare.e_root.style.opacity = "0%";

	bubble_prev.e_root.addEventListener("click", PrevBubble);
	bubble_curr.e_root.addEventListener("click", select_bubble);
	bubble_next.e_root.addEventListener("click", NextBubble);

	e_coll_cntnr.appendChild(e_bubbles_back);

	create_preview_bubble();

	FadeBubblesIn();
}

function create_bubble_from_id(i, clickable_banner)
{
	var b = new GalleryBubble(i, get_bubble_label(i), get_bubble_img_src(i), clickable_banner);
	collection_choice_list.appendChild(b.e_root);
	return b;
}

var showing_bubble_moreinfo;

function HideBubbleBannerMoreInfo(e)
{
	if (!showing_bubble_moreinfo) return;
	if (e && e.stopPropagation) e.stopPropagation();
	showing_bubble_moreinfo = false;
	update_bubble_banner(0);
}

function OnBubbleBannerMoreInfo(e)
{
	if (e && e.stopPropagation) e.stopPropagation();

	showing_bubble_moreinfo = !showing_bubble_moreinfo;
	if (showing_bubble_moreinfo) update_bubble_banner(1);
	else update_bubble_banner(0);
}

function update_bubble_banner(t)
{
	if (t > 0.02)
	{
		bubble_curr.e_banner_body.innerHTML = "";
		if (current_collection_id > -1)
		{
			var c = collectionsList.collections[current_collection_id];
			bubble_curr.e_banner_body.innerHTML = "<div>" + c.desc + "</div>";
		}
		else
		{
			var c = collectionsList.collections[bubbleid1];
			bubble_curr.e_banner_body.innerHTML = "<div>" + c.desc + "</div>";
		}
	}

	t = ease_in_out(t);
	var w = lerp(80, 100, t);
	var h = lerp(20, 100, t);

	bubble_curr.e_banner_title.style.top = ((1.0 - t) * 35 + 15) + "%";
	bubble_curr.e_banner_body.style.opacity = (t * 100) + "%";

	if (t > 0.5) 
	{
		bubble_curr.e_banner.style.pointerEvents = "fill";
		bubble_curr.e_banner.style.cursor = "help";
	}
	else
	{
		bubble_curr.e_banner.style.pointerEvents = "none";
		bubble_curr.e_banner.style.cursor = "none";
	}
	bubble_curr.e_banner.style.width = w + "%";
	bubble_curr.e_banner.style.height = h + "%";

	bubble_curr.e_banner_corner.style.opacity = ((1.0 - t) * 100) + "%";
}




function OnBubblesBack()
{
	if (!can_bubbles_move) return;
	if (current_group_id >= 0) current_group_id = -1;
	else if (current_collection_id >= 0) current_collection_id = -1;
	else return;
	FadeBubblesInOut();
}

function select_bubble()
{
	if (!can_bubbles_move) return;

	if (current_collection_id < 0) 
	{
		current_collection_id = bubble_view_id;
		bubble_view_id_group = 0;
		bubble_view_id_image = 0;
	}
	else if (current_group_id < 0) 
	{
		if (collectionsList.collections[current_collection_id].groups[bubble_view_id].images.length < 2)
		{
			current_group_id = bubble_view_id;
			show_preview_bubble();
			//show_preview(0);
			current_group_id = -1;
			return;
		}
		else
		{
			current_group_id = bubble_view_id;
			bubble_view_id_image = 0;
		}
	}
	else
	{
		show_preview_bubble();
		//show_preview(bubble_view_id);
		return;
	}
	FadeBubblesInOut();
}




function FadeBubblesIn()
{
	if (interval_bubbles_visibility) return;
	update_bubble_ids();
	UpdateBubbleImages();
	t_anim_bubbles_appear = 0.0;
	interval_bubbles_visibility = setInterval(step_bubbles_anim_vis_in, 20);
}

function FadeBubblesInOut()
{
	if (interval_bubbles_visibility) return;
	t_anim_bubbles_disappear = 0.0;
	interval_bubbles_visibility = setInterval(step_bubbles_anim_vis_out, 20);
}


function step_bubbles_anim_vis_out()
{
	t_anim_bubbles_disappear += anim_speed_bubble_visibility;
	update_bubbles_anim_disappear(t_anim_bubbles_disappear);
	if (t_anim_bubbles_disappear >= 1.0)
	{
		update_bubbles_anim_disappear(1);
		clearInterval(interval_bubbles_visibility);
		interval_bubbles_visibility = null;
		FadeBubblesIn();
	}
}

function step_bubbles_anim_vis_in()
{
	t_anim_bubbles_appear += anim_speed_bubble_visibility;
	update_bubbles_anim_appear(t_anim_bubbles_appear);
	if (t_anim_bubbles_appear >= 1.0)
	{
		update_bubbles_anim_appear(1);
		clearInterval(interval_bubbles_visibility);
		interval_bubbles_visibility = null;
		playanim_jiggle_things(true, false);
		return;
	}
}

function update_bubbles_anim_disappear(t)
{
	var tval = t;
	var tval0 = saturate(tval * 1.5);
	var tval1 = saturate(tval * 1.25);
	var tval2 = saturate(tval * 1.5);

	set_bubble_pos(bubble_prev.e_root, lerp(bx_0, 40, tval0), (b_posy_base + 40 * tval0 * tval0) + "%");
	set_bubble_pos(bubble_curr.e_root, lerp(bx_1, 40, tval1), (b_posy_base + 40 * tval1 * tval1) + "%");
	set_bubble_pos(bubble_next.e_root, lerp(bx_2, 40, tval2), (b_posy_base + 40 * tval2 * tval2) + "%");

	var alpha0 = ba_h * Math.pow(1.0 - tval0, 2);
	var alpha1 = ba_f * Math.pow(1.0 - tval1, 2);
	var alpha2 = ba_h * Math.pow(1.0 - tval2, 2);
	bubble_prev.e_root.style.opacity = (alpha0) + "%";
	bubble_curr.e_root.style.opacity = (alpha1) + "%";
	bubble_next.e_root.style.opacity = (alpha2) + "%";
	bubble_transform(bubble_prev.e_root, (lerp(bs_m, bs_m / 2, tval0)));
	bubble_transform(bubble_curr.e_root, (lerp(bs_b, bs_b / 2, tval1)));
	bubble_transform(bubble_next.e_root, (lerp(bs_m, bs_m / 2, tval2)));
}

function update_bubbles_anim_appear(t)
{
	var tval = t;
	var tval0 = saturate(tval);
	var tval1 = saturate(tval * 1.5);
	var tval2 = saturate(tval);

	set_bubble_pos(bubble_prev.e_root, lerp(40, bx_0, tval0) + "%", (b_posy_base - Math.pow(1.0 - tval0, 2) * 40) + "%");
	set_bubble_pos(bubble_curr.e_root, lerp(50, bx_1, tval1) + "%", (b_posy_base - Math.pow(1.0 - tval1, 2) * 40) + "%");
	set_bubble_pos(bubble_next.e_root, lerp(60, bx_2, tval2) + "%", (b_posy_base - Math.pow(1.0 - tval2, 2) * 40) + "%");

	var alpha0 = ba_h * Math.pow(tval0, 2);
	var alpha1 = ba_f * Math.pow(tval1, 2);
	var alpha2 = ba_h * Math.pow(tval2, 2);
	bubble_prev.e_root.style.opacity = (alpha0) + "%";
	bubble_curr.e_root.style.opacity = (alpha1) + "%";
	bubble_next.e_root.style.opacity = (alpha2) + "%";
	bubble_transform(bubble_prev.e_root, (lerp(bs_m / 2, bs_m, tval0)));
	bubble_transform(bubble_curr.e_root, (lerp(bs_b / 2, bs_b, tval1)));
	bubble_transform(bubble_next.e_root, (lerp(bs_m / 2, bs_m, tval2)));
}







function UpdateBubblesForMouse(mouseEvent)
{
	//e_lbl_debug.innerText = mouseEvent.clientX;

	if (bubble_prev) UpdateBubbleForMouse(bubble_prev.root, mouseEvent);
	//if (bubble_curr) UpdateBubbleForMouse(bubble_curr.root, mouseEvent);
	if (bubble_next) UpdateBubbleForMouse(bubble_next.root, mouseEvent);
}

function inside_rect(x, y, rect)
{
	if (x < rect.left) return false;
	if (x > (rect.left + rect.width)) return false;
	if (y < rect.top) return false;
	if (y > (rect.top + rect.height)) return false;
	return true;
}

function UpdateBubbleForMouse(e, mouseEvent)
{
	if (!interval_bubble_shift)
	{
		var brect = e.getBoundingClientRect();
		var highlighted = inside_rect(mouseEvent.clientX, mouseEvent.clientY, brect) ? 1 : 0;
		e.style.top = Math.round(lerp(b_posy_base, b_posy_raised, highlighted)) + "%";
	}
}

function get_item(id)
{
	if (current_collection_id < 0) return collectionsList.collections[id];
	if (current_group_id < 0) return collectionsList.collections[current_collection_id].groups[id];
	else return collectionsList.collections[current_collection_id].groups[current_group_id].images[id];
}

function get_bubble_label(id)
{
	if (current_collection_id < 0) return collectionsList.collections[id].name;
	var c = collectionsList.collections[current_collection_id];
	if (!c) return "UNKNOWN DESC : NO COLL";
	if (current_group_id < 0) return c.groups[id].name;
	var g = c.groups[current_group_id];
	if (!g) return "UNKNOWN DESC : NO GRP";
	if (!g.images[id]) return "UNKNOWN DESC : NO IMG";
	return g.images[id].desc;
}

function is_bubble_container(id)
{
	if (current_collection_id < 0) return true;
	var c = collectionsList.collections[current_collection_id];
	if (!c) return false;
	if (current_group_id < 0) return c.groups[id].images.length > 1;
	return false;
}

const str_default_img_src = "/images/RedCircle_256.png";

function get_bubble_img_src(id)
{
	var coll = collectionsList.collections[id];
	if (current_collection_id < 0) return get_coll_img_src(coll);
	coll = collectionsList.collections[current_collection_id];

	var grp = coll.groups[id];
	if (current_group_id < 0) return get_grp_img_src(grp);
	grp = coll.groups[current_group_id];

	if (!grp.images[id]) return coll.groups[current_group_id].images[0].path;
	return grp.images[id].path;
}

function get_coll_img_src(coll)
{
	if (!coll) return str_default_img_src;
	var grpid = Math.max(0, coll.showcaseImageGroupIndex);
	var imgid = Math.max(0, coll.showcaseImageIndex);
	if (!coll.groups[grpid]) return str_default_img_src;
	if (!coll.groups[grpid].images[imgid]) return str_default_img_src;
	return coll.groups[grpid].images[imgid].path;
}

function get_grp_img_src(grp)
{
	if (!grp) return str_default_img_src;
	if (!grp.images) return str_default_img_src;
	if (!grp.images[0]) return str_default_img_src;
	return grp.images[0].path;
}

function UpdateSpareBubbleImage(delta)
{
	var spareBubbleId = bubble_view_id - delta;
	spareBubbleId = wrap_id(spareBubbleId, bubble_count_max);
	UpdateBubbleImage(bubble_spare.e_img, spareBubbleId);
	bubble_spare.e_banner_title.innerText = get_bubble_label(spareBubbleId);
	refresh_bubble_corner_banner(bubble_spare, spareBubbleId);
}

function UpdateBubbleImages()
{
	bubble_prev.update_id(bubbleid0);
	bubble_curr.update_id(bubbleid1);
	bubble_next.update_id(bubbleid2);

	UpdateBubbleImage(bubble_prev.e_img, bubbleid0);
	UpdateBubbleImage(bubble_curr.e_img, bubbleid1);
	UpdateBubbleImage(bubble_next.e_img, bubbleid2);

	bubble_prev.e_root.title = get_bubble_label(bubbleid0);
	bubble_prev.e_banner_title.innerText = bubble_prev.e_root.title;
	bubble_curr.e_root.title = get_bubble_label(bubbleid1);
	bubble_curr.e_banner_title.innerText = bubble_curr.e_root.title;
	bubble_next.e_root.title = get_bubble_label(bubbleid2);
	bubble_next.e_banner_title.innerText = bubble_next.e_root.title;

	refresh_bubble_corner_banner(bubble_prev, bubbleid0);
	refresh_bubble_corner_banner(bubble_curr, bubbleid1);
	refresh_bubble_corner_banner(bubble_next, bubbleid2);
}

function refresh_bubble_corner_banner(b, id)
{
	var collid = -1;
	if (current_collection_id < 0) collid = id;
	else collid = current_collection_id;

	var coll = collectionsList.collections[collid];
	if (coll.etsyUrl === "") b.e_banner_corner.style.display = "block";
	else b.e_banner_corner.style.display = "none";
}

function UpdateBubbleImage(img, id)
{
	if (!img) return;
	img.src = get_bubble_img_src(id);
}

var can_bubbles_move = true;
var timeout_bubble_move;
function PrevBubble()
{
	if (!can_bubbles_move) return;
	if (interval_bubbles_visibility) return;
	can_bubbles_move = false;
	if (is_preview_bubble_showing)
	{
		hide_preview_bubble();
		if (!timeout_bubble_move) 
		{
			timeout_bubble_move = setTimeout(() => ModViewBubble(-1), 200);
			setTimeout(show_preview_bubble, 400);
		}
		return;
	}

	timeout_bubble_move = ModViewBubble(-1);
}

function NextBubble()
{
	if (!can_bubbles_move) return;
	if (interval_bubbles_visibility) return;
	can_bubbles_move = false;
	if (is_preview_bubble_showing)
	{
		hide_preview_bubble();
		if (!timeout_bubble_move)
		{
			timeout_bubble_move = setTimeout(() => ModViewBubble(1), 200);
			setTimeout(show_preview_bubble, 400);
		}
		return;
	}

	timeout_bubble_move = ModViewBubble(1);
}

function ModViewBubble(delta)
{
	HideBubbleBannerMoreInfo();
	SetBubbleViewIndex(GetBubbleViewIndex() + delta);
	update_bubble_ids();
	anim_bubble_shift(-delta);
	timeout_bubble_move = null;
}

function GetBubbleViewIndex()
{
	if (current_collection_id < 0) return bubble_view_id_coll;
	if (current_group_id < 0) return bubble_view_id_group;
	else return bubble_view_id_image;
}

function SetBubbleViewIndex(id)
{
	if (current_collection_id < 0) bubble_view_id_coll = id;
	if (current_group_id < 0) bubble_view_id_group = id;
	else bubble_view_id_image = id;
}

function update_bubble_ids()
{
	if (page_current != "journals") return;

	bubble_view_id = GetBubbleViewIndex();

	if (current_collection_id < 0)
	{
		e_bubbles_back.style.opacity = "0%";
		e_bubbles_back.style.pointerEvents = "none";
		e_splash_title.style.opacity = "0%";
		e_splash_title.style.filter = "blur(12px)";
		e_infobanner_lbl.innerText = "COLLECTIONS";
		if (e_infobanner_lbl2) e_infobanner_lbl2.style.display = "none";
	}
	else 
	{
		var coll = collectionsList.collections[current_collection_id];
		e_bubbles_back.style.opacity = "100%";
		e_bubbles_back.style.pointerEvents = "all";
		e_splash_title.innerText = coll.name;
		e_splash_title.style.opacity = "100%";
		e_splash_title.style.filter = "blur(3px)";

		if (e_infobanner_lbl2)
		{
			if (collectionsList.collections[current_collection_id].etsyUrl === "") e_infobanner_lbl2.style.display = "block";
			else e_infobanner_lbl2.style.display = "none";
		}

		if (current_group_id < 0)
		{
			e_infobanner_lbl.innerText = "THE " + coll.name.toUpperCase() + " COLLECTION";
			e_bubbles_back.innerText = "BACK TO COLLECTIONS";
		}
		else 
		{
			var currgroup = collectionsList.collections[current_collection_id].groups[current_group_id];
			e_infobanner_lbl.innerText = coll.name.toUpperCase() + " / " + currgroup.name.toUpperCase();
			e_bubbles_back.innerText = "BACK TO " + coll.name.toUpperCase();
		}
	}

	if (current_collection_id < 0) bubble_count_max = collectionsList.collections.length;
	else if (current_group_id < 0) bubble_count_max = collectionsList.collections[current_collection_id].groups.length;
	else bubble_count_max = collectionsList.collections[current_collection_id].groups[current_group_id].images.length;

	bubble_view_id = wrap_id(bubble_view_id, bubble_count_max);
	bubbleid0 = wrap_id(bubble_view_id - 1, bubble_count_max);
	bubbleid1 = wrap_id(bubble_view_id, bubble_count_max);
	bubbleid2 = wrap_id(bubble_view_id + 1, bubble_count_max);

	/*
	e_lbl_debug.innerText = "[COLL : " + current_collection_id + "]";
	e_lbl_debug.innerText += " [GRP : " + current_group_id + "]";
	e_lbl_debug.innerText += " [VIEW : " + bubble_view_id + "]";
	e_lbl_debug.innerText += " [VIEWMAX : " + bubble_count_max + "]";
	*/
}

var animJob_bubble_shift;

function anim_bubble_shift(delta)
{
	if (animJob_bubble_shift && animJob_bubble_shift.is_running()) return;

	if (!animJob_bubble_shift) 
	{
		animJob_bubble_shift = new AnimJob(lerp_bubble_shift, 5.0);
		animJob_bubble_shift.afterFx = finish_bubble_shift;
	}

	set_bubble_targets(delta);
	UpdateSpareBubbleImage(delta);
	animJob_bubble_shift.start();

	/*
	if (interval_bubble_shift) return;
	t_bubble_shift = 0.0;
	set_bubble_targets(delta);
	lerp_bubble_shift(0);
	UpdateSpareBubbleImage(delta);
	interval_bubble_shift = setInterval(step_bubble_shift, 20);
	*/
}

function set_bubble_targets(delta)
{
	if (delta < 0)//shifting left
	{
		bprev_posx_base = bx_0;
		bprev_posx_target = bx_l;
		bcurr_posx_base = bx_1;
		bcurr_posx_target = bx_0;
		bnext_posx_base = bx_2;
		bnext_posx_target = bx_1;

		bprev_scale_base = bs_m;
		bprev_scale_target = bs_s;
		bcurr_scale_base = bs_b;
		bcurr_scale_target = bs_m;
		bnext_scale_base = bs_m;
		bnext_scale_target = bs_b;

		bprev_alpha_base = ba_h;
		bprev_alpha_target = ba_z;
		bcurr_alpha_base = ba_f;
		bcurr_alpha_target = ba_h;
		bnext_alpha_base = ba_h;
		bnext_alpha_target = ba_f;

		bspare_posx_base = bx_r;
		bspare_posx_target = bx_2;
		bspare_scale_base = bs_s;
		bspare_scale_target = bs_m;
		bspare_alpha_base = ba_z;
		bspare_alpha_target = ba_h;
	}
	else//shifting right
	{
		bprev_posx_base = bx_0;
		bprev_posx_target = bx_1;
		bcurr_posx_base = bx_1;
		bcurr_posx_target = bx_2;
		bnext_posx_base = bx_2;
		bnext_posx_target = bx_r;

		bprev_scale_base = bs_m;
		bprev_scale_target = bs_b;
		bcurr_scale_base = bs_b;
		bcurr_scale_target = bs_m;
		bnext_scale_base = bs_m;
		bnext_scale_target = bs_s;

		bprev_alpha_base = ba_h;
		bprev_alpha_target = ba_f;
		bcurr_alpha_base = ba_f;
		bcurr_alpha_target = ba_h;
		bnext_alpha_base = ba_h;
		bnext_alpha_target = ba_z;

		bspare_posx_base = bx_l;
		bspare_posx_target = bx_0;
		bspare_scale_base = bs_s;
		bspare_scale_target = bs_m;
		bspare_alpha_base = ba_z;
		bspare_alpha_target = ba_h;
	}
}

/*
function step_bubble_shift()
{
	t_bubble_shift += anim_speed_bubble_shift;
	var tanim = ease_in_out(t_bubble_shift);

	if (t_bubble_shift >= 1.0) finish_bubble_shift();
	else lerp_bubble_shift(tanim);
}
*/


function set_bubble_pos(e, x, y = "50%")
{
	if (vertical_layout) 
	{
		e.style.top = x;
		e.style.left = y;
	}
	else 
	{
		e.style.top = y;
		e.style.left = x;
	}
}

function bubble_pos_prev(currx, space) { return "calc(" + currx + "% - " + (bubble_width_base * space) + "%)"; }
function bubble_pos_next(currx, space) { return "calc(" + currx + "% + " + (bubble_width_base * space) + "%)"; }

function finish_bubble_shift()
{
	UpdateBubbleImages();

	bubble_spare.e_root.style.opacity = "0%";
	set_bubble_pos(bubble_spare.e_root, bspare_posx_base + "%", "50%");
	bubble_transform(bubble_spare.e_root, bspare_scale_base);

	set_bubble_pos(bubble_prev.e_root, bprev_posx_base + "%", "50%");
	set_bubble_pos(bubble_curr.e_root, bcurr_posx_base + "%", "50%");
	set_bubble_pos(bubble_next.e_root, bnext_posx_base + "%", "50%");

	bubble_prev.e_root.style.opacity = Math.max(0.0, bprev_alpha_base) + "%";
	bubble_curr.e_root.style.opacity = Math.max(0.0, bcurr_alpha_base) + "%";
	bubble_next.e_root.style.opacity = Math.max(0.0, bnext_alpha_base) + "%";

	bubble_transform(bubble_prev.e_root, bprev_scale_base);
	bubble_transform(bubble_curr.e_root, bcurr_scale_base);
	bubble_transform(bubble_next.e_root, bnext_scale_base);

	clearInterval(interval_bubble_shift);
	interval_bubble_shift = null;

	playanim_jiggle_things(false, true);
	can_bubbles_move = true;
}

function lerp_bubble_shift(tanim)
{
	set_bubble_pos(bubble_spare.e_root, lerp(bspare_posx_base, bspare_posx_target, tanim) + "%", "50%");
	set_bubble_pos(bubble_prev.e_root, lerp(bprev_posx_base, bprev_posx_target, tanim) + "%", "50%");
	set_bubble_pos(bubble_curr.e_root, lerp(bcurr_posx_base, bcurr_posx_target, tanim) + "%", "50%");
	set_bubble_pos(bubble_next.e_root, lerp(bnext_posx_base, bnext_posx_target, tanim) + "%", "50%");

	bubble_spare.e_root.style.opacity = lerp(bspare_alpha_base, bspare_alpha_target, tanim) + "%";
	bubble_transform(bubble_spare.e_root, lerp(bspare_scale_base, bspare_scale_target, tanim));

	bubble_prev.e_root.style.opacity = Math.max(0.0, lerp(bprev_alpha_base, bprev_alpha_target, tanim)) + "%";
	bubble_transform(bubble_prev.e_root, lerp(bprev_scale_base, bprev_scale_target, tanim));

	bubble_curr.e_root.style.opacity = Math.max(0.0, lerp(bcurr_alpha_base, bcurr_alpha_target, tanim)) + "%";
	bubble_transform(bubble_curr.e_root, lerp(bcurr_scale_base, bcurr_scale_target, tanim));

	bubble_next.e_root.style.opacity = Math.max(0.0, lerp(bnext_alpha_base, bnext_alpha_target, tanim)) + "%";
	bubble_transform(bubble_next.e_root, lerp(bnext_scale_base, bnext_scale_target, tanim));
}

function bubble_transform(e, scale)
{
	e.style.transform = "translate(-50%,-50%) scale(" + scale + "%)";
}

function lerp(x, y, t) { return lerpunclamped(x, y, saturate(t)); }
function lerpunclamped(x, y, t) { return x + (y - x) * t; }
function saturate(x) { return Math.max(0.0, Math.min(1.0, x)); }

function lerp_pos(e, x, y, t)
{
	e.left = lerp(e.left, x, t);
	e.top = lerp(e.top, y, t);
}

function wrap_id(i, count)
{
	if (count < 1) return -1;
	while (i >= count) i -= count;
	while (i < 0) i += count;
	return i;
}

function id_offset_wrapped(a, b, count)
{
	var d0 = b - a;
	var d1 = wrap_id(b + count / 2, count) - a;
	if (Math.abs(d1) > Math.abs(d0)) return d0;
	return d1;
}



///jiggle things start

function playanim_jiggle_things(doScale, doRotate)
{
	if (interval_jiggle_things) clearInterval(interval_jiggle_things);

	jiggle_things_scale = doScale;
	jiggle_things_rotate = doRotate;

	t_anim_jiggle_things = 0.0;
	jiggle_things_seeds = [0.2, 0.0, 0.2];
	interval_jiggle_things = setInterval(step_jiggle_things, 20);
}

var t_anim_jiggle_things;
var jiggle_things_scale;
var jiggle_things_rotate;
var interval_jiggle_things;
var animspeed_jiggle_things = 1.0;
var animtargets_jiggle_things;
var jiggle_things_seeds;
function step_jiggle_things()
{
	const dt = 0.02;
	animtargets_jiggle_things = [bubble_prev.e_img, bubble_curr.e_img, bubble_next.e_img];
	t_anim_jiggle_things += animspeed_jiggle_things * dt;

	if (t_anim_jiggle_things >= 1.0)
	{
		clearInterval(interval_jiggle_things);
		interval_jiggle_things = null;
		return;
	}

	var animtime = t_anim_jiggle_things * 3.0;
	var animstr = 1.0 - t_anim_jiggle_things;
	for (var x = 0; x < animtargets_jiggle_things.length; x++)
	{
		var xj = get_jiggle_tilt(jiggle_things_seeds[x], animtime, animstr);
		var xr = "0.0deg";
		var xs = "1.0";
		if (jiggle_things_rotate) xr = xj * 0.7 + "deg";
		if (jiggle_things_scale) xs = (xj * 0.02 + 1.0) + "";
		set_rotate_scale(animtargets_jiggle_things[x], xr, xs);
	}
}

function get_jiggle_tilt(offset, animtime, animstr)
{
	return -Math.cos((animtime + offset) * 6.28318) * animstr * animstr;
}

function animfinish_jiggle_things()
{
	animtargets_jiggle_things.forEach(e => set_rotate_scale(e, "0deg", "1.0"));
}

function set_rotate_scale(e, r, s)
{
	e.style.rotate = r;
	e.style.scale = s;
}

///jiggle things end






// bubble expand start
var is_preview_bubble_showing;
var e_preview_bubble;
var e_preview_bubble_img;

var is_preview_bubble_transitioning;
var preview_bubble_src_a;
var preview_bubble_src_b;

function create_preview_bubble()
{
	e_preview_bubble = document.createElement("div");
	e_preview_bubble.id = "preview-bubble";
	e_preview_bubble.className = "preview-bubble-root";
	e_preview_bubble.style.display = "none";
	e_preview_bubble.style.backdropFilter = "blur(6px) contrast(1%)";
	e_preview_bubble.addEventListener("click", hide_preview_bubble);
	e_coll_cntnr.appendChild(e_preview_bubble);
	e_preview_bubble.style.zIndex = 35;

	e_preview_bubble_img = document.createElement("img");
	e_preview_bubble_img.id = "preview-bubble-img";
	e_preview_bubble_img.className = "gallery-bubble-image";
	e_preview_bubble_img.src = str_default_img_src;
	e_preview_bubble.appendChild(e_preview_bubble_img);
}

function show_preview_bubble()
{
	if (is_preview_bubble_showing) return;
	if (animJob_preview_reveal && animJob_preview_reveal.is_running()) return;
	is_preview_bubble_showing = true;
	var isrc = get_bubble_img_src(bubbleid1);

	e_preview_bubble_img.src = isrc;
	e_preview_bubble.style.position = "absolute";
	e_preview_bubble.style.left = "50%";
	e_preview_bubble.style.top = "50%";
	e_preview_bubble.style.width = bubble_curr.e_root.style.width;
	e_preview_bubble.style.transform = bubble_curr.e_root.style.transform;
	e_preview_bubble.style.maxWidth = "min(90vw,90vh)";
	e_preview_bubble.style.maxHeight = "min(90vw,90vh)";

	e_preview_bubble_img.style = bubble_curr.e_img.style;
	e_preview_bubble_img.style.objectFit = "contain";

	playanim_preview_bubble_reveal(1.0);
}

function hide_preview_bubble()
{
	if (!is_preview_bubble_showing) return;
	if (animJob_preview_reveal && animJob_preview_reveal.is_running()) return;
	is_preview_bubble_showing = false;
	playanim_preview_bubble_reveal(0.0);
}

var animJob_preview_reveal;
var target_preview_reveal;
var animspeed_preview_reveal = 6.0;

function playanim_preview_bubble_reveal(targetVisibility)
{
	target_preview_reveal = targetVisibility;
	if (!animJob_preview_reveal)
	{
		update_preview_bubble(1.0 - targetVisibility);
		animJob_preview_reveal = new AnimJob(update_preview_bubble, animspeed_preview_reveal);
		animJob_preview_reveal.start();
	}
	else
	{
		if (animJob_preview_reveal.is_running()) return;
		update_preview_bubble(targetVisibility);
		animJob_preview_reveal.start();
	}
}

function update_preview_bubble(t)
{
	if (target_preview_reveal < 0.5) t = 1.0 - t;

	var talt = ease_in_out(Math.sqrt(t));
	t = ease_in_out(t);

	e_infobanner.style.opacity = 1.0 - t;

	e_preview_bubble.style.backdropFilter = "blur(" + (talt * 6) + "px) contrast(70%)";
	e_preview_bubble_img.style.opacity = (100.0 * talt) + "%";

	e_preview_bubble.style.borderRadius = lerp(50, 1, t) + "%";
	var w = lerp(bubble_width_base, 90, t);
	e_preview_bubble.style.width = "min(" + w + "vw," + w + "vh)";
	e_preview_bubble.style.transform = "translate(-50%,-50%) scale(100%)";

	if (t < 0.001) e_preview_bubble.style.display = "none";
	else e_preview_bubble.style.display = "block";
}


// bubble expand end






function onOutOfStockHelp(e)
{
	e.stopPropagation();
	window.alert("Sorry! This Item Is Currently Unavailable.\nThis could be due to any of many reasons including but not limited to:\n- material restriction\n- product discontinuation\n- lack of interest.");
}








//new ui end








var page_fade_val = 1.0;
var id_fade_out;
var id_fade_in;
function page_fade_start(next_page)
{
	clearInterval(id_fade_out);
	clearInterval(id_fade_in);

	//start fade out
	id_fade_out = setInterval(frame_fade_out, 15);

	function frame_fade_out()
	{
		if (page_fade_val > 0.0)
		{
			page_fade_val -= 0.05;
			e_content_body.style.opacity = page_fade_val;
		}
		else
		{
			//conclude fade out
			page_fade_val = 0.0;
			e_content_body.style.opacity = page_fade_val;
			clearInterval(id_fade_out);

			update_page_content(next_page);

			setTimeout(
				function ()
				{
					//start fade in
					id_fade_in = setInterval(frame_fade_in, 15);
				},
				400
			);
		}
	}

	function frame_fade_in()
	{
		if (page_fade_val < 1.0)
		{
			page_fade_val += 0.05;
			e_content_body.style.opacity = page_fade_val;
		}
		else
		{
			page_fade_val = 1.0;
			e_content_body.style.opacity = page_fade_val;
			clearInterval(id_fade_in);
			//conclude fade in
		}
	}
}



function parse_collections(list_text)
{
	collectionsList = JSON.parse(list_text);
	collections_loaded = true;
}



///OLD GALLERY STUFF

var e_colls_title = null;
var collection_choice_list = null;
var loaded_collection = null;
var e_collection_header = null;
var e_coll_subtitle = null;

function tryremove(e)
{
	if (e == null) return;
	e.remove();
}

function collections_cleanup()
{
	tryremove(loaded_collection);
	tryremove(e_collection_header);
	tryremove(e_coll_subtitle);
	tryremove(collection_choice_list);
	tryremove(e_colls_title);
}


function SelectCollection(id)
{
	current_collection_id = id;
	populate_collection_view();
}


function SelectImageGroup(id)
{
	var coll = collectionsList.collections[current_collection_id];
	var grp = coll.groups[id];
	if (id >= 0 && grp.images != null)
	{
		current_group_id = id;
		show_preview(0);
	}
	else
	{
		current_group_id = id;
		populate_collection_view();
	}
}

function collections_go_back()
{
	SelectImageGroup(-1);
	populate_collection_options();
}

function populate_collection_options()
{
	if (page_current != "journals") return;

	var e_coll_cntnr = document.getElementById("collection-container");

	current_group_id = -1;
	collections_cleanup();

	collection_choice_list = document.createElement("div");
	collection_choice_list.id = "collection-choices";
	collection_choice_list.className = "gallery-bubble-container";
	e_coll_cntnr.appendChild(collection_choice_list);

	for (ci = 0; ci < collectionsList.collections.length; ci++)
	{
		var coll = collectionsList.collections[ci];
		var e_choice_x = document.createElement("div");
		e_choice_x.className = "gallery-bubble-root";
		e_choice_x.setAttribute("onclick", "SelectCollection(" + ci + ")");

		if (coll.showcaseImageGroupIndex > -1 && coll.showcaseImageIndex > -1)
		{
			var e_choice_img = document.createElement("img");
			e_choice_img.className = "gallery-bubble-image";
			var showcase_grp = coll.groups[coll.showcaseImageGroupIndex];
			var showcase_imginfo = showcase_grp.images[coll.showcaseImageIndex];
			e_choice_img.src = showcase_imginfo.path;
			e_choice_x.appendChild(e_choice_img);
		}

		var e_choice_name = document.createElement("div");
		e_choice_name.className = "gallery-bubble-name";
		e_choice_name.innerHTML = coll.name;
		e_choice_x.appendChild(e_choice_name);

		if (coll.groups.length > 1)
		{
			var e_coll_count = document.createElement("div");
			e_coll_count.className = "gallery-bubble-count";
			e_coll_count.innerText = "+" + (coll.groups.length - 1);
			e_choice_x.appendChild(e_coll_count);
		}

		collection_choice_list.appendChild(e_choice_x);
	}
}

function populate_collection_view()
{
	if (page_current != "journals") return;
	if (!collections_loaded) return;

	collections_cleanup();

	var e_coll_cntnr = document.getElementById("collection-container");

	e_collection_header = document.createElement("div");
	e_collection_header.id = "collection-header";
	e_collection_header.className = e_collection_header.id;

	var e_coll_title_spacer = document.createElement("div");
	e_coll_title_spacer.className = "collection-header-spacer";
	e_collection_header.appendChild(e_coll_title_spacer);

	var e_back_btn = document.createElement("img");
	e_back_btn.className = "collection-back-button";
	e_back_btn.setAttribute("onclick", "collections_go_back()");
	e_back_btn.src = "/icon-go-back.png";
	e_collection_header.appendChild(e_back_btn);

	var e_coll_title = document.createElement("div");
	e_coll_title.id = "collection-title";
	e_coll_title.className = "collection-title";
	e_collection_header.appendChild(e_coll_title);

	e_coll_title_spacer = document.createElement("div");
	e_coll_title_spacer.className = "collection-header-spacer";
	e_collection_header.appendChild(e_coll_title_spacer);

	e_coll_cntnr.appendChild(e_collection_header);

	e_coll_subtitle = document.createElement("div");
	e_coll_subtitle.className = "collection-subtitle";
	e_coll_cntnr.appendChild(e_coll_subtitle);

	loaded_collection = document.createElement("div");
	loaded_collection.id = "collection-current";
	loaded_collection.className = loaded_collection.id;
	loaded_collection.innerHTML = "";
	e_coll_cntnr.appendChild(loaded_collection);

	var coll = collectionsList.collections[current_collection_id];
	if (coll != null) 
	{
		var isGroupSelected = current_group_id >= 0 && current_group_id < coll.groups.length;
		if (isGroupSelected && coll.groups[current_group_id].name != "Group")
			e_coll_subtitle.innerHTML = coll.groups[current_group_id].name;
		else tryremove(e_coll_subtitle);

		e_coll_title.innerText = coll.name;
		e_coll_title.style.display = "block";

		var e_coll_images = document.createElement("div");
		e_coll_images.id = "collection-image-groups";
		e_coll_images.className = "collection-image-group";

		var e_coll_desc_title = document.createElement("div");
		e_coll_desc_title.innerText = "About";
		e_coll_desc_title.className = "collection-section-title";

		var e_coll_description = document.createElement("div");
		e_coll_description.innerHTML = coll.desc;
		e_coll_description.className = "collection-desc";

		var e_coll_features_title = document.createElement("div");
		e_coll_features_title.innerText = "Features";
		e_coll_features_title.className = "collection-section-title";

		var e_coll_features = document.createElement("list");
		e_coll_features.className = "collection-feature-list";

		for (var fi = 0; fi < coll.features.length; fi++)
		{
			var e_this_feature = document.createElement("li");
			e_this_feature.innerHTML = coll.features[fi];
			e_this_feature.className = "collection-feature-listitem";
			e_coll_features.appendChild(e_this_feature);
		}

		if (current_group_id < 0) drawCollectionGroups(coll, e_coll_images);
		else drawGroup(coll, e_coll_images);
	}
	else // coll == null
	{
		e_coll_title.style.display = "none";
	}
	loaded_collection.appendChild(e_coll_images);
	loaded_collection.appendChild(e_coll_desc_title);
	loaded_collection.appendChild(e_coll_description);
	loaded_collection.appendChild(e_coll_features_title);
	loaded_collection.appendChild(e_coll_features);
}


function drawCollectionGroups(coll, e_coll_images)
{
	if (coll.groups == null) return;
	for (ii = 0; ii < coll.groups.length; ii += 1)
	{
		var group = coll.groups[ii];
		var image_info = group.images[0];

		var e_coll = document.createElement("div");
		e_coll.className = "gallery-bubble-root";

		var e_coll_image = document.createElement("img");
		e_coll_image.className = "gallery-bubble-image";
		e_coll_image.src = image_info.path;
		e_coll_image.title = image_info.path;
		e_coll_image.setAttribute("onclick", "SelectImageGroup(" + ii + ")");
		e_coll.appendChild(e_coll_image);

		var e_coll_label = document.createElement("div");
		e_coll_label.className = "gallery-bubble-name";
		if (group.name == "Group") e_coll_label.innerText = group.images[0].desc;
		else e_coll_label.innerText = group.name;
		e_coll.appendChild(e_coll_label);

		if (group.images.length > 1)
		{
			var e_coll_count = document.createElement("div");
			e_coll_count.className = "gallery-bubble-count";
			e_coll_count.innerText = "+" + (group.images.length - 1);
			e_coll.appendChild(e_coll_count);
		}

		e_coll_images.appendChild(e_coll);
	}
}


function drawGroup(coll, e_coll_images)
{
	if (coll.groups == null) return;

	var grp = coll.groups[current_group_id];
	if (grp == null) return;

	for (ii = 0; ii < grp.images.length; ii += 1)
	{
		var image_info = grp.images[ii];
		var e_coll_image = document.createElement("img");
		e_coll_image.className = "collection-image";
		e_coll_image.src = image_info.path;
		e_coll_image.title = image_info.path;
		e_coll_image.setAttribute("onclick", "show_preview(" + ii + ")");
		e_coll_images.appendChild(e_coll_image);
	}
}




///OLD PREVIEW STUFF


function hide_preview_nav() { hide_preview_nav_prev(); hide_preview_nav_next(); }
function show_preview_nav() { show_preview_nav_prev(); show_preview_nav_next(); }
function hide_preview_nav_prev() { e_nav_preview_prev.style.display = "none"; }
function hide_preview_nav_next() { e_nav_preview_next.style.display = "none"; }
function show_preview_nav_prev() { e_nav_preview_prev.style.display = "block"; }
function show_preview_nav_next() { e_nav_preview_next.style.display = "block"; }

var preview_collection_id = -1;
var preview_group_id = -1;
var preview_image_id = -1;

function previewPrev()
{
	begin_preview_anim(1);
	//show_preview(preview_image_id - 1);
}

function previewNext()
{
	begin_preview_anim(-1);
	//show_preview(preview_image_id + 1);
}

function show_preview(id)
{
	preview_collection_id = current_collection_id;
	preview_group_id = current_group_id;
	preview_image_id = id;
	var coll = collectionsList.collections[preview_collection_id];
	var grp = coll.groups[preview_group_id];
	var img = grp.images[preview_image_id];

	hide_preview_nav();

	if (grp.images.length > 1)
	{
		show_preview_nav_prev();
		show_preview_nav_next();
	}


	e_preview_img_prev.src = grp.images[getid(preview_image_id - 1, grp.images)].path;
	e_preview_img.src = img.path;
	e_preview_img_next.src = grp.images[getid(preview_image_id + 1, grp.images)].path;

	var titletext = coll.name;
	if (grp.name != "Group") titletext += " / " + grp.name;
	e_preview_title.innerHTML = titletext;
	e_preview_subtitle.innerHTML = img.desc;

	preview_scroll_phase = 0.0;
	update_preview_positions();

	e_preview_container.className = "preview-container";
}

function hide_preview()
{
	end_preview_anim();
	e_preview_container.className = "preview-container hidden";
	preview_collection_id = -1;
	preview_group_id = -1;
	preview_image_id = -1;
}


var interval_preview_anim = null;
var preview_scroll_phase = 0.0;
var preview_scroll_start = 0.0;
var preview_scroll_end = 0.0;

function begin_preview_anim(direction)
{
	if (Math.abs(direction) < 0.1) return;

	if (interval_preview_anim != null) return;//clearInterval(interval_preview_anim);
	preview_scroll_phase = 0.0;
	preview_scroll_start = 0.0;
	preview_scroll_end = direction;
	interval_preview_anim = setInterval(interval_step_preview_anim, 20);
}

function end_preview_anim()
{
	clearInterval(interval_preview_anim);
	interval_preview_anim = null;
}

function interval_step_preview_anim()
{
	const dt = 0.02;

	if (preview_scroll_phase < 1.0)
	{
		preview_scroll_phase += dt * 3.0;
		update_preview_positions();
	}
	else
	{
		var coll = collectionsList.collections[current_collection_id];
		var grp = coll.groups[current_group_id];
		if (grp != null)
		{
			var new_id = getid(Math.round(preview_image_id - preview_scroll_end), grp.images)
			show_preview(new_id);
		}
		preview_scroll_phase = 0.0;
		update_preview_positions();
		end_preview_anim();
	}
}

function update_preview_positions()
{
	var scrollpos = preview_scroll_start + (preview_scroll_end - preview_scroll_start) * preview_scroll_phase;
	var phase_prev = scrollpos - 1.0;
	var phase_curr = scrollpos;
	var phase_next = scrollpos + 1.0;

	get_preview_pos(phase_prev, e_preview_img_prev);
	get_preview_pos(phase_curr, e_preview_img);
	get_preview_pos(phase_next, e_preview_img_next);

	var max_w = Math.max(e_preview_img_prev.offsetWidth, e_preview_img.offsetWidth, e_preview_img_next.offsetWidth);
	var max_h = Math.max(e_preview_img_prev.offsetHeight, e_preview_img.offsetHeight, e_preview_img_next.offsetHeight);

	var nav_min_x = e_nav_preview_next.offsetWidth;
	var nav_max_x = screen_size_x - e_nav_preview_next.offsetWidth;

	e_nav_preview_prev.style.position = "absolute";
	e_nav_preview_prev.style.top = "50%";
	e_nav_preview_prev.style.left = Math.max(nav_min_x, screen_center_x - max_w * 0.5 - 64) + "px";
	e_nav_preview_prev.style.transform = "translate(-50%, -50%) scale(-1.0,1.0)";

	e_nav_preview_next.style.position = "absolute";
	e_nav_preview_next.style.top = "50%";
	e_nav_preview_next.style.left = Math.min(nav_max_x, screen_center_x + max_w * 0.5 + 64) + "px";

	e_preview_title.style.position = "absolute";
	e_preview_title.style.left = "0px";
	e_preview_title.style.top = (screen_center_y - max_h * 0.5 - 32) + "px";

	e_preview_subtitle.style.opacity = e_preview_img.style.opacity;
	e_preview_subtitle.style.position = "absolute";
	e_preview_subtitle.style.left = "0px";
	e_preview_subtitle.style.top = (screen_center_y + max_h * 0.5 + 12) + "px";
}

function get_preview_pos(phase, element)
{
	var prev_w = e_preview_img_prev.offsetWidth;
	var curr_w = e_preview_img.offsetWidth;
	var next_w = e_preview_img_next.offsetWidth;

	var curr_x = screen_center_x;
	var prev_x = curr_x - curr_w * 0.5 - prev_w * 0.5 - 42;
	var next_x = curr_x + curr_w * 0.5 + next_w * 0.5 + 42;

	var this_x = curr_x;

	if (phase < 0.0)
	{
		phase = Math.abs(phase);
		phase = saturate(phase);
		phase = ease_in_out(phase);
		this_x = curr_x + (prev_x - curr_x) * phase;
	}
	else 
	{
		phase = saturate(phase);
		phase = ease_in_out(phase);
		this_x = curr_x + (next_x - curr_x) * phase;
	}

	element.style.position = "absolute";
	element.style.transform = "translate(-50%,-50%)";
	element.style.opacity = Math.round((1.0 - Math.abs(phase)) * 100.0) + "%";
	element.style.top = screen_center_y + "px";
	element.style.left = this_x + "px";

	return this_x;
}



function saturate(x)
{
	x = Math.max(x, 0.0);
	x = Math.min(x, 1.0);
	return x;
}

function ease_in_out(x)
{
	if (x < 0.5) return 2.0 * x * x;
	return 1.0 - 2.0 * (x - 1.0) * (x - 1.0);
}

function getid(id, things)
{
	if (things == null) return -1;
	if (things.length < 1) return -1;
	if (things.length < 2) return 0;
	while (id < 0) id += things.length;
	while (id >= things.length) id -= things.length;
	return id;
}

function add_child(e, kind, className, innerHTML)
{
	var d = document.createElement(kind);
	d.className = className;
	d.innerHTML = innerHTML;
	e.appendChild(d);
	return d;
}