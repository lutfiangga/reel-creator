import json
import os
import subprocess
import sys
import textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


W, H, FPS = 1080, 1920, 30


def run(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or "command failed")


def ff_escape(text):
    return str(text or "").replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'").replace("%", "\\%").replace("\n", " ")

def logo_xy(position):
    presets = {"top-right": (92, 4), "top-left": (4, 4), "bottom-right": (92, 86), "bottom-left": (4, 86), "center": (50, 50)}
    if position in presets:
        x, y = presets[position]
    else:
        try:
            x, y = [float(part) for part in str(position).replace("%", "").split(",", 1)]
        except Exception:
            x, y = presets["top-right"]
    return f"(W-w)*{max(0, min(100, x))}/100", f"(H-h)*{max(0, min(100, y))}/100"

def percent_xy(position):
    try:
        x, y = [float(part) for part in str(position).replace("%", "").split(",", 1)]
    except Exception:
        x, y = 8, 28
    return f"w*{max(0, min(100, x))}/100", f"h*{max(0, min(100, y))}/100"

def percent_pair(position, default=(50, 28)):
    try:
        x, y = [float(part) for part in str(position).replace("%", "").split(",", 1)]
        return max(0, min(100, x)), max(0, min(100, y))
    except Exception:
        return default

def hex_color(value, fallback):
    value = str(value or fallback)
    if len(value) == 7 and value.startswith("#"):
        return tuple(int(value[i:i+2], 16) for i in (1, 3, 5))
    return fallback

def load_font(config, size, weight="700", style="normal"):
    font_path = config.get("brand", {}).get("font_path")
    if font_path and os.path.exists(font_path):
        return ImageFont.truetype(font_path, size)
    candidates = []
    if int(weight or 400) >= 700 and style == "italic":
        candidates.append("arialbi.ttf")
    if int(weight or 400) >= 700:
        candidates.append("arialbd.ttf")
    if style == "italic":
        candidates.append("ariali.ttf")
    candidates.append("arial.ttf")
    try:
        for candidate in candidates:
            try:
                return ImageFont.truetype(candidate, size)
            except Exception:
                pass
    except Exception:
        pass
    return ImageFont.load_default()

def text_width(draw, text, font, spacing):
    if not text:
        return 0
    return sum(draw.textlength(ch, font=font) for ch in text) + max(0, len(text) - 1) * spacing

def draw_spaced(draw, xy, text, font, fill, spacing, stroke_width, stroke_fill):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill, stroke_width=stroke_width, stroke_fill=stroke_fill)
        x += draw.textlength(ch, font=font) + spacing

def make_thumbnail_text(config, temp_dir):
    title = config.get("thumbnail_title") or "News Reel"
    brand = config.get("brand", {})
    text_case = brand.get("thumbnail_text_case") or "none"
    if text_case == "uppercase":
        title = title.upper()
    elif text_case == "lowercase":
        title = title.lower()
    elif text_case == "capitalize":
        title = " ".join(word.capitalize() for word in title.split())
    font_size = int(float(brand.get("thumbnail_font_size") or 46))
    spacing = int(float(brand.get("thumbnail_letter_spacing") or 0))
    stroke = int(float(brand.get("thumbnail_outline_width") or 0))
    font = load_font(config, font_size, brand.get("thumbnail_font_weight") or "700", brand.get("thumbnail_font_style") or "normal")
    image = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    box_w = int(W * 0.90)
    max_width = box_w - 68
    words = title.split()
    lines, line = [], ""
    for word in words:
        next_line = f"{line} {word}".strip()
        if text_width(draw, next_line, font, spacing) <= max_width or not line:
            line = next_line
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    widths = [text_width(draw, item, font, spacing) for item in lines]
    line_height = int(font_size * 1.15)
    pad_x, pad_y = 34, 24
    box_h = line_height * len(lines) + pad_y * 2
    x_pct, y_pct = percent_pair(brand.get("thumbnail_position"))
    box_x = int(W * x_pct / 100 - box_w / 2)
    box_y = int(H * y_pct / 100)
    bg = hex_color(brand.get("thumbnail_bg_color"), (0, 29, 255))
    fill = hex_color(brand.get("thumbnail_text_color"), (255, 255, 255))
    outline = hex_color(brand.get("thumbnail_outline_color"), (0, 0, 0))
    draw.rectangle([box_x, box_y, box_x + box_w, box_y + box_h], fill=(*bg, 245))
    for idx, item in enumerate(lines):
        line_x = box_x + (box_w - widths[idx]) / 2
        line_y = box_y + pad_y + idx * line_height
        draw_spaced(draw, (line_x, line_y), item, font, fill, spacing, stroke, outline)
    out = temp_dir / "thumbnail-text.png"
    image.save(out)
    return out

