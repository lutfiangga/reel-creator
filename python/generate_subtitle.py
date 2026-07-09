import json
import sys
import textwrap


def generate(text):
    return [{"start": 0, "end": 9999, "text": line} for line in textwrap.wrap(text or "", 42)]


if __name__ == "__main__":
    print(json.dumps({"subtitles": generate(sys.argv[1] if len(sys.argv) > 1 else "")}))
