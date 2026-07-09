import json
import subprocess
import sys


def download(url, output):
    subprocess.run(["yt-dlp", "-f", "mp4/best", "-o", output, url], check=True)
    return {"output": output}


if __name__ == "__main__":
    print(json.dumps(download(sys.argv[1], sys.argv[2])))
