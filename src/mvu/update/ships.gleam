import config/sde
import gleam/dict
import gleam/float
import gleam/int
import gleam/io
import gleam/option.{None, Some}
import gleam/result
import gleam/string
import lustre/effect
import mvu
import mvu/update/side_effects/config_to_storage
import util/element as dom_element

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
  let default_ship_entry =
    mvu.ShipEntry(
      sde.Ship(
        name: "New Ship",
        holds: [
          #(
            model.count_hold_index,
            sde.Hold(name: "Cargo", kind: sde.Generic, capacity: 1000.0),
          ),
        ]
          |> dict.from_list,
      ),
      is_expanded: True,
    )

  let ships =
    dict.insert(model.ships, model.count_ship_index, default_ship_entry)
  let model =
    mvu.Model(
      ..model,
      ships: ships,
      count_ship_index: model.count_ship_index + 1,
      count_hold_index: model.count_hold_index + 1,
    )
  let effect = case model.storage {
    None -> effect.none()
    Some(storage) ->
      effect.batch([
        config_to_storage.write_ship_indices(storage, model.ships |> dict.keys),
        config_to_storage.write_ship_name(
          storage,
          model.count_ship_index - 1,
          "New Ship",
        ),
        config_to_storage.write_hold_indices(
          storage,
          model.ships
            |> dict.map_values(fn(_, ship_entry) {
              ship_entry.ship.holds |> dict.keys
            }),
        ),
        config_to_storage.write_ship_hold_name(
          storage,
          model.count_ship_index - 1,
          model.count_hold_index - 1,
          "Cargo",
        ),
        config_to_storage.write_ship_hold_capacity(
          storage,
          model.count_ship_index - 1,
          model.count_hold_index - 1,
          1000.0,
        ),
        config_to_storage.write_ship_hold_kind(
          storage,
          model.count_ship_index - 1,
          model.count_hold_index - 1,
          sde.Generic,
        ),
      ])
  }
  #(model, effect)
}

pub fn user_deleted_ship(
  model: mvu.Model,
  deleted_ship: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let ships = dict.delete(model.ships, deleted_ship)
  let selected_ship = case model.current_ship {
    Some(id) if id == deleted_ship -> None
    any -> any
  }
  let model = mvu.Model(..model, ships: ships, current_ship: selected_ship)
  let effect = case model.storage {
    None -> effect.none()
    Some(storage) ->
      effect.batch([
        config_to_storage.write_ship_indices(storage, model.ships |> dict.keys),
        config_to_storage.delete_ship(storage, deleted_ship),
        config_to_storage.write_hold_indices(
          storage,
          model.ships
            |> dict.map_values(fn(_, ship_entry) {
              ship_entry.ship.holds |> dict.keys
            }),
        ),
      ])
  }
  #(model, effect)
}

pub fn user_updated_ship_name(
  model: mvu.Model,
  id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let element_id = "ship-name-" <> int.to_string(id)
  let assert Ok(ship) = dict.get(model.ships, id)
  let default_value = ship.ship.name

  let name =
    fetch_input_value_from_element_id_or_default(element_id, default_value)

  let model = {
    let assert Ok(ship_entry) = dict.get(model.ships, id)
    let ship = ship_entry.ship
    let ship = sde.Ship(..ship, name: name)
    let ship_entry = mvu.ShipEntry(..ship_entry, ship: ship)
    mvu.Model(..model, ships: dict.insert(model.ships, id, ship_entry))
  }
  let effect = case model.storage {
    None -> effect.none()
    Some(storage) -> config_to_storage.write_ship_name(storage, id, name)
  }
  #(model, effect)
}

pub fn user_updated_ship_hold_name(
  model: mvu.Model,
  hold_id: Int,
  ship_id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let element_id = "hold-name-" <> int.to_string(hold_id)
  let assert Ok(ship_entry) = dict.get(model.ships, ship_id)
  let ship = ship_entry.ship
  let assert Ok(hold) = dict.get(ship.holds, hold_id)
  let default_value = hold.name
  let name =
    fetch_input_value_from_element_id_or_default(element_id, default_value)
  let hold = sde.Hold(..hold, name: name)
  let holds = dict.insert(ship.holds, hold_id, hold)
  let new_ship = sde.Ship(..ship, holds: holds)
  let ship_entry = mvu.ShipEntry(..ship_entry, ship: new_ship)
  let ship_entries = dict.insert(model.ships, ship_id, ship_entry)
  let model = mvu.Model(..model, ships: ship_entries)

  let effect = case model.storage {
    None -> effect.none()
    Some(storage) ->
      config_to_storage.write_ship_hold_name(storage, ship_id, hold_id, name)
  }
  #(model, effect)
}

pub fn user_updated_ship_hold_capacity(
  model: mvu.Model,
  hold_id: Int,
  ship_id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let element_id = "hold-capacity-" <> int.to_string(hold_id)
  let assert Ok(ship_entry) = dict.get(model.ships, ship_id)
  let ship = ship_entry.ship
  let assert Ok(hold) = dict.get(ship.holds, hold_id)
  let default_value = hold.capacity
  let capacity =
    fetch_float_input_value_from_element_id_or_default(
      element_id,
      default_value,
    )
  let hold = sde.Hold(..hold, capacity: capacity)
  let holds = dict.insert(ship.holds, hold_id, hold)
  let new_ship = sde.Ship(..ship, holds: holds)
  let ship_entry = mvu.ShipEntry(..ship_entry, ship: new_ship)
  let ship_entries = dict.insert(model.ships, ship_id, ship_entry)
  let model = mvu.Model(..model, ships: ship_entries)

  let effect = case model.storage {
    None -> effect.none()
    Some(storage) ->
      config_to_storage.write_ship_hold_capacity(
        storage,
        ship_id,
        hold_id,
        capacity,
      )
  }
  #(model, effect)
}

