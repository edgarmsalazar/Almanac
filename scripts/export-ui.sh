#!/bin/sh
# Copies Almanac's kit (source/almanac/ui/) into a project as <project>/almanac/,
# with a VERSION file saying which Almanac it came from. A folder there that
# holds no VERSION was not made by this script, and is left alone.
#
#   scripts/export-ui.sh ../budget
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
project=${1:?"usage: $0 <project folder>"}
[ -d "$project" ] || { echo "No folder $project" >&2; exit 1; }
dest="$project/almanac"

if [ -e "$dest" ] && [ ! -f "$dest/VERSION" ]; then
  echo "$dest exists and holds no VERSION: not a copy of the kit, so it is left as it is." >&2
  exit 1
fi

version=$(sed -n 's/^version = "\(.*\)"/\1/p' "$root/pyproject.toml")
commit=$(git -C "$root" describe --always --dirty 2>/dev/null || echo unknown)

rm -rf "$dest"
cp -R "$root/source/almanac/ui" "$dest"
find "$dest" -name '.DS_Store' -delete
printf 'Almanac %s, commit %s, copied %s\n' "$version" "$commit" "$(date +%Y-%m-%d)" > "$dest/VERSION"
echo "Copied the kit to $dest ($(cat "$dest/VERSION"))"
