import pytest

from app.services.sanitize import clean_html
from app.services.youtube import extract_video_id

VID = "dQw4w9WgXcQ"


@pytest.mark.parametrize(
    "url",
    [
        f"https://www.youtube.com/watch?v={VID}",
        f"https://youtube.com/watch?v={VID}&t=30s&list=PL123",
        f"http://m.youtube.com/watch?v={VID}",
        f"https://youtu.be/{VID}",
        f"https://youtu.be/{VID}?si=abc",
        f"https://www.youtube.com/embed/{VID}",
        f"https://www.youtube-nocookie.com/embed/{VID}",
        f"https://www.youtube.com/shorts/{VID}",
        f"https://www.youtube.com/live/{VID}?feature=share",
        f"  https://youtu.be/{VID}  ",
    ],
)
def test_youtube_links_give_the_bare_id(url):
    assert extract_video_id(url) == VID


@pytest.mark.parametrize(
    "url",
    [
        "",
        VID,  # a bare id is not a link
        "https://vimeo.com/123456789",
        f"https://youtube.com.evil.example/watch?v={VID}",
        f"https://evil.example/watch?v={VID}",
        "https://www.youtube.com/playlist?list=PL1234567890A",
        "https://www.youtube.com/watch?v=short",
        "https://www.youtube.com/watch?v=" + "a" * 12,
        "https://www.youtube.com/watch?v=<script>alert(1)",
        f"javascript:alert('{VID}')",
        f"ftp://youtu.be/{VID}",
    ],
)
def test_other_links_are_rejected(url):
    with pytest.raises(ValueError):
        extract_video_id(url)


def test_sanitizer_keeps_editor_formatting():
    html = (
        "<h2>Heading</h2><p>Some <strong>bold</strong> and <em>italic</em></p><ul><li>one</li></ul>"
    )
    assert clean_html(html) == html


@pytest.mark.parametrize(
    "payload",
    [
        "<script>alert(1)</script>x",
        "<img src=x onerror=alert(1)>x",
        '<a href="javascript:alert(1)">x</a>',
        '<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>',
        '<p style="background:url(javascript:alert(1))">x</p>',
        "<iframe src='https://evil.example'></iframe>x",
        "<svg onload=alert(1)>x</svg>",
        "<form action='https://evil.example'><input></form>x",
        "<style>body{display:none}</style>x",
    ],
)
def test_sanitizer_removes_active_content(payload):
    out = clean_html(payload) or ""
    for bad in (
        "script",
        "onerror",
        "javascript:",
        "data:",
        "style",
        "iframe",
        "svg",
        "onload",
        "<form",
        "<input",
    ):
        assert bad not in out.lower()


def test_empty_markup_becomes_none_so_an_empty_editor_saves_as_no_text():
    for empty in (None, "", "   ", "<p></p>", "<p>&nbsp;</p>", "<p><br></p>", "<script>x</script>"):
        assert clean_html(empty) is None
