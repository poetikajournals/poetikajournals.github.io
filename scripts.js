var page_current;

var e_content_body;
var e_link_about;
var e_link_journals;
var e_link_faq;
var e_link_links;

var page_url;


function when_body_load()
{
	e_content_body = document.getElementById("page-content-body");
	e_link_about = document.getElementById("titlelink-about");
	e_link_journals = document.getElementById("titlelink-journals");
	e_link_faq = document.getElementById("titlelink-faq");
	e_link_links = document.getElementById("titlelink-links");

	page_url = new URL(window.location.toLocaleString());
	var page_url_params = page_url.searchParams;
	if(page_url_params.has("page"))
	{
		page_fade_val = 0.0;
		var target_page = page_url_params.get("page");
		set_page_instant(target_page);
	}
	else
	{
		set_page_instant("about");
	}
}


function set_page_instant( page_name )
{
	page_current = page_name;
    window.history.pushState('', '', "?page=" + page_name); 
	update_page_title_link( page_name );
	update_page_content( page_name );
}


function set_page( page_name )
{
	page_current = page_name;
    window.history.pushState('', '', "?page=" + page_name); 
	update_page_title_link( page_name );
	page_fade_start( page_name );
}

function reset_page_title_links()
{
	e_link_about.className = "title-link";
	e_link_journals.className = "title-link";
	e_link_faq.className = "title-link";
	e_link_links.className = "title-link";
}

function update_page_title_link( page_name )
{
	reset_page_title_links();
	if ( page_name == "about") e_link_about.className = "title-link title-link-current";
	else if ( page_name == "journals") e_link_journals.className = "title-link title-link-current";
	else if ( page_name == "links") e_link_links.className = "title-link title-link-current";
	else if ( page_name == "faq") e_link_faq.className = "title-link title-link-current";
}

function update_page_content( page_name )
{
	e_content_body.data = page_name + '.html';
}


var page_fade_val = 1.0;
var id_fade_out;
var id_fade_in;
function page_fade_start( next_page )
{
	clearInterval( id_fade_out );
	clearInterval( id_fade_in );

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
			clearInterval( id_fade_out );

			update_page_content( next_page );

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
			clearInterval( id_fade_in );
			//conclude fade in
		}
	}
}