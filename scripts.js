var page_current;

var e_content_body;
var e_link_about;
var e_link_journals;
var e_link_faq;
var e_link_links;

var page_content_about = "Hello!<br><br>Thank you for visiting my little corner of the web. I am a self-taught bookbinder creating uniquely made, hand-bound journals for your creative needs. I remember writing in diaries since I was a little girl- concealing my deepest thoughts and emotions between the furtive borders of a journal.To write is to self-analyze; to gain an awareness through the act of translating the subconscious into words only our truest self can understand; to remember that which we are afraid to forget; to express the darkness with which we only dance in the dark.<br><br>Needless to say, bookbinding became an integral part of my life's journey, forever committed to the art of perpetual creation. The provision of hand-bound journals to kindred creative spirits, dreamers, and fervently poetic souls alike is nothing short of a dream fulfilled. My purpose in crafting these journals is to bestow upon you a momentary respite, an inexhaustible source of inspiration to document what words may fail to convey openly, or to illustrate the vivid tapestry of emotion that resides within. Whether it's writing lists, poetry, quotes close to your heart, drawings, or random musings, I hope my hand-bound notebooks offer you a sense of lightness and relief from the sometimes overwhelming feelings of our external world. I appreciate you taking the time to look around my store.<br><br>With love and gratitude,<br>always,<br>Allyssa"


function set_page( page_name )
{
	e_content_body = document.getElementById("page-content-body");
	e_link_about = document.getElementById("titlelink-about");
	e_link_journals = document.getElementById("titlelink-journals");
	e_link_faq = document.getElementById("titlelink-faq");
	e_link_links = document.getElementById("titlelink-links");

	page_current = page_name;

	e_link_about.className = "title-link";
	e_link_journals.className = "title-link";
	e_link_faq.className = "title-link";
	e_link_links.className = "title-link";

	page_fade_start(page_name);
}

function set_page_content( page_name )
{
	e_content_body.innerHTML = "";

	if ( page_name == "about")	
	{
		e_link_about.className = "title-link title-link-current";
		e_content_body.innerHTML = page_content_about;
	}
	else if ( page_name == "journals")	
	{
		e_link_journals.className = "title-link title-link-current";
		e_content_body.innerHTML = "";
	}
	else if ( page_name == "links")	
	{
		e_link_links.className = "title-link title-link-current";
		e_content_body.innerHTML = "";
	}
	else if ( page_name == "faq")	
	{
		e_link_faq.className = "title-link title-link-current";
		e_content_body.innerHTML = "";
	}
}


var page_fade_val = 1.0;
var id_fade_out;
var id_fade_in;
function page_fade_start( next_page )
{
	page_fade_val = 1.0;

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

			set_page_content( next_page );

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