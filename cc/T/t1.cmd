#!/bin/bash
set -e

# функция для построения файлов из массива модулей и опциональной поддиректории
make_files() {
    local dir=$1; shift
    local files=()
    for mod in "$@"; do
        if [[ $dir ]]; then
            files+=("$dir/$mod.js")
        else
            files+=("$mod.js")
        fi
    done
    echo "${files[@]}"
}

# ассоциативный массив модулей по категориям
declare -A MODULES=(
    [COM]="com CApi CConsole CEncode CParams CPops IniScripts TagsRef"
    [SND]="Snd1 Snd2 Snd3"
    [SHP]="Shp1 Shp2 Shp3"
)

# ассоциативный массив для файлов
declare -A FILES

for cat in "${!MODULES[@]}"; do
    mods=(${MODULES[$cat]})
    # для COM, кроме первого модуля, используем поддиректорию 'com'
    if [[ $cat == "COM" ]]; then
        FILES[$cat]="${mods[0]}.js $(make_files "com" "${mods[@]:1}")"
    else
        FILES[$cat]=$(make_files "" "${mods[@]}")
    fi
done

# проверка
for cat in "${!FILES[@]}"; do
    echo "$cat files: ${FILES[$cat]}"
done
