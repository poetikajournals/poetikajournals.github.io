var page_current;

var e_content_body;
var e_intro_container;

var e_link_about;
var e_link_journals;
var e_link_faq;
var e_link_links;

var e_preview_container;
var e_preview_title;
var e_preview_subtitle;
var e_preview_img;

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
	e_preview_img = document.getElementById("preview-image");
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
	if (id >= 0 && grp.images != null && grp.images.length < 2)
	{
		current_group_id = id;
		show_preview(0);
		current_group_id = -1;
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
		var e_coll_image = document.createElement("img");
		e_coll_image.className = "collection-image";
		e_coll_image.src = image_info.path;
		e_coll_image.title = image_info.path;
		e_coll_image.setAttribute("onclick", "SelectImageGroup(" + ii + ")");
		e_coll_images.appendChild(e_coll_image);
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
	show_preview(preview_image_id - 1);
}

function previewNext()
{
	show_preview(preview_image_id + 1);
}

function hide_preview()
{
	preview_collection_id = -1;
	preview_group_id = -1;
	preview_image_id = -1;
	e_preview_container.className = "preview-container hidden";
}

function show_preview(id)
{
	preview_collection_id = current_collection_id;
	preview_group_id = current_group_id;
	preview_image_id = id;
	var coll = collectionsList.collections[current_collection_id];
	var grp = coll.groups[current_group_id];
	var img = grp.images[id];

	hide_preview_nav();
	if (id > 0) 
	{
		show_preview_nav_prev();
	}
	if (id < (grp.images.length - 1)) 
	{
		show_preview_nav_next();
	}

	e_preview_container.className = "preview-container";
	e_preview_img.src = img.path;
	var titletext = coll.name;
	if (grp.name != "Group") titletext += " / " + grp.name;
	e_preview_title.innerHTML = titletext;
	e_preview_subtitle.innerHTML = img.desc;
}