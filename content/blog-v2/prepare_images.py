#!/usr/bin/env python3
"""Downloads the blog images listed in images.json, keeps only free licenses,
crops banners to 2:1 with ffmpeg, uploads everything to the site's /media and
writes media.json ({key: {url, credit_pt, credit_en, banner_pt, banner_en}})."""
import json, os, re, subprocess, sys, urllib.parse, urllib.request
from html import unescape

HERE = os.path.dirname(os.path.abspath(__file__))
API = "https://novo.rickmff.com/api/content"
TOKEN = os.environ.get("PORTFOLIO_TOKEN") or open(os.path.expanduser("~/.config/portfolio/token")).read().strip()
UA = {"User-Agent": "rickmff-portfolio-blog/1.0 (rickmff@gmail.com)"}
FREE = re.compile(r"^(public domain|pd|cc0|cc[ -]by)", re.I)
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)


def get(url, raw=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        data = r.read()
    return data if raw else json.loads(data)


def strip(html):
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", "", html or ""))).strip()


def wiki_image(title, width):
    s = get("https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title.replace(" ", "_"), safe=""))
    src = (s.get("originalimage") or {}).get("source")
    if not src:
        raise RuntimeError("no lead image")
    name = urllib.parse.unquote(src.split("/")[-1])
    host = "commons.wikimedia.org" if "/wikipedia/commons/" in src else "en.wikipedia.org"
    q = urllib.parse.urlencode({"action": "query", "titles": "File:" + name, "prop": "imageinfo",
                                "iiprop": "url|extmetadata", "iiurlwidth": width, "format": "json"})
    page = next(iter(get(f"https://{host}/w/api.php?{q}")["query"]["pages"].values()))
    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})
    lic = strip(meta.get("LicenseShortName", {}).get("value"))
    if not FREE.match(lic) or "non-free" in lic.lower() or "fair use" in lic.lower():
        raise RuntimeError(f"license not free: {lic!r}")
    artist = strip(meta.get("Artist", {}).get("value"))[:80]
    return info.get("thumburl") or info["url"], lic, artist, info["descriptionurl"]


def upload(path, mime):
    out = subprocess.run(["curl", "-s", "-H", f"Authorization: Bearer {TOKEN}", "-F", f"file=@{path};type={mime}", f"{API}/media"],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)["url"]


def save(url, key):
    ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower() or ".png"
    path = os.path.join(OUT, key + ext)
    open(path, "wb").write(get(url, raw=True))
    return path


def mime(path):
    return {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif"}.get(os.path.splitext(path)[1].lower(), "image/png")


def lic_pt(lic):
    return "Domínio público" if lic.lower().startswith("public domain") else lic


def main():
    cfg = json.load(open(os.path.join(HERE, "images.json")))
    result, problems = {}, []
    for key, spec in cfg["banners"].items():
        k = "banner-" + key
        try:
            url, lic, artist, desc = wiki_image(spec["wiki"], 2600)
            src = save(url, k + "-src")
            dst = os.path.join(OUT, k + ".jpg")
            y = spec.get("y", 0.5)
            vf = (f"crop='if(gt(iw/ih,2),ih*2,iw)':'if(gt(iw/ih,2),ih,iw/2)':'(iw-ow)/2':'(ih-oh)*{y}',scale=2000:1000")
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-vf", vf, "-q:v", "3", dst], check=True)
            result[k] = {"url": upload(dst, "image/jpeg"),
                         "banner_pt": f"{lic_pt(lic)}, [Wikimedia Commons]({desc}).",
                         "banner_en": f"{lic}, [Wikimedia Commons]({desc}).", "source": desc}
        except Exception as e:
            problems.append(f"{k}: {e}")
    for key, spec in cfg["images"].items():
        try:
            if "file" in spec:
                path = os.path.join(HERE, spec["file"])
                result[key] = {"url": upload(path, mime(path))}
            elif "url" in spec:
                path = save(spec["url"], key)
                result[key] = {"url": upload(path, mime(path)), "source": spec["url"]}
            else:
                url, lic, artist, desc = wiki_image(spec["wiki"], 1600)
                path = save(url, key)
                who = f"{artist}, " if artist else ""
                result[key] = {"url": upload(path, mime(path)),
                               "credit_pt": f"Imagem: {who}{lic_pt(lic)}, Wikimedia Commons",
                               "credit_en": f"Image: {who}{lic}, Wikimedia Commons", "source": desc}
        except Exception as e:
            problems.append(f"{key}: {e}")
    json.dump(result, open(os.path.join(HERE, "media.json"), "w"), ensure_ascii=False, indent=1)
    print(json.dumps(result, ensure_ascii=False, indent=1))
    print("PROBLEMS:", *problems or ["none"], sep="\n- ")


if __name__ == "__main__":
    sys.exit(main())
