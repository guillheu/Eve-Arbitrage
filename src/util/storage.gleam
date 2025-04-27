pub type Storage

@external(javascript, "../storage_ffi.mjs", "localStorage")
pub fn local() -> Result(Storage, Nil)

@external(javascript, "../storage_ffi.mjs", "getItem")
pub fn get_item(storage: Storage, key: String) -> Result(String, Nil)

@external(javascript, "../storage_ffi.mjs", "setItem")
pub fn set_item(
  storage: Storage,
  key: String,
  value: String,
) -> Result(Nil, Nil)

@external(javascript, "../storage_ffi.mjs", "removeItem")
pub fn remove_item(storage: Storage, key: String) -> Nil
