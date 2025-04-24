import gleam/javascript/promise.{type Promise}
import lustre/effect
import mvu

pub fn write(text: String) -> effect.Effect(mvu.Msg) {
  use _dispatch <- effect.from()
  promise.await(write_text(text), fn(_clipboard_result) { promise.resolve(Nil) })
  Nil
}

@external(javascript, "../../../clipboard_ffi.mjs", "writeText")
fn write_text(clip_text: String) -> Promise(Result(Nil, String))