pub fn user_updated_ship_hold_kind(
  model: mvu.Model,
  hold_kind: String,
  hold_id: Int,
  ship_id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let assert Ok(hold_kind) = sde.hold_kind_from_string(hold_kind)
  let assert Ok(ship_entry) = dict.get(model.ships, ship_id)
  let ship = ship_entry.ship
  let assert Ok(hold) = dict.get(ship.holds, hold_id)
  let hold = sde.Hold(..hold, kind: hold_kind)
  let holds = dict.insert(ship.holds, hold_id, hold)
  let ship = sde.Ship(..ship, holds: holds)
  let ship_entry = mvu.ShipEntry(..ship_entry, ship: ship)
  let ship_entries = dict.insert(model.ships, ship_id, ship_entry)
  let model = mvu.Model(..model, ships: ship_entries)

  let effect = case model.storage {
    None -> effect.none()
    Some(storage) ->
      config_to_storage.write_ship_hold_kind(
        storage,
        ship_id,
        hold_id,
        hold_kind,
      )
  }
  #(model, effect)
}

pub fn user_added_hold_to_ship(
  model: mvu.Model,
  ship_id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let new_hold = sde.Hold(name: "New Hold", kind: sde.Generic, capacity: 100.0)
  let assert Ok(ship_entry) = dict.get(model.ships, ship_id)
  let ship = ship_entry.ship
  let holds = dict.insert(ship.holds, model.count_hold_index, new_hold)
  let ship = sde.Ship(..ship, holds: holds)
  let ship_entry = mvu.ShipEntry(..ship_entry, ship: ship)
  let ship_entries = dict.insert(model.ships, ship_id, ship_entry)
  let model =
    mvu.Model(
      ..model,
      ships: ship_entries,
      count_hold_index: model.count_hold_index + 1,
    )

  let effect = case model.storage {
    None -> effect.none()
    Some(storage) ->
      effect.batch([
        config_to_storage.write_hold_indices(
          storage,
          model.ships
            |> dict.map_values(fn(_, ship_entry) {
              ship_entry.ship.holds |> dict.keys
            }),
        ),
        config_to_storage.write_ship_hold_name(
          storage,
          ship_id,
          model.count_hold_index - 1,
          "New Hold",
        ),
        config_to_storage.write_ship_hold_capacity(
          storage,
          ship_id,
          model.count_hold_index - 1,
          100.0,
        ),
        config_to_storage.write_ship_hold_kind(
          storage,
          ship_id,
          model.count_hold_index - 1,
          sde.Generic,
        ),
      ])
  }
  #(model, effect)
}

pub fn user_deleted_hold_from_ship(
  model: mvu.Model,
  hold_id: Int,
  ship_id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let assert Ok(ship_entry) = dict.get(model.ships, ship_id)
  let holds = dict.delete(ship_entry.ship.holds, hold_id)
  let ship = sde.Ship(..ship_entry.ship, holds: holds)
  let ship_entry = mvu.ShipEntry(..ship_entry, ship: ship)
  let ship_entries = dict.insert(model.ships, ship_id, ship_entry)
  let model = mvu.Model(..model, ships: ship_entries)

  let effect = case model.storage {
    None -> effect.none()
    Some(storage) -> config_to_storage.delete_hold(storage, ship_id, hold_id)
  }
  #(model, effect)
}

pub fn user_collapsed_ship(
  model: mvu.Model,
  ship_id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let assert Ok(ship_entry) = dict.get(model.ships, ship_id)
  let ship_entry = mvu.ShipEntry(..ship_entry, is_expanded: False)
  let ship_entries = dict.insert(model.ships, ship_id, ship_entry)
  let model = mvu.Model(..model, ships: ship_entries)
  #(model, effect.none())
}

pub fn user_expanded_ship(
  model: mvu.Model,
  ship_id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let assert Ok(ship_entry) = dict.get(model.ships, ship_id)
  let ship_entry = mvu.ShipEntry(..ship_entry, is_expanded: True)
  let ship_entries = dict.insert(model.ships, ship_id, ship_entry)
  let model = mvu.Model(..model, ships: ship_entries)
  #(model, effect.none())
}

fn fetch_input_value_from_element_id_or_default(
  element_id: String,
  default_value: String,
) -> String {
  let element_result = dom_element.get_element_by_id(element_id)
  let value_result =
    result.try(element_result, fn(element) { dom_element.value(element) })

  let value = result.unwrap(value_result, default_value)
  case value |> string.trim {
    "" -> default_value
    any -> any
  }
}

fn fetch_float_input_value_from_element_id_or_default(
  element_id: String,
  default_value: Float,
) -> Float {
  let element_result = dom_element.get_element_by_id(element_id)
  let value_result =
    result.try(element_result, fn(element) { dom_element.value(element) })
  let float_parse_result = result.try(value_result, float.parse)
  let int_parse_result =
    result.try(value_result, int.parse) |> result.map(int.to_float)
  let value_result = float_parse_result |> result.or(int_parse_result)

  result.unwrap(value_result, default_value)
}
