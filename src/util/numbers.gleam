import gleam/int

const thousands_threshold = 10

pub fn int_to_human_string(from: Int) -> String {
  case from / 1000 {
    thousands if thousands > thousands_threshold ->
      int.to_string(thousands) <> "k"
    _ -> int.to_string(from)
  }
}
