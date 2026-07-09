import json
import sys


if __name__ == "__main__":
    print(json.dumps({"segments": [], "source": sys.argv[1] if len(sys.argv) > 1 else None}))
