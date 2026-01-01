#!/bin/bash
set -e

ROOT_DIR="../.."
SRC_DIR="$ROOT_DIR/olga7"
BIN_DIR="$ROOT_DIR/bin"
LOG_FILE="$ROOT_DIR/cc/log.txt"

# --- переход в корень ---
cd "SRC_DIR"

# --- очистка лога ---
: > "$LOG_FILE"

# --- Если bin или cc когда-нибудь будут удалены
cat "${COM_FILES[@]}" > "$BIN_DIR/o7com!.js"  2>>"$LOG_FILE"

# --- сборка ---
cat "${COM_FILES[@]}" > "$BIN_DIR/o7com!.js"  2>>"$LOG_FILE"
cat "${SND_FILES[@]}" > "$BIN_DIR/o7snd!.js"  2>>"$LOG_FILE"
cat "${SHP_FILES[@]}" > "$BIN_DIR/o7shp!.js"  2>>"$LOG_FILE"
cat "${DBG_FILES[@]}" > "$BIN_DIR/o7dbg!.js"  2>>"$LOG_FILE"
cat "${ADD_FILES[@]}" > "$BIN_DIR/o7add!.js"  2>>"$LOG_FILE"
cat ref.js            > "$BIN_DIR/o7ref!.js"  2>>"$LOG_FILE"

# --- финальный бандл ---
cd "$BIN_DIR"

cat o7com!.js o7add!.js o7ref!.js o7snd!.js o7shp!.js \
  > o7.js  2>>"$LOG_FILE"