def make_caption_images(config, main_end, temp_dir):
    brand = config.get("brand", {})
    words = (config.get("narration") or "").split()
    words = words[:240] or ["Lorem"]
    text_case = brand.get("caption_text_case") or "none"
    if text_case == "uppercase":
        words = [word.upper() for word in words]
    elif text_case == "lowercase":
        words = [word.lower() for word in words]
    elif text_case == "capitalize":
        words = [word.capitalize() for word in words]
    slot = max(0.12, main_end / max(1, len(words)))
    size = int(float(brand.get("caption_font_size") or 46))
    stroke = max(0, float(brand.get("caption_outline_width") or 0))
    outline_mode = brand.get("caption_outline_mode") or "center"
    spacing = float(brand.get("caption_letter_spacing") or 0)
    active_pad = int(float(brand.get("caption_active_padding") or 8))
    active_radius = int(float(brand.get("caption_active_radius") or 6))
    x_pct, y_pct = percent_pair(brand.get("caption_position"), (50, 78))
    font = load_font(config, size, brand.get("caption_font_weight") or "700", brand.get("caption_font_style") or "normal")
    fill = hex_color(brand.get("caption_text_color"), (255, 255, 255))
    bg = hex_color(brand.get("caption_bg_color"), (0, 0, 0))
    outline = hex_color(brand.get("caption_outline_color"), (0, 0, 0))
    images = []
    for idx, _word in enumerate(words):
        start_idx = (idx // 5) * 5
        chunk = words[start_idx:start_idx + 5]
        active = idx - start_idx
        image = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        gap = 18
        widths = [text_width(draw, word, font, spacing) for word in chunk]
        total_w = sum(widths) + gap * max(0, len(chunk) - 1)
        lane_w = int(W * 0.90)
        lane_x = W * x_pct / 100 - lane_w / 2
        x = lane_x + (lane_w - total_w) / 2
        y = H * y_pct / 100
        for word_idx, word in enumerate(chunk):
            width = widths[word_idx]
            if word_idx == active:
                draw.rounded_rectangle([x - active_pad, y - active_pad, x + width + active_pad, y + size + active_pad], radius=active_radius, fill=(*bg, 225))
            draw_spaced(draw, (x, y), word, font, fill, spacing, int(stroke if outline_mode != "inner" else max(0, stroke / 2)), outline)
            x += width + gap
        path = temp_dir / f"caption-{idx:03d}.png"
        image.save(path)
        start = idx * slot
        end = min(main_end, start + slot)
        images.append((str(path), start, end))
    return images


def crop_filter(extra=""):
    base = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},format=yuv420p"
    return f"{base},{extra}" if extra else base


def download_url(url, target):
    run(["yt-dlp", "-f", "mp4/best", "-o", str(target), url])
    return target


def make_segment(ffmpeg, asset, index, temp_dir):
    duration = max(0.5, float(asset.get("calculated_duration") or asset.get("custom_duration") or 5))
    out = temp_dir / f"segment-{index}.mp4"
    source = asset.get("source_path")
    if asset.get("source_type") == "url":
        source = download_url(asset["url"], temp_dir / f"url-{index}.mp4")

    if asset.get("type") == "image":
        run([ffmpeg, "-y", "-loop", "1", "-i", str(source), "-t", str(duration), "-vf", crop_filter(), "-an", str(out)])
    else:
        start = str(float(asset.get("trim_start") or 0))
        run([ffmpeg, "-y", "-ss", start, "-i", str(source), "-t", str(duration), "-vf", crop_filter(), "-an", str(out)])
    return out


