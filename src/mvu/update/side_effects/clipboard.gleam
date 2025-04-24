import gleam/javascript/promise.{type Promise}

@external(javascript, "../../../clipboard_ffi.mjs", "writeText")
pub fn write_text(clip_text: String) -> Promise(Result(Nil, String))
