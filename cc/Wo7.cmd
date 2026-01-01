#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

# --- базовые пути ---
$ROOT_DIR = Resolve-Path "..\.."
$SRC_DIR  = Join-Path $ROOT_DIR "olga7"
$BIN_DIR  = Join-Path $ROOT_DIR "bin"
$LOG_FILE = Join-Path $ROOT_DIR "cc\log.txt"

# --- файлы модулей ---
$COM_FILES = @(
  "com.js",
  "com/CConsole.js",
  "com/CEncode.js",
  "com/CApi.js",
  "com/CParams.js",
  "com/CPops.js",
  "com/TagsRef.js",
  "com/IniScripts.js"
)

$SND_FILES = @(
  "snd/AO5snd.js",
  "snd/Prep.js",
  "snd/Imgs.js",
  "snd.js"
)

$SHP_FILES = @(
  "shp/AO5shp.js",
  "shp/PO5shp.js",
  "shp/PBases.js",
  "shp/DoInit.js",
  "shp/Frames.js",
  "shp/DoChgs.js",
  "shp.js"
)

$DBG_FILES = @(
  "dbg/Ccss.js",
  "dbg/Events.js",
  "dbg/Logs.js",
  "dbg/Pos.js",
  "dbg/Utils.js",
  "dbg.js"
)

$ADD_FILES = @(
  "inc.js",
  "tab.js",
  "pop.js",
  "mnu.js"
)

# --- подготовка ---
New-Item -ItemType Directory -Force -Path $BIN_DIR | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $LOG_FILE) | Out-Null
Set-Location $SRC_DIR

# --- очистка лога ---
"Build started $(Get-Date)" | Set-Content $LOG_FILE

# --- функция сборки ---
function Build-File {
    param (
        [string]$OutFile,
        [string[]]$Files
    )

    $outPath = Join-Path $BIN_DIR $OutFile

    foreach ($f in $Files) {
        if (-not (Test-Path $f)) {
            "MISSING: $f" | Add-Content $LOG_FILE
            throw "Missing file: $f"
        }
    }

    Get-Content $Files -Encoding UTF8 |
        Set-Content $outPath -Encoding UTF8
}

# --- сборка модулей ---
Build-File "o7com!.js" $COM_FILES
Build-File "o7snd!.js" $SND_FILES
Build-File "o7shp!.js" $SHP_FILES
Build-File "o7dbg!.js" $DBG_FILES
Build-File "o7add!.js" $ADD_FILES
Build-File "o7ref!.js" @("ref.js")

# --- финальный бандл ---
Set-Location $BIN_DIR

Get-Content o7com!.js, o7add!.js, o7ref!.js, o7snd!.js, o7shp!.js -Encoding UTF8 |
    Set-Content o7.js -Encoding UTF8

"Build finished $(Get-Date)" | Add-Content $LOG_FILE
