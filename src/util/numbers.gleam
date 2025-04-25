import gleam/float
import gleam/int
import gleam/list
import gleam/string

const thousands_threshold = 10

pub fn int_to_human_string(from: Int) -> String {
  case from / 1000 {
    thousands if thousands > thousands_threshold ->
      int.to_string(thousands) <> "k"
    _ -> int.to_string(from)
  }
}

pub fn float_to_human_string(from: Float) -> String {
  let truncated = float.truncate(from)

  int_to_segments([], truncated)
  |> list.reverse
  |> string.concat
  // |> string.drop_end(1)
}

fn int_to_segments(acc: List(String), from: Int) -> List(String) {
  case from / 1000 {
    x if x > 0 -> {
      let segment =
        "," <> { int.to_string(from % 1000) |> string.pad_start(3, "0") }
      int_to_segments([segment, ..acc], x)
    }
    _x -> [from |> int.to_string, ..acc] |> list.reverse
  }
}
