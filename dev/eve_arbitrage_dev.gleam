import gleam/float
import gleam/int
import gleam/list
import gleam/result
import gleam/string
import simplifile
import yay

const sde_types_filename = "dev/types.yaml"

const target_types_file = "types.txt"

type Ttype {
  Ttype(id: Int, name: String, m3: Float)
}

pub fn main() {
  let assert Ok([doc]) = yay.parse_file(sde_types_filename)
  let assert yay.NodeMap(nodes) = yay.document_root(doc)
    as "Incorrect yaml root node type. Are you sure this is a valid types.yaml from the eve SDE?"

  let contents =
    list.map(nodes, make_ttype)
    |> list.filter_map(fn(found_ttype) {
      found_ttype |> result.map(ttype_to_string)
    })
    |> string.concat

  let assert Ok(_) = simplifile.write(target_types_file, contents)
}

fn make_ttype(node: #(yay.Node, yay.Node)) -> Result(Ttype, yay.ExtractionError) {
  let assert #(yay.NodeInt(id), node_data) = node
    as "Incorrect yaml type node format format. Are you sure this is a valid types.yaml from the eve SDE?"
  let assert Ok(name) = yay.extract_string(node_data, "name.en")
    as {
      "Could not find the `name.en` path for node "
      <> int.to_string(id)
      <> ". Are you sure this is a valid types.yaml from the eve SDE?"
    }
  yay.extract_float(node_data, "volume")
  |> result.map(fn(m3) { Ttype(id, name, m3) })
}

fn ttype_to_string(ttype: Ttype) -> String {
  // #(<id>, "<name>"),
  {
    "    #("
    <> int.to_string(ttype.id)
    <> ",#(\""
    <> { ttype.name |> string.replace("\"", "\\\"") }
    <> "\", "
    <> float.to_string(ttype.m3)
    <> ")),\n"
  }
}
