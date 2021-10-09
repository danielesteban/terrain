#### Dependencies

To build/modify the C mesher, you'll need to install LLVM:

 * Win: [https://chocolatey.org/packages/llvm](https://chocolatey.org/packages/llvm)
 * Mac: [https://formulae.brew.sh/formula/llvm](https://formulae.brew.sh/formula/llvm)
 * Linux: [https://releases.llvm.org/download.html](https://releases.llvm.org/download.html)

On the first build, it will complain about a missing file that you can get here:
[libclang_rt.builtins-wasm32-wasi-12.0.tar.gz](https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-12/libclang_rt.builtins-wasm32-wasi-12.0.tar.gz). Just put it on the same path that the error specifies and you should be good to go.

To build [wasi-libc](https://github.com/WebAssembly/wasi-libc), you'll also need to install [GNU make](https://chocolatey.org/packages/make).

#### Build

```bash
# clone this repo and it's submodules
git clone --recursive https://github.com/danielesteban/terrain.git
cd terrain
# install dependencies
npm install
# build wasi-libc
cd core/mesher/wasi-libc && make -j8 && cd ../../..
# build the C mesher
npm run compile
```
