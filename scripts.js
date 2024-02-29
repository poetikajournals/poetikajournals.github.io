const str_default_img_src = "/images/icon-more.png";
const rgx_gallery = /(\d+)\/(\d+)/g;

var collectionServer = new JournalCollectionServer();
var view = new ViewData();
var input = new InputManager();

var vertical_layout = false;

var e_body_background;
var e_page_container;
var e_content_body;
var e_intro_container;

var page_current;
var e_link_active;
var e_link_about;
var e_link_journals;
var e_link_faq;
var e_link_links;

var e_infobanner;
var e_infobanner_title;
var e_infobanner_subtitle;
var e_infobanner_etsy_button;
var e_splash_title;

var e_coll_cntnr;
var e_bubble_group_root = null;

var e_lbl_debug;

function when_body_load()
{
	collect_element_references();

	e_lbl_debug = add_child(document.body, "div", "debug-label", "");

	collectionServer.load();

	try_load_user_params();
	fetch_search_params();

	view.onwindowresize();

	input = new InputManager();
	input.enable_input_check = can_receive_input;
	input.RegisterInputHandlers();

	set_page(page_current, true);
}


function fetch_search_params()
{
	var searchParams = new URLSearchParams(window.location.search);
	for (const [key, val] of searchParams)
	{
		switch (key)
		{
			case "gallery":
				if (val.includes("/"))
				{
					var rgxmatch = val.match(rgx_gallery);
					if (!rgxmatch || rgxmatch.length < 1) break;
					var matchval = rgxmatch[0];

					var match_parts = matchval.split("/");
					var ida = match_parts[0];
					var idb = match_parts[1];
					collectionServer.selection[0] = ida;
					bubble_view_id_coll = ida;
					bubble_view_id_group = idb;
					console.log("=> " + ida + " :: " + idb);
				}
				else
				{
					bubble_view_id_coll = val;
					console.log("=> " + val);
				}
				break;
		}
	}
}

function try_load_user_params()
{
	if (!localStorage) return;

	load_gallery_selection();

	var last_page = localStorage.getItem("page");
	page_current = (last_page == null) ? "welcome" : last_page;
}

function load_gallery_selection()
{
	if (!localStorage) return;
	var prev_selection = localStorage.getItem("gallery-selection");
	if (!prev_selection) return;
	collectionServer.selection = prev_selection;
	console.log("gallery selection loaded from localStorage");
}

function save_gallery_selection()
{
	if (!localStorage) return;
	localStorage.setItem("gallery-selection", collectionServer.selection);
}

function collect_element_references()
{
	e_content_body = document.getElementById("page-content-body");
	e_page_container = document.getElementById("page-container");
	e_body_background = document.getElementById("body-background");
	e_intro_container = document.getElementById("intro");

	e_link_highlight = document.getElementById("titlelink-highlighter");
	e_link_about = document.getElementById("titlelink-about");
	e_link_journals = document.getElementById("titlelink-journals");
	e_link_faq = document.getElementById("titlelink-faq");
	e_link_links = document.getElementById("titlelink-links");
}

function move_title_link_highlight(e)
{
	//e_link_highlight.style.top = e.offsetTop + "px";
	e_link_highlight.style.left = e.offsetLeft + "px";
	e_link_highlight.style.width = e.offsetWidth + "px";
	//e_link_highlight.style.height = e.offsetHeight + "px";
}

function can_receive_input()
{
	if (!can_bubbles_shift) return false;
	if (animJob_bubble_shift && animJob_bubble_shift.is_running()) return false;
	if (animJob_bubbles_show && animJob_bubbles_show.is_running()) return false;
	if (animJob_preview_reveal && animJob_preview_reveal.is_running()) return false;
	return true;
}

function navigate_l() { if (vertical_layout) try_bubbles_back(); else OnBubblesPrev(); }
function navigate_r() { if (vertical_layout) try_bubbles_select(); else OnBubblesNext(); }
function navigate_d() { if (vertical_layout) OnBubblesNext(); else try_bubbles_back(); }
function navigate_u() { if (vertical_layout) OnBubblesPrev(); else try_bubbles_select(); }
function try_bubbles_select() { if (is_preview_bubble_showing) hide_preview_bubble(); else OnBubblesSelect(); }
function try_bubbles_back() { if (is_preview_bubble_showing) hide_preview_bubble(); else OnBubblesBack(); }

