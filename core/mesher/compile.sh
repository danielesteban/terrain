#!/bin/sh
cd "${0%/*}"
clang --target=wasm32-unknown-wasi --sysroot=wasi-libc/sysroot -nostartfiles -flto -Ofast \
-Wl,--import-memory -Wl,--no-entry -Wl,--lto-O3 \
-Wl,--export=malloc \
-Wl,--export=mesh \
-o ./mesher.wasm mesher.c
