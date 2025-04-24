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

pub fn price_to_human_string(from: Float) -> String {
  let truncated = float.truncate(from)

  int_to_segments([], truncated)
  |> list.map(fn(segment) { int.to_string(segment) <> "," })
  |> list.reverse
  |> string.concat
  |> string.drop_end(1)
}

fn int_to_segments(acc: List(Int), from: Int) -> List(Int) {
  case from / 1000 {
    x if x > 0 -> int_to_segments([from % 1000, ..acc], x)
    _x -> [from, ..acc] |> list.reverse
  }
}
