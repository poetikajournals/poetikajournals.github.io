var page_current;

var e_content_body;
var e_link_about;
var e_link_journals;
var e_link_faq;
var e_link_links;

var page_url;

var collections_dir;
var collections = [];
var collections_loaded = false;
var id_collections_load;
var current_collection_id = 0;


function when_body_load()
{
	e_content_body = document.getElementById("page-content-body");
	e_link_about = document.getElementById("titlelink-about");
	e_link_journals = document.getElementById("titlelink-journals");
	e_link_faq = document.getElementById("titlelink-faq");
	e_link_links = document.getElementById("titlelink-links");

	page_url = new URL(window.location.toLocaleString());
	var page_url_params = page_url.searchParams;
	if (page_url_params.has("page"))
	{
		page_fade_val = 0.0;
		var target_page = page_url_params.get("page");
		set_page_instant(target_page);
	}
	else
	{
		set_page_instant("about");
	}

	collections_loaded = false;
	queue_collection_load();
	fetch("collections/list.txt")
		.then(x => x.text())
		.then(x => parse_collections(x));

}


function set_page_instant(page_name)
{
	page_current = page_name;
	window.history.pushState('', '', "?page=" + page_name);
	update_page_title_link(page_name);
	update_page_content(page_name);
}

function set_page(page_name)
{
	page_current = page_name;
	window.history.pushState('', '', "?page=" + page_name);
	update_page_title_link(page_name);
	page_fade_start(page_name);
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
	e_content_body.data = page_name + '.html';
	if (page_name === "journals")
	{
		e_content_body.onload = () => populate_collection(current_collection_id);
	}
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

			//start fade in
			id_fade_in = setInterval(frame_fade_in, 15);
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
	var list_lines = list_text.split("\n");

	collections = [];
	var current_collection = [];
	var ii = 0;
	var parse_step = -1;
	while (ii < list_lines.length)
	{
		var this_line = list_lines[ii].trim();
		ii += 1;
		if (parse_step === -1)
		{
			if (this_line === "") continue;
			if (this_line === "[Title]") parse_step = 0;
		}
		else
		{
			if (parse_step === 0)//title
			{
				if (this_line === "[Description]")
				{
					parse_step = 1;
					current_collection['description'] = "";
				}
				else current_collection['title'] = this_line;
			}
			else if (parse_step === 1)//description
			{
				if (this_line === "[Tags]")
				{
					parse_step = 2;
					current_collection['tags'] = "";
				}
				else
				{
					if (this_line.slice(0, 4) === "<div") current_collection['description'] += this_line;
					else current_collection['description'] += this_line + "<br>";
				}
			}
			else if (parse_step === 2)//tags
			{
				if (this_line === "[Images]")
				{
					parse_step = 3;
					current_collection['images'] = [];
				}
				else current_collection['tags'] += this_line + ";";
			}
			else if (parse_step === 3)//images
			{
				if (this_line === "[Title]") 
				{
					collections.push(current_collection);
					current_collection = [];
					parse_step = 0;
				}
				else if (this_line === "") continue;
				else current_collection['images'].push(this_line);
			}
		}
	}
	collections.push(current_collection);
	current_collection = [];
	collections_loaded = true;
}


function queue_collection_load()
{
	if (!collections_loaded)
		id_collections_load = setInterval(check_collections_loaded, 200);
}

function check_collections_loaded()
{
	console.log("checking collections...");
	if (collections_loaded === true)
	{
		clearInterval(id_collections_load);
		console.log("...collections loaded");
		populate_collection(current_collection_id);
	}
}

function populate_collection(collection_id)
{
	if (page_current != "journals") return;

	e_content_body.contentDocument.body.innerHTML = "";
	var coll = collections[collection_id];

	var e_coll_container = document.createElement("div");
	e_coll_container.className = "collection-container";

	var e_coll_images = document.createElement("div");
	e_coll_images.className = "collection-image-group";

	var e_coll_title = document.createElement("div");
	e_coll_title.innerHTML = coll['title'];
	e_coll_title.className = "collection-title";

	var e_coll_description = document.createElement("div");
	e_coll_description.innerHTML = coll['description'];
	e_coll_description.className = "collection-desc";

	for (ii = 0; ii < coll['images'].length; ii += 1)
	{
		var image_path = coll['images'][ii];
		var e_coll_image = document.createElement("img");
		e_coll_image.className = "collection-image";
		e_coll_image.src = image_path;
		e_coll_images.appendChild(e_coll_image);
	}

	e_coll_container.appendChild(e_coll_title);
	e_coll_container.appendChild(e_coll_images);
	e_coll_container.appendChild(e_coll_description);
	e_content_body.contentDocument.body.appendChild(e_coll_container);

	e_content_body.onload = null;
}