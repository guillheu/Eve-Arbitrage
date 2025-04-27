import gleam/dict.{type Dict}
import gleam/float
import gleam/int
import gleam/list
import gleam/result
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

pub fn millions_to_unit_string(from: Int) -> String {
  let thousands = int_to_segments([], from)
  let #(value, units) = case thousands {
    [] -> panic as "shouldnt be able to find an empty value"
    [v] -> #(v, "M")
    [_, ..v] -> #(v |> list.reverse |> string.concat, "B")
  }
  value <> " " <> units
}

pub fn ints_to_string(from: List(Int)) -> String {
  list.map(from, fn(value) { value |> int.to_string <> "," })
  |> string.concat
}

pub fn string_to_ints(from: String) -> Result(List(Int), Nil) {
  from
  |> string.drop_end(1)
  |> string.split(",")
  |> list.map(int.parse)
  |> result.all
}

pub fn ints_dict_to_string(from: Dict(Int, List(Int))) -> String {
  use acc, index, ints <- dict.fold(from, "")
  acc <> index |> int.to_string <> ":" <> ints |> ints_to_string <> ";"
}

pub fn string_to_ints_dict(from: String) -> Result(Dict(Int, List(Int)), Nil) {
  // from: "1:1,2,3;2:4,5,6"
  let sections =
    from
    |> string.drop_end(1)
    |> string.split(";")
  // sections: ["1:1,2,3", "2:4,5,6"]

  {
    use section <- list.map(sections)
    // section: "1:1,2,3"
    use #(index_string, int_list_string) <- result.try(string.split_once(
      section,
      ":",
    ))
    // index_string: "1"
    // int_list_string: "1,2,3"
    use index <- result.try(int.parse(index_string))
    // index: 1
    use int_list <- result.map(string_to_ints(int_list_string))
    // int_list: [1, 2, 3]
    #(index, int_list)
  }
  |> result.all
  |> result.map(dict.from_list)
}
