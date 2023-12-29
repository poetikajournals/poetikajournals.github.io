var page_current;

var e_content_body;
var e_intro_container;

var e_link_about;
var e_link_journals;
var e_link_faq;
var e_link_links;

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

var current_collection_id = 0;
var current_group_id = -1;


function when_body_load()
{
	e_content_body = document.getElementById("page-content-body");
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
}


var screen_size_x;
var screen_size_y;
var screen_center_x;
var screen_center_y;


function onwindowresize()
{
	screen_size_x = e_preview_container.offsetWidth;
	screen_size_y = e_preview_container.offsetHeight;
	screen_center_x = screen_size_x / 2.0;
	screen_center_y = screen_size_y / 2.0;

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

function onwheel(wheelEvent)
{
	onAnyScroll(wheelEvent.deltaX, wheelEvent.deltaY);
}

function onAnyScroll(delta_x, delta_y)
{
	if (Math.abs(delta_y) > Math.abs(delta_x)) delta_x = 0.0;
	else delta_y = 0.0;

	if (preview_image_id >= 0)
	{
		var coll = collectionsList.collections[preview_collection_id];
		var grp = coll.groups[preview_group_id];
		if (grp.images.length > 1)
		{
			if (delta_x > 0) begin_preview_anim(-1);
			else if (delta_x < 0) begin_preview_anim(1);
			else if (delta_y > 0) begin_preview_anim(-1);
			else if (delta_y < 0) begin_preview_anim(1);
		}
	}
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
					populate_collection_options();
				}
			}
		);
}

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
	if (current_group_id < 0) populate_collection_options(); else SelectImageGroup(-1);
}

function populate_collection_options()
{
	if (page_current != "journals") return;

	var e_coll_cntnr = document.getElementById("collection-container");

	current_group_id = -1;
	collections_cleanup();

	e_colls_title = document.createElement("div");
	e_colls_title.className = "collection-title";
	e_colls_title.style.margin = "0rem 0rem 1.5rem 0rem";
	e_colls_title.innerText = "";
	e_coll_cntnr.appendChild(e_colls_title);

	collection_choice_list = document.createElement("div");
	collection_choice_list.id = "collection-choices";
	collection_choice_list.className = "collection-choice-list";
	e_coll_cntnr.appendChild(collection_choice_list);

	for (ci = 0; ci < collectionsList.collections.length; ci++)
	{
		var coll = collectionsList.collections[ci];
		var e_choice_x = document.createElement("div");
		e_choice_x.className = "collection-choice";
		e_choice_x.setAttribute("onclick", "SelectCollection(" + ci + ")");

		if (coll.showcaseImageGroupIndex > -1 && coll.showcaseImageIndex > -1)
		{
			var e_choice_img = document.createElement("img");
			e_choice_img.className = "collection-choice-image";
			var showcase_grp = coll.groups[coll.showcaseImageGroupIndex];
			var showcase_imginfo = showcase_grp.images[coll.showcaseImageIndex];
			e_choice_img.src = showcase_imginfo.path;
			e_choice_x.appendChild(e_choice_img);
		}

		var e_choice_name = document.createElement("div");
		e_choice_name.className = "collection-choice-name";
		e_choice_name.innerHTML = coll.name;
		e_choice_x.appendChild(e_choice_name);

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

		var e_coll_images = document.createElement("div");
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
		e_coll.className = "collection-button";

		var e_coll_image = document.createElement("img");
		e_coll_image.className = "collection-image";
		e_coll_image.src = image_info.path;
		e_coll_image.title = image_info.path;
		e_coll_image.setAttribute("onclick", "SelectImageGroup(" + ii + ")");
		e_coll.appendChild(e_coll_image);

		var e_coll_label = document.createElement("div");
		e_coll_label.className = "collection-label";
		if (group.name == "Group") e_coll_label.innerText = group.images[0].desc;
		else e_coll_label.innerText = group.name;
		e_coll.appendChild(e_coll_label);

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