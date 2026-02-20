from __future__ import annotations

import json
import os
import re
import shutil
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

KITS_ROOT      = Path(os.environ.get("KITS_ROOT", "/var/codex/kits"))
PUBLISHED_ROOT = Path(os.environ.get("PUBLISHED_ROOT", "/var/codex/published"))

# Required file checks
_REQUIRED = [
    "campaign-kit/landing/index.html",
    "campaign-kit/seo/meta.json",
    "campaign-kit/seo/jsonld.json",
    "campaign-kit/manifest.json",
]
_MIN_BANNERS  = 6
_MIN_EMAIL    = 2
_MIN_EDITORIAL = 2


def _slugify(text: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", text.lower().strip())
    return text.strip("-")[:64] or "kit"


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _manifest_path(kit_path: Path) -> Path:
    return kit_path / "_codex_manifest.json"


def _load_manifest(kit_path: Path) -> dict | None:
    p = _manifest_path(kit_path)
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text())
    except Exception:
        return None


# ── Validation ────────────────────────────────────────────────────────────────

def _validate(extract_path: Path) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    for req in _REQUIRED:
        if not (extract_path / req).exists():
            errors.append(f"Missing required file: {req}")

    banners = list((extract_path / "campaign-kit" / "banners").glob("*")) \
        if (extract_path / "campaign-kit" / "banners").is_dir() else []
    if len(banners) < _MIN_BANNERS:
        errors.append(f"banners/: need {_MIN_BANNERS} files, found {len(banners)}")

    email_dir = extract_path / "campaign-kit" / "email"
    emails = list(email_dir.glob("*")) if email_dir.is_dir() else []
    if len(emails) < _MIN_EMAIL:
        errors.append(f"email/: need {_MIN_EMAIL} files, found {len(emails)}")

    ed_dir = extract_path / "campaign-kit" / "editorial"
    eds = list(ed_dir.glob("*.md")) if ed_dir.is_dir() else []
    if len(eds) < _MIN_EDITORIAL:
        errors.append(f"editorial/: need {_MIN_EDITORIAL} markdown files, found {len(eds)}")

    if (extract_path / "campaign-kit" / "assets").is_dir():
        asset_count = len(list((extract_path / "campaign-kit" / "assets").iterdir()))
        if asset_count == 0:
            warnings.append("assets/ directory is empty")
    else:
        warnings.append("assets/ directory not found")

    return {
        "passed": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "banner_count": len(banners),
        "email_count": len(emails),
        "editorial_count": len(eds),
    }


# ── Import ────────────────────────────────────────────────────────────────────

def import_kit(zip_bytes: bytes, filename: str) -> dict:
    kit_id   = str(uuid.uuid4())
    ts       = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    # Read slug from embedded manifest.json or derive from filename
    slug = _slugify(Path(filename).stem.replace("campaign-kit", "").strip("-_") or "kit")

    # Write zip to temp, extract
    kit_dir = KITS_ROOT / slug / ts
    kit_dir.mkdir(parents=True, exist_ok=True)
    extract_dir = kit_dir / "source"
    extract_dir.mkdir(exist_ok=True)

    zip_path = kit_dir / "upload.zip"
    zip_path.write_bytes(zip_bytes)

    try:
        with zipfile.ZipFile(zip_path) as zf:
            # Security: strip any absolute or traversal paths
            for member in zf.infolist():
                target = extract_dir / member.filename
                if not str(target.resolve()).startswith(str(extract_dir.resolve())):
                    continue
                zf.extract(member, extract_dir)
    except zipfile.BadZipFile as exc:
        shutil.rmtree(kit_dir, ignore_errors=True)
        raise ValueError(f"Invalid zip file: {exc}") from exc

    # Try to read slug from embedded manifest
    emb = extract_dir / "campaign-kit" / "manifest.json"
    if emb.exists():
        try:
            emb_data = json.loads(emb.read_text())
            if emb_data.get("slug"):
                slug = _slugify(str(emb_data["slug"]))
        except Exception:
            pass

    validation = _validate(extract_dir)

    manifest = {
        "id":            kit_id,
        "slug":          slug,
        "timestamp":     ts,
        "filename":      filename,
        "status":        "imported",
        "kit_path":      str(kit_dir),
        "extract_path":  str(extract_dir),
        "published_path": str(PUBLISHED_ROOT / slug),
        "validation":    validation,
        "imported_at":   _utcnow(),
        "published_at":  None,
    }
    _manifest_path(kit_dir).write_text(json.dumps(manifest, indent=2))
    return manifest


