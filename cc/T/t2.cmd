#!/bin/bash
set -e

declare -A FILES=(
    [COM]="com.js $(printf "com/%s.js " CApi CConsole CEncode CParams CPops IniScripts TagsRef)"
    [SND]="snd.js $(printf "snd/%s.js " AO5snd', 'Imgs', 'Prep)"
#    [SND]="$(printf "%s.js " Snd1 Snd2 Snd3)"
#    [SHP]="$(printf "%s.js " Shp1 Shp2 Shp3)"
)

# проверка
for cat in "${!FILES[@]}"; do
    echo "$cat files: ${FILES[$cat]}"
done
