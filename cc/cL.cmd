#!/bin/bash
set -e

ROOT_DIR="/home/leon/moe/www/oo"
BIN_DIR="$ROOT_DIR/o7"
SRC_DIR="$ROOT_DIR/o7"
LOG_FILE="$ROOT_DIR/cc/log.txt"

echo ROOT="$(realpath "$ROOT_DIR")"
echo BIN= "$(realpath "$BIN_DIR")"
echo SRC= "$(realpath "$SRC_DIR")"
echo log= "$(realpath "$LOG_FILE")"

echo  --- переход в корень и очистка лога ---
cd "$SRC_DIR"
: > "$LOG_FILE"

#
#  базовые модули должны быть последними
#
declare -A FILES=(
    [com]="com.js $(printf "com/%s.js " CApi CConsole CEncode CParams CPops IniScripts TagsRef) "
    [dbg]="dbg.js $(printf "dbg/%s.js " Pos Ccss Logs Utils Events) "
    [snd]="snd.js $(printf "snd/%s.js " AO5snd Imgs Prep) "
    [shp]="shp.js $(printf "shp/%s.js " DoInit PBases AO5shp PO5shp Frames DoChgs ) "
)

echo  выполнение
for cat in "${!FILES[@]}"; do
    echo "$cat files: ${FILES[$cat]}"
    cat ${FILES[$cat]} > "$BIN_DIR"/"$cat"!.js 2>>"$LOG_FILE"
done

echo  --- финал ---
cd "$BIN_DIR"
#
#  o7.js    - должно быть последним
#  com!.js  - желательно дать первым
#
cat com!.js snd!.js shp!.js ref.js inc.js mnu.js pop.js tab.js o7.js > o7!.js  2>>"$LOG_FILE"
echo  --- КОНЕЦ ---  