# ── List / Get ────────────────────────────────────────────────────────────────

def list_kits() -> list[dict]:
    kits = []
    if not KITS_ROOT.exists():
        return kits
    for slug_dir in sorted(KITS_ROOT.iterdir()):
        if not slug_dir.is_dir():
            continue
        for ts_dir in sorted(slug_dir.iterdir(), reverse=True):
            m = _load_manifest(ts_dir)
            if m:
                kits.append(m)
                break  # latest only per slug
    return kits


def get_kit(kit_id: str) -> dict | None:
    if not KITS_ROOT.exists():
        return None
    for slug_dir in KITS_ROOT.iterdir():
        if not slug_dir.is_dir():
            continue
        for ts_dir in slug_dir.iterdir():
            m = _load_manifest(ts_dir)
            if m and m.get("id") == kit_id:
                return m
    return None


# ── Publish ───────────────────────────────────────────────────────────────────

def publish_kit(kit_id: str) -> dict:
    kit = get_kit(kit_id)
    if not kit:
        raise KeyError(f"Kit {kit_id} not found")

    extract_dir  = Path(kit["extract_path"])
    kit_src      = extract_dir / "campaign-kit"
    pub_dir      = PUBLISHED_ROOT / kit["slug"]

    if pub_dir.exists():
        shutil.rmtree(pub_dir)
    pub_dir.mkdir(parents=True)

    # Copy landing
    landing_src = kit_src / "landing"
    if landing_src.is_dir():
        shutil.copytree(landing_src, pub_dir, dirs_exist_ok=True)

    # Copy banners
    banners_src = kit_src / "banners"
    if banners_src.is_dir():
        shutil.copytree(banners_src, pub_dir / "banners", dirs_exist_ok=True)
        _write_banner_index(pub_dir / "banners", kit["slug"])

    # Copy email modules
    email_src = kit_src / "email"
    if email_src.is_dir():
        shutil.copytree(email_src, pub_dir / "email", dirs_exist_ok=True)
        _write_email_index(pub_dir / "email", kit["slug"])

    # Render editorial markdown → HTML
    ed_src = kit_src / "editorial"
    ed_pub = pub_dir / "editorial"
    if ed_src.is_dir():
        ed_pub.mkdir(exist_ok=True)
        for md_file in ed_src.glob("*.md"):
            _render_markdown(md_file, ed_pub / (md_file.stem + ".html"), kit)
        # Convenience aliases
        _alias(ed_pub, "press-release.html",      pub_dir / "press-release")
        _alias(ed_pub, "sponsored-article.html",  pub_dir / "sponsored-article")

    # Copy assets
    assets_src = kit_src / "assets"
    if assets_src.is_dir():
        shutil.copytree(assets_src, pub_dir / "assets", dirs_exist_ok=True)

    # Copy SEO files
    seo_src = kit_src / "seo"
    if seo_src.is_dir():
        shutil.copytree(seo_src, pub_dir / "seo", dirs_exist_ok=True)

    # Update manifest
    kit_dir = Path(kit["kit_path"])
    kit["status"]       = "published"
    kit["published_at"] = _utcnow()
    kit["published_path"] = str(pub_dir)
    _manifest_path(kit_dir).write_text(json.dumps(kit, indent=2))
    return kit