def concat(ffmpeg, clips, out):
    list_file = out.with_suffix(".txt")
    list_file.write_text("".join(f"file '{clip.as_posix()}'\n" for clip in clips), encoding="utf-8")
    run([ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", str(list_file), "-c", "copy", str(out)])


def closing_clip(ffmpeg, config, temp_dir):
    out = temp_dir / "closing.mp4"
    logo = config.get("brand", {}).get("logo_end")
    scale = int(500 * float(config.get("brand", {}).get("logo_end_scale") or 1))
    if logo and os.path.exists(logo):
        run([
            ffmpeg, "-y", "-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:d=5",
            "-i", logo, "-filter_complex", f"[1:v]scale={scale}:-1[logo];[0:v][logo]overlay=(W-w)/2:(H-h)/2",
            "-t", "5", "-an", str(out),
        ])
    else:
        run([ffmpeg, "-y", "-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:d=5", "-t", "5", "-vf", "format=yuv420p", "-an", str(out)])
    return out


def style_and_mux(ffmpeg, config, visual, out, temp_dir):
    main_end = max(0, float(config.get("total_duration") or 0) - 5)
    font = config.get("brand", {}).get("font_path")
    font_opt = f"fontfile='{ff_escape(font)}':" if font and os.path.exists(font) else ""
    thumb_image = config.get("thumbnail_image")
    if not (thumb_image and os.path.exists(thumb_image)):
        thumb_image = str(make_thumbnail_text(config, temp_dir))
    vf = "null"

    inputs = [ffmpeg, "-y", "-i", str(visual)]
    voice = config.get("voice_path")
    has_voice = voice and os.path.exists(voice)
    if has_voice:
        inputs += ["-i", voice]

    overlay = config.get("brand", {}).get("overlay_path")
    logo = config.get("brand", {}).get("logo_top")
    image_inputs = []
    if overlay and os.path.exists(overlay):
        image_inputs.append(("overlay", overlay))
    if thumb_image and os.path.exists(thumb_image):
        image_inputs.append(("thumbnail", thumb_image))
    if logo and os.path.exists(logo):
        image_inputs.append(("logo", logo))
    for image, start, end in make_caption_images(config, main_end, temp_dir):
        image_inputs.append(("caption", image, start, end))
    for item in image_inputs:
        inputs += ["-i", item[1]]

    if image_inputs:
        chain = ["[0:v]null[v0]"]
        current = "v0"
        base_index = 2 if has_voice else 1
        for offset, item in enumerate(image_inputs):
            kind = item[0]
            idx = base_index + offset
            out_label = f"v{offset + 1}"
            if kind == "overlay":
                chain.append(f"[{idx}:v]scale={W}:{H},format=rgba[ov{idx}];[{current}][ov{idx}]overlay=0:0:enable='lt(t,{main_end})'[{out_label}]")
            elif kind == "thumbnail":
                chain.append(f"[{idx}:v]scale={W}:{H},format=rgba[th{idx}];[{current}][th{idx}]overlay=0:0:enable='eq(n,0)'[{out_label}]")
            elif kind == "caption":
                chain.append(f"[{idx}:v]format=rgba[cap{idx}];[{current}][cap{idx}]overlay=0:0:enable='between(t,{item[2]:.2f},{item[3]:.2f})'[{out_label}]")
            else:
                x, y = logo_xy(config.get("brand", {}).get("logo_position"))
                scale = int(190 * float(config.get("brand", {}).get("logo_top_scale") or 1))
                chain.append(f"[{idx}:v]scale={scale}:-1[lg{idx}];[{current}][lg{idx}]overlay={x}:{y}:enable='lt(t,{main_end})'[{out_label}]")
            current = out_label
        chain.append(f"[{current}]{vf}[v]")
        cmd = inputs + ["-filter_complex", ";".join(chain), "-map", "[v]"]
    else:
        cmd = inputs + ["-vf", vf, "-map", "0:v"]

    if has_voice:
        cmd += ["-map", "1:a", "-c:a", "aac"]
    else:
        cmd += ["-an"]
    cmd += ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)]
    run(cmd)


def render(config):
    ffmpeg = config.get("ffmpeg_path") or "ffmpeg"
    output = Path(config["output_path"])
    output.parent.mkdir(parents=True, exist_ok=True)
    temp_dir = output.parent.parent / "temp" / f"render-{config['project_id']}"
    temp_dir.mkdir(parents=True, exist_ok=True)

    clips = []
    for index, asset in enumerate(config.get("assets", [])):
        clips.append(make_segment(ffmpeg, asset, index, temp_dir))
        print(f"PROGRESS {20 + index * 40 // max(1, len(config.get('assets', [])))}", flush=True)

    if not clips:
        blank = temp_dir / "blank.mp4"
        run([ffmpeg, "-y", "-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:d=5", "-vf", "format=yuv420p", "-an", str(blank)])
        clips.append(blank)

    clips.append(closing_clip(ffmpeg, config, temp_dir))
    visual = temp_dir / "visual.mp4"
    concat(ffmpeg, clips, visual)
    print("PROGRESS 75", flush=True)
    style_and_mux(ffmpeg, config, visual, output, temp_dir)
    print("PROGRESS 100", flush=True)
    return {"output_path": str(output)}


if __name__ == "__main__":
    try:
        arg = sys.argv[1] if len(sys.argv) > 1 else "{}"
        config = json.loads(Path(arg).read_text(encoding="utf-8") if os.path.exists(arg) else arg)
        print(json.dumps(render(config)))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        raise
