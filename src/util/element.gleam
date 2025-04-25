pub type Element

@external(javascript, "../element_ffi.mjs", "value")
pub fn value(element: Element) -> Result(String, Nil)

@external(javascript, "../element_ffi.mjs", "getElementById")
pub fn get_element_by_id(id: String) -> Result(Element, Nil)