# ── Render helpers ────────────────────────────────────────────────────────────

def _render_markdown(md_path: Path, out_path: Path, kit: dict) -> None:
    text = md_path.read_text(errors="replace")
    # Strip YAML frontmatter
    fm: dict = {}
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            fm_text = text[3:end]
            for line in fm_text.splitlines():
                if ":" in line:
                    k, _, v = line.partition(":")
                    fm[k.strip()] = v.strip()
            text = text[end + 4:].lstrip()

    try:
        import markdown as md_lib  # type: ignore
        body_html = md_lib.markdown(text, extensions=["tables", "fenced_code"])
    except ImportError:
        # Fallback: wrap in <pre> if markdown not installed
        body_html = f"<pre>{text}</pre>"

    title = fm.get("title", md_path.stem.replace("-", " ").title())
    slug  = kit.get("slug", "")

    html = f"""<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{title} — {slug}</title>
<style>
  body{{max-width:800px;margin:40px auto;padding:0 20px;
        font-family:Georgia,serif;color:#1a1a1a;line-height:1.7;}}
  h1,h2,h3{{color:#1a1a1a;}} a{{color:#b8860b;}}
  img{{max-width:100%;}}
  .back{{font-family:sans-serif;font-size:0.85rem;margin-bottom:24px;}}
</style>
</head><body>
<div class="back"><a href="/campaign/{slug}/">← Back to campaign</a></div>
<h1>{title}</h1>
{body_html}
</body></html>"""
    out_path.write_text(html)


def _write_banner_index(banners_dir: Path, slug: str) -> None:
    files = sorted(f.name for f in banners_dir.iterdir() if f.suffix == ".html")
    items = "".join(
        f'<div style="margin:16px 0;border:1px solid #ddd;display:inline-block;">'
        f'<div style="font-size:0.8rem;padding:4px;background:#f0f0f0;">{fn}</div>'
        f'<iframe src="/campaign/{slug}/banners/{fn}" scrolling="no" '
        f'style="border:none;display:block;"></iframe></div>\n'
        for fn in files
    )
    html = f"""<!DOCTYPE html><html><head>
<meta charset="UTF-8"/><title>Banners — {slug}</title>
<style>body{{font-family:sans-serif;padding:20px;background:#fafafa;}}
.back{{margin-bottom:16px;}} a{{color:#b8860b;}}</style>
</head><body>
<div class="back"><a href="/campaign/{slug}/">← Back to campaign</a></div>
<h2>Banner Ads — {slug}</h2>
{items or "<p>No banners found.</p>"}
</body></html>"""
    (banners_dir / "index.html").write_text(html)


def _write_email_index(email_dir: Path, slug: str) -> None:
    files = sorted(f.name for f in email_dir.iterdir() if f.suffix in {".html", ".htm"})
    items = "".join(
        f'<li><a href="/campaign/{slug}/email/{fn}">{fn}</a></li>' for fn in files
    )
    html = f"""<!DOCTYPE html><html><head>
<meta charset="UTF-8"/><title>Email Modules — {slug}</title>
<style>body{{font-family:sans-serif;padding:20px;}} a{{color:#b8860b;}}
li{{margin:8px 0;}}</style>
</head><body>
<a href="/campaign/{slug}/">← Back to campaign</a>
<h2>Email Modules — {slug}</h2>
<ul>{items or "<li>No modules found.</li>"}</ul>
</body></html>"""
    (email_dir / "index.html").write_text(html)


def _alias(src_dir: Path, filename: str, target_dir: Path) -> None:
    """Create a redirect index.html in target_dir pointing to src_dir/filename."""
    src = src_dir / filename
    if not src.exists():
        return
    target_dir.mkdir(parents=True, exist_ok=True)
    # Read and copy
    shutil.copy2(src, target_dir / "index.html")
