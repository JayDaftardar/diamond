import pytest

from app.services.embeds import validate_presentation_url

SLIDES = "https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOp"


@pytest.mark.parametrize(
    ("raw", "expected", "provider"),
    [
        (f"{SLIDES}/edit?usp=sharing", f"{SLIDES}/embed", "google_slides"),
        (f"{SLIDES}/pub?start=false", f"{SLIDES}/embed", "google_slides"),
        (
            "https://docs.google.com/presentation/d/e/2PACX-1vAbCdEfGhIj/pub?start=true",
            "https://docs.google.com/presentation/d/e/2PACX-1vAbCdEfGhIj/embed",
            "google_slides",
        ),
        (
            "https://onedrive.live.com/embed?resid=ABC%21123&authkey=xyz&em=2",
            "https://onedrive.live.com/embed?resid=ABC%21123&authkey=xyz&em=2",
            "onedrive",
        ),
        (
            "https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fa.pptx",
            "https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fa.pptx",
            "office_online",
        ),
    ],
)
def test_accepts_and_normalises_allowed_links(raw, expected, provider):
    assert validate_presentation_url(raw) == (expected, provider)


@pytest.mark.parametrize(
    "raw",
    [
        "",
        "not a url",
        f"{SLIDES}/edit".replace("https", "http"),  # not https
        "https://docs.google.com.evil.example/presentation/d/1AbCdEfGhIjKlMnOp/embed",
        "https://evil.example/docs.google.com/presentation/d/1AbCdEfGhIjKlMnOp",
        "https://user:pw@docs.google.com/presentation/d/1AbCdEfGhIjKlMnOp/edit",
        "https://docs.google.com:8443/presentation/d/1AbCdEfGhIjKlMnOp/edit",
        "https://docs.google.com/document/d/1AbCdEfGhIjKlMnOp/edit",  # not Slides
        "https://1drv.ms/p/s!AbCdEf",  # sharing link, not embed
        "https://onedrive.live.com/view.aspx?resid=1",
        "https://view.officeapps.live.com/op/embed.aspx?src=http://insecure.example/a.pptx",
        "javascript:alert(1)",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ],
)
def test_rejects_everything_else(raw):
    with pytest.raises(ValueError):
        validate_presentation_url(raw)