function set_page_instant(page_name)
{
	page_current = page_name;
	update_page_title_link(page_name);
	update_page_content(page_name);
	localStorage.setItem("page", page_name);
}

function set_page(page_name, force)
{
	if (!force && (!input || !input.is_input_enabled)) 
	{
		console.log(`page change refused : [input ${input.is_input_enabled}] : [pause : ${InputManager.is_input_paused}]`);
		return;
	}

	page_current = page_name;
	update_page_title_link(page_name);
	page_fade_start(page_name);
	if (localStorage) localStorage.setItem("page", page_name);
}

function HoverTitleLink(e)
{
	move_title_link_highlight(e);
	e_link_highlight.style.boxShadow = "inset 0 0 10vw 2.5vw #ffffffc0";
}
function LeaveTitleLink(e)
{
	move_title_link_highlight(e_link_active);
	e_link_highlight.style.boxShadow = "none";
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

	switch (page_name)
	{
		case "about": e_link_active = e_link_about; break;
		case "journals": e_link_active = e_link_journals; break;
		case "links": e_link_active = e_link_links; break;
		case "faq": e_link_active = e_link_faq; break;
	}

	e_link_active.className = "title-link title-link-current";
	move_title_link_highlight(e_link_active);
}

async function update_page_content(page_name)
{
	await fetch("/" + page_name + ".html")
		.then(x => x.text())
		.then(x => set_page_content_data(page_name, x));
}

function set_page_content_data(page_name, x)
{
	e_content_body.innerHTML = x;
	if (page_name === "journals") create_bubbles();
}

{ // page fading
	var animJob_page_fade = null;
	var reverse_page_fade = false;
	var page_fade_next = "welcome";

	function page_fade_start(next_page)
	{
		if (animJob_page_fade && animJob_page_fade.is_running()) return;
		if (!animJob_page_fade) animJob_page_fade = new AnimJob(step_page_fade_anim, 2.0);
		animJob_page_fade.afterFx = fade_back_in;
		page_fade_next = next_page;
		reverse_page_fade = false;
		input.Pause();
		animJob_page_fade.start();

		function fade_back_in()
		{
			update_page_content(page_fade_next);
			if (animJob_page_fade && animJob_page_fade.is_running()) return;
			if (!animJob_page_fade) animJob_page_fade = new AnimJob(step_page_fade_anim, 2.0);
			animJob_page_fade.afterFx = () => input.Resume();
			reverse_page_fade = true;
			animJob_page_fade.start();
		}

		function step_page_fade_anim(tanim)
		{
			if (reverse_page_fade) tanim = 1.0 - tanim;
			e_content_body.style.opacity = 1.0 - tanim;
		}
	}
}

