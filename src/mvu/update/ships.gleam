import config/sde
import gleam/dict
import gleam/int
import gleam/io
import gleam/option.{type Option, Some}
import gleam/result
import gleam/string
import lustre/effect
import mvu
import util/alert
import util/element as dom_element

const default_ship_entry = mvu.ShipEntry(
  sde.Ship(
    name: "New Ship",
    holds: [sde.Hold(name: "Cargo", kind: sde.Generic, m3: 1000.0)],
  ),
  is_expanded: True,
)

pub fn user_selected_ship(
  selected_ship: Int,
  model: mvu.Model,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, current_ship: Some(selected_ship))
  let side_effect = effect.none()
  io.println("Ship #" <> selected_ship |> int.to_string <> " selected")
  #(model, side_effect)
}

pub fn user_created_ship(
  model: mvu.Model,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let ships =
    dict.insert(model.ships, model.count_ship_index, default_ship_entry)
  let model =
    mvu.Model(
      ..model,
      ships: ships,
      count_ship_index: model.count_ship_index + 1,
    )
  #(model, effect.none())
}

pub fn user_deleted_ship(
  model: mvu.Model,
  deleted_ship: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let ships = dict.delete(model.ships, deleted_ship)
  let model = mvu.Model(..model, ships: ships)
  #(model, effect.none())
}

pub fn user_updated_ship_name(
  model: mvu.Model,
  id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let element_id = "ship-name-" <> int.to_string(id)
  let element_result = dom_element.get_element_by_id(element_id)
  let value_result =
    result.try(element_result, fn(element) { dom_element.value(element) })
  let assert Ok(ship) = dict.get(model.ships, id)
  let default_value = ship.ship.name
  let name = result.unwrap(value_result, default_value)
  let name = case name |> string.trim {
    "" -> default_value
    any -> any
  }
  let model = {
    let assert Ok(ship_entry) = dict.get(model.ships, id)
    let ship = ship_entry.ship
    let ship = sde.Ship(..ship, name: name)
    let ship_entry = mvu.ShipEntry(..ship_entry, ship: ship)
    mvu.Model(..model, ships: dict.insert(model.ships, id, ship_entry))
  }
  #(model, effect.none())
}