{ // collection helpers
	function get_collection(id)
	{
		return collectionServer.dataBlock.collections[id];
	}

	function get_bubble_label(id)
	{
		if (collectionServer.selection[0] < 0)
		{
			if (!collectionServer.dataBlock.collections[id]) return "NULL BUBBLE LABEL";
			return collectionServer.dataBlock.collections[id].name;
		}
		var c = collectionServer.dataBlock.collections[collectionServer.selection[0]];
		if (!c) return "UNKNOWN DESC : NO COLL";
		if (collectionServer.selection[1] < 0) return c.groups[id].name;
		var g = c.groups[collectionServer.selection[1]];
		if (!g) return "UNKNOWN DESC : NO GRP";
		if (!g.images[id]) return "UNKNOWN DESC : NO IMG";
		return g.images[id].name;
	}

	function is_bubble_container(id)
	{
		if (collectionServer.selection[0] < 0) return true;
		var c = collectionServer.dataBlock.collections[collectionServer.selection[0]];
		if (!c) return false;
		if (collectionServer.selection[1] < 0) return c.groups[id].images.length > 1;
		return false;
	}

	function get_bubble_img_src(id)
	{
		var coll = collectionServer.dataBlock.collections[id];
		if (collectionServer.selection[0] < 0) return get_coll_img_src(coll);
		coll = collectionServer.dataBlock.collections[collectionServer.selection[0]];

		var grp = coll.groups[id];
		if (collectionServer.selection[1] < 0) return get_grp_img_src(grp);
		grp = coll.groups[collectionServer.selection[1]];

		if (!grp.images[id]) return coll.groups[collectionServer.selection[1]].images[0].path;
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
}

{ // bubble view vars

	var bubble_view_id = 0;
	var bubble_view_id_coll = 0;
	var bubble_view_id_group = 0;
	var bubble_view_id_image = 0;

	var bubbleid0;
	var bubbleid1;
	var bubbleid2;

	var bubble_spare = {};
	var bubble_prev = {};
	var bubble_curr = {};
	var bubble_next = {};

	var e_bubbles_back;
	var bubble_count_max;
	var bubble_width_base = 64;

	{ // bubble anim vars
		var b_posy_base = 50;
		var b_posy_raised = 48;

		var bx_l = 0;
		var bx_0 = 20;
		var bx_1 = 50;
		var bx_2 = 80;
		var bx_r = 100;

		var bs_s = 30;
		var bs_m = 70;
		var bs_b = 100;

		var ba_z = -10;
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

		var animJob_bubble_shift = null;
	}
	var can_bubbles_shift = true;
	var showing_bubble_moreinfo;
	var timeout_bubble_move;
}

{ // bubble creation

	function create_bubbles()
	{
		e_coll_cntnr = document.getElementById("collection-container");

		e_coll_cntnr.style.overflow = "hidden";

		e_bubble_group_root = document.createElement("div");
		e_bubble_group_root.id = "collection-choices";
		e_bubble_group_root.className = "gallery-bubble-container";
		e_coll_cntnr.appendChild(e_bubble_group_root);

		create_banners();

		e_bubbles_back = document.createElement("div");
		e_bubbles_back.id = "bubbles-back";
		e_bubbles_back.className = "bubbles-back";
		e_bubbles_back.innerText = "BACK";
		e_bubbles_back.title = "Go Back ( Escape )";
		e_bubbles_back.addEventListener("click", OnBubblesBack);

		update_bubble_ids();

		bubble_prev = create_bubble_from_id(bubbleid0, false);
		bubble_curr = create_bubble_from_id(bubbleid1, true);
		bubble_next = create_bubble_from_id(bubbleid2, false);

		bubble_spare = create_bubble_from_id(bubbleid1, false);
		bubble_spare.e_root.style.pointerEvents = "none";
		bubble_spare.e_root.style.opacity = "0%";

		bubble_prev.e_root.addEventListener("click", OnBubblesPrev);
		bubble_curr.e_root.addEventListener("click", OnBubblesSelect);
		bubble_next.e_root.addEventListener("click", OnBubblesNext);

		e_coll_cntnr.appendChild(e_bubbles_back);

		create_preview_bubble();

		FadeBubblesIn();
	}

	function create_bubble_from_id(i, is_main_bubble)
	{
		var b = new GalleryBubble(i, get_bubble_label(i), get_bubble_img_src(i), is_main_bubble);
		e_bubble_group_root.appendChild(b.e_root);
		return b;
	}
}

{ // bubbles in / out transition
	var animJob_bubbles_show = null;
	var anim_speed_bubble_visibility = 3.0;
	var bubbles_show_direction = 1;
	var bubbles_show_side = 1;

	function FadeBubblesIn()
	{
		if (animJob_bubbles_show && animJob_bubbles_show.is_running()) return;
		if (!animJob_bubbles_show) animJob_bubbles_show = new AnimJob(update_bubbles_visibility, anim_speed_bubble_visibility);
		animJob_bubbles_show.afterFx = () => playanim_jiggle_things(true, false);

		update_bubble_ids();
		UpdateBubbleData();
		bubbles_show_direction = 1;
		animJob_bubbles_show.start();
	}

	function FadeBubblesOutIn()
	{
		if (animJob_bubbles_show && animJob_bubbles_show.is_running()) return;

		if (!animJob_bubbles_show) animJob_bubbles_show = new AnimJob(update_bubbles_visibility, anim_speed_bubble_visibility);
		animJob_bubbles_show.afterFx = FadeBubblesIn;
		bubbles_show_direction = -1;
		animJob_bubbles_show.start();
	}

	function update_bubbles_visibility(t)
	{
		var tval = t;
		if (bubbles_show_direction < 0) tval = 1.0 - tval;
		var tval0 = saturate(tval * 1.25);
		var tval1 = saturate(tval);
		var tval2 = tval0;

		var yt = 1.0 - tval0;
		yt = bubbles_show_side * bubbles_show_direction * yt * yt;
		var y0 = b_posy_base - yt * 50.0;
		var y1 = b_posy_base - yt * 60.0;
		var y2 = b_posy_base - yt * 50.0;

		bubble_prev.set_position(bx_0 + "%", y0 + "%");
		bubble_curr.set_position(bx_1 + "%", y1 + "%");
		bubble_next.set_position(bx_2 + "%", y2 + "%");

		bubble_prev.e_root.style.opacity = (ba_h * Math.pow(tval0, 2)) + "%";
		bubble_curr.e_root.style.opacity = (ba_f * Math.pow(tval1, 2)) + "%";
		bubble_next.e_root.style.opacity = (ba_h * Math.pow(tval2, 2)) + "%";

		bubble_prev.set_transform((lerp(bs_m / 2, bs_m, tval0)));
		bubble_curr.set_transform((lerp(bs_b / 2, bs_b, tval1)));
		bubble_next.set_transform((lerp(bs_m / 2, bs_m, tval2)));
	}
}

{ // bubble data management
	function update_bubble_ids()
	{
		if (page_current != "journals") return;

		bubble_view_id = GetBubbleViewIndex();

		if (collectionServer.selection[0] < 0) bubble_count_max = collectionServer.dataBlock.collections.length;
		else if (collectionServer.selection[1] < 0) bubble_count_max = collectionServer.dataBlock.collections[collectionServer.selection[0]].groups.length;
		else bubble_count_max = collectionServer.dataBlock.collections[collectionServer.selection[0]].groups[collectionServer.selection[1]].images.length;

		bubble_view_id = wrap_id(bubble_view_id, bubble_count_max);
		bubbleid0 = wrap_id(bubble_view_id - 1, bubble_count_max);
		bubbleid1 = wrap_id(bubble_view_id, bubble_count_max);
		bubbleid2 = wrap_id(bubble_view_id + 1, bubble_count_max);

		refresh_banners();
	}

	function UpdateSpareBubbleData(delta)
	{
		var spareBubbleId = bubble_view_id - delta;
		spareBubbleId = wrap_id(spareBubbleId, bubble_count_max);
		bubble_spare.update_id(spareBubbleId);
	}

	function UpdateBubbleData()
	{
		bubble_prev.update_id(bubbleid0);
		bubble_curr.update_id(bubbleid1);
		bubble_next.update_id(bubbleid2);
		bubble_prev.e_root.style.zIndex = get_bubble_zindex(bx_0);
		bubble_curr.e_root.style.zIndex = get_bubble_zindex(bx_1);
		bubble_next.e_root.style.zIndex = get_bubble_zindex(bx_2);
	}

	function UpdateBubbleImage(img, id)
	{
		if (!img) return;
		img.src = get_bubble_img_src(id);
	}
}

{ // bubble navigation

	function OnBubblesBack()
	{
		if (!can_bubbles_shift) return;
		if (!collectionServer.deselect_one_level()) return;
		HideBubbleBannerMoreInfo();
		bubbles_show_side = 1;
		FadeBubblesOutIn();
	}

	function OnBubblesSelect()
	{
		if (!can_bubbles_shift) return;
		HideBubbleBannerMoreInfo();

		if (!collectionServer.is_collection_selected()) // top level
		{
			collectionServer.try_select(bubble_view_id);
			bubble_view_id_group = 0;
			bubble_view_id_image = 0;
		}
		else if (!collectionServer.is_group_selected()) // inside collection
		{
			var c = collectionServer.selected_collection();
			var content_count = c.groups[bubble_view_id].images.length;
			var only_one_content = content_count < 2;
			if (only_one_content)
			{
				collectionServer.try_select(bubble_view_id);
				show_preview_bubble();
				collectionServer.deselect_one_level();
				return;
			}
			else
			{
				collectionServer.try_select(bubble_view_id);
				bubble_view_id_image = 0;
			}
		}
		else // inside group
		{
			show_preview_bubble();
			return;
		}

		bubbles_show_side = -1;
		FadeBubblesOutIn();
	}

	function OnBubblesPrev()
	{
		if (!can_bubbles_shift) return;
		can_bubbles_shift = false;

		if (is_preview_bubble_showing)
		{
			switch_preview_id(-1);
			return;
		}

		timeout_bubble_move = ModViewBubble(-1);
	}

	function OnBubblesNext()
	{
		if (!can_bubbles_shift) return;
		can_bubbles_shift = false;

		if (is_preview_bubble_showing)
		{
			switch_preview_id(1);
			return;
		}

		timeout_bubble_move = ModViewBubble(1);
	}

	function ModViewBubble(delta)
	{
		HideBubbleBannerMoreInfo();//collapse current bubble banner
		SetBubbleViewIndex(GetBubbleViewIndex() + delta);
		update_bubble_ids();
		if (Math.abs(delta) > 0) anim_bubble_shift(-delta);
		else finish_bubble_shift();
		timeout_bubble_move = null;
	}

	function switch_preview_id(delta)
	{
		hide_preview_bubble();
		if (!timeout_bubble_move) timeout_bubble_move = setTimeout(() => ModViewBubble(delta), 300);
	}

	function GetBubbleViewIndex()
	{
		if (!collectionServer.is_collection_selected()) return bubble_view_id_coll;
		if (!collectionServer.is_group_selected()) return bubble_view_id_group;
		else return bubble_view_id_image;
	}

	function SetBubbleViewIndex(id)
	{
		if (!collectionServer.is_collection_selected()) bubble_view_id_coll = id;
		if (!collectionServer.is_group_selected()) bubble_view_id_group = id;
		else bubble_view_id_image = id;
	}
}

{ // banners
	function create_banners()
	{
		e_splash_title = add_child(e_coll_cntnr, "div", "splash-title");
		e_splash_title.innerText = "";

		e_infobanner = add_child(e_coll_cntnr, "div", "infobanner backdrop-obscure");

		e_infobanner_title = add_child(e_infobanner, "div", "infobanner-text");
		e_infobanner_title.innerText = "COLLECTIONS";

		e_infobanner_subtitle = add_child(e_infobanner, "div", "infobanner-subtext");
		e_infobanner_subtitle.innerText = "( OUT OF STOCK )";

		e_infobanner_etsy_button = add_child(e_infobanner, "div", "infobanner-etsy-button");
		e_infobanner_etsy_button.innerText = "SHOP ON ETSY";
		e_infobanner_etsy_button.style.display = "none";
	}

	function refresh_banners()
	{
		e_infobanner.style.bottom = vertical_layout ? "12vh" : "10vh";
		e_infobanner.style.height = vertical_layout ? "9rem" : "7rem";

		if (collectionServer.is_collection_selected())
		{
			var coll = collectionServer.selected_collection();
			e_bubbles_back.style.opacity = "100%";
			e_bubbles_back.style.pointerEvents = "all";
			e_splash_title.innerText = coll.name;
			e_splash_title.style.opacity = "100%";
			e_splash_title.style.filter = "blur(3px)";

			var no_etsy = coll.etsyUrl === "";

			e_infobanner_subtitle.style.display = no_etsy ? "block" : "none";
			e_infobanner_etsy_button.style.display = no_etsy ? "none" : "block";
			e_infobanner_etsy_button.innerText = `SHOP ${coll.name.toUpperCase()} ON ETSY`;
			e_infobanner_etsy_button.setAttribute("onclick", `open('${coll.etsyUrl}','EtsyProductPage','noreferrer,noopener')`);

			if (collectionServer.is_group_selected())
			{
				var currgroup = collectionServer.selected_group();
				e_infobanner_title.innerText = coll.name.toUpperCase() + " / " + currgroup.name.toUpperCase();
				e_bubbles_back.innerText = "BACK TO " + coll.name.toUpperCase();
				return;
			}

			e_infobanner_title.innerText = "THE " + coll.name.toUpperCase() + " COLLECTION";
			e_bubbles_back.innerText = "BACK TO COLLECTIONS";
			return;
		}

		e_bubbles_back.style.opacity = "0%";
		e_bubbles_back.style.pointerEvents = "none";
		e_splash_title.style.opacity = "0%";
		e_splash_title.style.filter = "blur(12px)";
		e_infobanner_title.innerText = "COLLECTIONS";
		e_infobanner_subtitle.style.display = "none";
		e_infobanner_etsy_button.style.display = "none";
	}

	function onOutOfStockHelp(e)
	{
		e.stopPropagation();
		window.alert("Sorry! This Item Is Currently Unavailable.\nThis could be due to any of many reasons including but not limited to:\n- material restriction\n- product discontinuation\n- lack of interest.");
	}
}

{ // bubble banners
	function refresh_bubble_corner_banner(b, id)
	{
		var collid = -1;
		if (collectionServer.selection[0] < 0) collid = id;
		else collid = collectionServer.selection[0];

		var coll = collectionServer.dataBlock.collections[collid];
		if (coll.etsyUrl === "") b.e_banner_corner.style.display = "block";
		else b.e_banner_corner.style.display = "none";
	}

	function HideBubbleBannerMoreInfo(e)
	{
		if (!showing_bubble_moreinfo) return;
		if (e && e.stopPropagation) e.stopPropagation();
		showing_bubble_moreinfo = false;
		bubble_curr.set_banner_expansion_phase(0);
	}

	function OnBubbleBannerMoreInfo(e)
	{
		if (e && e.stopPropagation) e.stopPropagation();

		showing_bubble_moreinfo = !showing_bubble_moreinfo;
		if (showing_bubble_moreinfo) bubble_curr.set_banner_expansion_phase(1);
		else bubble_curr.set_banner_expansion_phase(0);
	}
}

{ // bubble shift
	var bubble_shift_delta_active;
	function anim_bubble_shift(delta)
	{
		bubble_shift_delta_active = delta;
		if (animJob_bubble_shift && animJob_bubble_shift.is_running()) return;
		if (!animJob_bubble_shift) animJob_bubble_shift = new AnimJob(lerp_bubble_shift, 3.5);
		set_bubble_targets(delta);
		UpdateSpareBubbleData(delta);
		animJob_bubble_shift.afterFx = finish_bubble_shift;
		animJob_bubble_shift.start();
	}

	function set_bubble_targets(delta)
	{
		bx_0 = view.bubble_pos_0;
		bx_2 = view.bubble_pos_2;

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

	function get_bubble_zindex(xpos)
	{
		return Math.round(5.0 + 15.0 * (1.0 - Math.abs(xpos - 50.0) / 50.0));
	}

	function lerp_bubble_shift(tanim)
	{
		var xpos_spare = lerp(bspare_posx_base, bspare_posx_target, tanim);
		var xpos_prev = lerp(bprev_posx_base, bprev_posx_target, tanim);
		var xpos_curr = lerp(bcurr_posx_base, bcurr_posx_target, tanim);
		var xpos_next = lerp(bnext_posx_base, bnext_posx_target, tanim);

		var z_spare = get_bubble_zindex(xpos_spare);
		var z_prev = get_bubble_zindex(xpos_prev);
		var z_curr = get_bubble_zindex(xpos_curr);
		var z_next = get_bubble_zindex(xpos_next);

		bubble_spare.e_root.style.zIndex = z_spare;
		bubble_prev.e_root.style.zIndex = z_prev;
		bubble_curr.e_root.style.zIndex = z_curr;
		bubble_next.e_root.style.zIndex = z_next;

		//print_bubble_positions(xpos_prev, xpos_curr, xpos_next, z_prev, z_curr, z_next);

		bubble_spare.set_position(xpos_spare + "%", "50%");
		bubble_prev.set_position(xpos_prev + "%", "50%");
		bubble_curr.set_position(xpos_curr + "%", "50%");
		bubble_next.set_position(xpos_next + "%", "50%");

		//var rot = (1.0 - Math.abs(tanim - 0.5)) * 60.0;
		bubble_spare.set_transform(lerp(bspare_scale_base, bspare_scale_target, tanim), 0);
		bubble_prev.set_transform(lerp(bprev_scale_base, bprev_scale_target, tanim), 0);
		bubble_curr.set_transform(lerp(bcurr_scale_base, bcurr_scale_target, tanim), 0);
		bubble_next.set_transform(lerp(bnext_scale_base, bnext_scale_target, tanim), 0);

		bubble_spare.e_root.style.opacity = Math.max(0.0, lerp(bspare_alpha_base, bspare_alpha_target, tanim)) + "%";
		bubble_prev.e_root.style.opacity = Math.max(0.0, lerp(bprev_alpha_base, bprev_alpha_target, tanim)) + "%";
		bubble_curr.e_root.style.opacity = Math.max(0.0, lerp(bcurr_alpha_base, bcurr_alpha_target, tanim)) + "%";
		bubble_next.e_root.style.opacity = Math.max(0.0, lerp(bnext_alpha_base, bnext_alpha_target, tanim)) + "%";
	}

	function print_bubble_positions(xpos0, xpos1, xpos2, z0, z1, z2)
	{
		xpos0 = Math.round(xpos0);
		xpos1 = Math.round(xpos1);
		xpos2 = Math.round(xpos2);
		z0 = Math.round(z0);
		z1 = Math.round(z1);
		z2 = Math.round(z2);
		e_lbl_debug.innerText = `[PREVX: ${xpos0}][CURRX: ${xpos1}][NEXTX: ${xpos2}]`;
		e_lbl_debug.innerText += `\n`;
		e_lbl_debug.innerText += `[PREVZ: ${z0}][CURRZ: ${z1}][NEXTZ: ${z2}]`;
	}

	function finish_bubble_shift()
	{
		UpdateBubbleData();

		var z_spare = get_bubble_zindex(bspare_posx_base);
		var z_prev = get_bubble_zindex(bprev_posx_base);
		var z_curr = get_bubble_zindex(bcurr_posx_base);
		var z_next = get_bubble_zindex(bnext_posx_base);
		//print_bubble_positions(bprev_posx_base, bcurr_posx_base, bnext_posx_base, z_prev, z_curr, z_next);

		bubble_spare.e_root.style.zIndex = z_spare;
		bubble_prev.e_root.style.zIndex = z_prev;
		bubble_curr.e_root.style.zIndex = z_curr;
		bubble_next.e_root.style.zIndex = z_next;

		bubble_spare.e_root.style.opacity = "0%";
		bubble_spare.set_position(bspare_posx_base + "%", "50%");
		bubble_spare.set_transform(bspare_scale_base);

		bubble_prev.set_position(bprev_posx_base + "%", "50%");
		bubble_curr.set_position(bcurr_posx_base + "%", "50%");
		bubble_next.set_position(bnext_posx_base + "%", "50%");

		bubble_prev.e_root.style.opacity = Math.max(0.0, bprev_alpha_base) + "%";
		bubble_curr.e_root.style.opacity = Math.max(0.0, bcurr_alpha_base) + "%";
		bubble_next.e_root.style.opacity = Math.max(0.0, bnext_alpha_base) + "%";

		bubble_prev.set_transform(bprev_scale_base);
		bubble_curr.set_transform(bcurr_scale_base);
		bubble_next.set_transform(bnext_scale_base);

		playanim_jiggle_things(false, true);
		can_bubbles_shift = true;
	}
}

{ // jiggle things
	var animJob_jiggle_things;
	var jiggle_things_scale;
	var jiggle_things_rotate;
	var animspeed_jiggle_things = 1.0;
	var animtargets_jiggle_things;
	var jiggle_things_seeds;

	function playanim_jiggle_things(doScale, doRotate)
	{
		jiggle_things_scale = doScale;
		jiggle_things_rotate = doRotate;
		jiggle_things_seeds = [0.2, 0.0, 0.2];
		animtargets_jiggle_things = [bubble_prev.e_img, bubble_curr.e_img, bubble_next.e_img];

		if (!animJob_jiggle_things)
		{
			animJob_jiggle_things = new AnimJob(update_jiggle_positions, animspeed_jiggle_things);
			animJob_jiggle_things.interruptible = true;
			animJob_jiggle_things.easing = false;
		}
		animJob_jiggle_things.start();
	}

	function update_jiggle_positions(t)
	{
		var animtime = t * 3.0;
		var animstr = 1.0 - t;
		for (var x = 0; x < animtargets_jiggle_things.length; x++)
		{
			var xj = Math.sin((animtime + jiggle_things_seeds[x]) * 6.28318) * animstr * animstr;
			var xr = "0.0deg";
			var xs = "1.0";
			if (jiggle_things_rotate) xr = xj * 0.7 + "deg";
			if (jiggle_things_scale) xs = (xj * 0.015 + 1.015) + "";
			set_rotate_scale(animtargets_jiggle_things[x], xr, xs);
		}
	}
}

{ // preview bubble
	var e_preview_bubble;
	var e_preview_bubble_img;
	var is_preview_bubble_showing;
	var is_preview_bubble_transitioning;

	var animJob_preview_reveal;
	var animspeed_preview_reveal = 3.0;
	var target_preview_reveal;

	function create_preview_bubble()
	{
		e_preview_bubble = document.createElement("div");
		e_preview_bubble.id = "preview-bubble";
		e_preview_bubble.className = "preview-bubble-root backdrop-obscure";
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

		e_preview_bubble.style.backdropFilter = "blur(" + (t * 6) + "px) contrast(70%)";
		e_preview_bubble_img.style.opacity = (100.0 * t) + "%";

		e_preview_bubble.style.borderRadius = lerp(50, 1, t) + "%";
		var w = lerp(bubble_width_base, 90, t);
		e_preview_bubble.style.width = `min(${w}vw,${w}vh)`;
		e_preview_bubble.style.transform = "translate(-50%,-50%) scale(100%)";

		if (t < 0.001) e_preview_bubble.style.display = "none";
		else e_preview_bubble.style.display = "block";
	}
}

{ // helper methods

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

	function lerp(x, y, t) { return lerpunclamped(x, y, saturate(t)); }
	function lerpunclamped(x, y, t) { return x + (y - x) * t; }
	function saturate(x) { return Math.max(0.0, Math.min(1.0, x)); }

	function lerp_pos(e, x, y, t)
	{
		e.left = lerp(e.left, x, t);
		e.top = lerp(e.top, y, t);
	}

	function set_rotate_scale(e, r, s)
	{
		e.style.rotate = r;
		e.style.scale = s;
	}

	function ease_in_out(x)
	{
		if (x < 0.5) return 2.0 * x * x;
		return 1.0 - 2.0 * (x - 1.0) * (x - 1.0);
	}

	function calculateDistance(e, mx, my)
	{
		var cx = e.offsetLeft + e.offsetWidth / 2;
		var cy = e.offsetTop + e.offsetHeight / 2;
		var xo = cx - mx;
		var yo = cy - my;
		return Math.sqrt(xo * xo + yo * yo);
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
		if (className) d.className = className;
		if (innerHTML) d.innerHTML = innerHTML;
		e.appendChild(d);
		return d;
	}

	function tryremove(e)
	{
		if (e == null) return;
		e.remove();
	}

	function inside_rect(x, y, rect)
	{
		if (x < rect.left) return false;
		if (x > (rect.left + rect.width)) return false;
		if (y < rect.top) return false;
		if (y > (rect.top + rect.height)) return false;
		return true;
	}

}
